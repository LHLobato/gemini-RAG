import { ApiConfig } from '../types';

const STORAGE_PREFIX = 'rag_app_';

export const storageKeys = {
  endpoint: `${STORAGE_PREFIX}endpoint`,
  apiKey: `${STORAGE_PREFIX}api_key`,
  sessionId: `${STORAGE_PREFIX}session_id`,
};

export function saveConfig(config: Partial<ApiConfig>): void {
  if (config.API_ENDPOINT) {
    localStorage.setItem(storageKeys.endpoint, config.API_ENDPOINT);
  }
  if (config.API_KEY) {
    localStorage.setItem(storageKeys.apiKey, config.API_KEY);
  }
}

export function loadConfig(): ApiConfig {
  return {
    API_ENDPOINT: localStorage.getItem(storageKeys.endpoint) || 'http://localhost:5000',
    API_KEY: localStorage.getItem(storageKeys.apiKey) || '',
  };
}

export function saveSessionId(sessionId: string): void {
  localStorage.setItem(storageKeys.sessionId, sessionId);
}

export function loadSessionId(): string | null {
  return localStorage.getItem(storageKeys.sessionId);
}

export function clearSession(): void {
  localStorage.removeItem(storageKeys.sessionId);
}
