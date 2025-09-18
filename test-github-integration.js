#!/usr/bin/env node

/**
 * Simple test script to verify GitHub API integration endpoints
 * Usage: node test-github-integration.js [github-token]
 */

const DASHBOARD_URL = process.env.DASHBOARD_URL || 'http://localhost:3000';

async function testReposFetching(token) {
  console.log('🔍 Testing repository fetching...');
  
  try {
    const response = await fetch(`${DASHBOARD_URL}/api/github/repos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`HTTP ${response.status}: ${error.error}`);
    }

    const data = await response.json();
    console.log(`✅ Successfully fetched ${data.count} repositories`);
    
    if (data.repos && data.repos.length > 0) {
      console.log(`📦 Sample repositories:`);
      data.repos.slice(0, 3).forEach(repo => {
        console.log(`   - ${repo.full_name} (${repo.private ? 'private' : 'public'})`);
      });
    }
    
    return data;
  } catch (error) {
    console.error('❌ Repository fetching failed:', error.message);
    return null;
  }
}

async function testMakeComWebhook() {
  console.log('\n📡 Testing Make.com webhook endpoint...');
  
  try {
    const response = await fetch(`${DASHBOARD_URL}/api/webhooks/makecom`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Make.com webhook endpoint is accessible');
    console.log(`📋 Required fields: ${data.required_fields.join(', ')}`);
    
    return data;
  } catch (error) {
    console.error('❌ Make.com webhook test failed:', error.message);
    return null;
  }
}

async function main() {
  const token = process.argv[2];
  
  console.log('🚀 Testing MyBoss GitHub Integration');
  console.log(`📍 Dashboard URL: ${DASHBOARD_URL}`);
  
  if (!token) {
    console.log('\n⚠️  No GitHub token provided. Skipping repository fetch test.');
    console.log('Usage: node test-github-integration.js [github-token]');
  } else {
    console.log('🔐 Using provided GitHub token');
  }
  
  console.log('\n' + '='.repeat(60));
  
  // Test repository fetching if token provided
  if (token) {
    await testReposFetching(token);
  }
  
  // Test Make.com webhook endpoint
  await testMakeComWebhook();
  
  console.log('\n' + '='.repeat(60));
  console.log('🏁 Test completed');
  
  if (!token) {
    console.log('\n💡 To test repository fetching, run:');
    console.log('   node test-github-integration.js ghp_your_token_here');
  }
}

// Handle both direct execution and module usage
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Test script failed:', error);
    process.exit(1);
  });
}

module.exports = { testReposFetching, testMakeComWebhook };