'use client';

import React from 'react';

// Simple client-side token storage with basic security measures
// Note: For production, consider using a more secure solution like encrypted cookies

export interface StoredToken {
  token: string;
  expiry?: number;
  created: number;
}

const TOKEN_STORAGE_KEY = 'myboss_github_token';
const TOKEN_EXPIRY_HOURS = 24;

export class TokenStorage {
  static store(token: string, expiry?: number): void {
    if (typeof window === 'undefined') return;
    
    const stored: StoredToken = {
      token,
      expiry: expiry || Date.now() + (TOKEN_EXPIRY_HOURS * 60 * 60 * 1000),
      created: Date.now()
    };

    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(stored));
    } catch (error) {
      console.warn('Failed to store token:', error);
    }
  }

  static retrieve(): string | null {
    if (typeof window === 'undefined') return null;

    try {
      const storedData = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!storedData) return null;

      const stored: StoredToken = JSON.parse(storedData);
      
      // Check if token is expired
      if (stored.expiry && Date.now() > stored.expiry) {
        this.clear();
        return null;
      }

      return stored.token;
    } catch (error) {
      console.warn('Failed to retrieve token:', error);
      this.clear();
      return null;
    }
  }

  static clear(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear token:', error);
    }
  }

  static isStored(): boolean {
    return this.retrieve() !== null;
  }

  static getExpiryTime(): number | null {
    if (typeof window === 'undefined') return null;

    try {
      const storedData = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!storedData) return null;

      const stored: StoredToken = JSON.parse(storedData);
      return stored.expiry || null;
    } catch {
      return null;
    }
  }
}

// Hook for React components
export function useGitHubToken() {
  const [token, setTokenState] = React.useState<string>('');
  const [isStored, setIsStored] = React.useState(false);

  React.useEffect(() => {
    const storedToken = TokenStorage.retrieve();
    if (storedToken) {
      setTokenState(storedToken);
      setIsStored(true);
    }
  }, []);

  const setToken = React.useCallback((newToken: string, remember: boolean = false) => {
    setTokenState(newToken);
    if (remember && newToken) {
      TokenStorage.store(newToken);
      setIsStored(true);
    } else if (!newToken) {
      TokenStorage.clear();
      setIsStored(false);
    }
  }, []);

  const clearToken = React.useCallback(() => {
    setTokenState('');
    TokenStorage.clear();
    setIsStored(false);
  }, []);

  return {
    token,
    setToken,
    clearToken,
    isStored
  };
}