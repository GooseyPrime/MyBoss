#!/usr/bin/env tsx
import { spawn } from 'child_process';
import fetch from 'node-fetch';

const DEFAULT_PORT = 3000;
const HEALTH_CHECK_URL = `http://localhost:${DEFAULT_PORT}/api/health`;
const MAX_RETRIES = 30; // 30 seconds max wait
const RETRY_INTERVAL = 1000; // 1 second between retries

export async function waitForHealth(url: string = HEALTH_CHECK_URL, maxRetries: number = MAX_RETRIES): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          console.log(`✓ Server is healthy at ${url}`);
          return true;
        }
      }
    } catch {
      // Server not ready yet, continue waiting
    }
    
    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
    }
  }
  
  console.error(`✗ Server failed to become healthy after ${maxRetries} attempts`);
  return false;
}

export async function checkServerRunning(url: string = HEALTH_CHECK_URL): Promise<boolean> {
  try {
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data.ok) {
        console.log(`✓ Server already running and healthy at ${url}`);
        return true;
      }
    }
  } catch {
    // Server not running
  }
  return false;
}

export function startServer(dashboardToken?: string): Promise<{ process: unknown; stop: () => void; wasAlreadyRunning: boolean }> {
  return new Promise(async (resolve, reject) => {
    // First check if server is already running
    const alreadyRunning = await checkServerRunning();
    if (alreadyRunning) {
      // Return a no-op stop function since we didn't start the server
      resolve({ 
        process: null, 
        stop: () => console.log('🔄 Server was already running, not stopping'), 
        wasAlreadyRunning: true 
      });
      return;
    }
    
    console.log('🚀 Starting development server...');
    
    const serverProcess = spawn('pnpm', ['dev'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { 
        ...process.env,
        PORT: String(DEFAULT_PORT),
        // Pass through the dashboard token if provided
        DASHBOARD_TOKEN: dashboardToken || process.env.DASHBOARD_TOKEN || 'devtoken',
        // Use in-memory SQLite for testing if no DATABASE_URL is set
        DATABASE_URL: process.env.DATABASE_URL || 'file::memory:?cache=shared'
      }
    });

    let serverReady = false;

    const stop = () => {
      if (serverProcess && !serverProcess.killed) {
        console.log('🛑 Stopping server...');
        serverProcess.kill('SIGTERM');
        // Give it a moment, then force kill if needed
        setTimeout(() => {
          if (!serverProcess.killed) {
            serverProcess.kill('SIGKILL');
          }
        }, 2000);
      }
    };

    // Handle server output
    serverProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      console.log(output);
      
      // Look for signs that the server is ready
      if (!serverReady && (output.includes('Ready') || output.includes('localhost:' + DEFAULT_PORT) || output.includes('Local:'))) {
        serverReady = true;
        resolve({ process: serverProcess, stop, wasAlreadyRunning: false });
      }
    });

    serverProcess.stderr?.on('data', (data) => {
      const output = data.toString();
      console.error(output);
      
      // If we get EADDRINUSE, the server is probably already running
      if (output.includes('EADDRINUSE')) {
        console.log('🔄 Port already in use, checking if server is already running...');
        // Give a moment and check if server is now available
        setTimeout(async () => {
          const nowRunning = await checkServerRunning();
          if (nowRunning) {
            serverReady = true;
            resolve({ 
              process: null, 
              stop: () => console.log('🔄 Server was already running, not stopping'), 
              wasAlreadyRunning: true 
            });
          } else {
            reject(new Error('Port in use but server not responding to health checks'));
          }
        }, 2000);
      }
    });

    serverProcess.on('error', (error) => {
      console.error('Failed to start server:', error);
      reject(error);
    });

    serverProcess.on('exit', (code) => {
      if (!serverReady) {
        reject(new Error(`Server exited with code ${code} before becoming ready`));
      }
    });

    // Timeout fallback
    setTimeout(() => {
      if (!serverReady) {
        stop();
        reject(new Error('Server startup timeout'));
      }
    }, 30000); // 30 second timeout
  });
}

// If run directly, test the server startup and health check
if (require.main === module) {
  (async () => {
    try {
      const { stop, wasAlreadyRunning } = await startServer();
      
      if (!wasAlreadyRunning) {
        const healthy = await waitForHealth();
        if (healthy) {
          console.log('✅ Server startup test successful');
        } else {
          console.error('❌ Server startup test failed');
          process.exit(1);
        }
      } else {
        console.log('✅ Server was already running and healthy');
      }
      
      stop();
      process.exit(0);
    } catch (error) {
      console.error('Server startup failed:', error);
      process.exit(1);
    }
  })();
}