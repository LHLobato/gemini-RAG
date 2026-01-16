import { AppState, ApiConfig, Document } from './types';
import { generateSessionId, generateId } from './utils';
import { loadConfig, loadSessionId, saveSessionId } from './services/storage';

export class AppStateManager {
  private state: AppState;
  private config: ApiConfig;
  private listeners: ((state: AppState, config: ApiConfig) => void)[] = [];

  constructor() {
    this.config = loadConfig();
    const savedSessionId = loadSessionId();

    this.state = {
      sessionId: savedSessionId || generateSessionId(),
      currentDocument: null,
      isLoading: false,
      messages: [],
      hasDocument: false,
    };

    saveSessionId(this.state.sessionId);
  }

  getState(): AppState {
    return { ...this.state };
  }

  getConfig(): ApiConfig {
    return { ...this.config };
  }

  setConfig(config: Partial<ApiConfig>): void {
    this.config = { ...this.config, ...config };
    this.notifyListeners();
  }

  setDocument(doc: Document | null): void {
    this.state.currentDocument = doc;
    this.state.hasDocument = !!doc;
    this.notifyListeners();
  }

  getDocument(): Document | null {
    return this.state.currentDocument;
  }

  setLoading(isLoading: boolean): void {
    this.state.isLoading = isLoading;
    this.notifyListeners();
  }

  addMessage(text: string, sender: 'user' | 'assistant'): void {
    this.state.messages.push({
      id: generateId(),
      text,
      sender,
      time: new Date(),
    });
    this.notifyListeners();
  }

  getMessages() {
    return [...this.state.messages];
  }

  clearMessages(): void {
    this.state.messages = [];
    this.notifyListeners();
  }

  newSession(): void {
    this.state.sessionId = generateSessionId();
    this.state.currentDocument = null;
    this.state.hasDocument = false;
    this.state.messages = [];
    saveSessionId(this.state.sessionId);
    this.notifyListeners();
  }

  subscribe(
    listener: (state: AppState, config: ApiConfig) => void
  ): () => void {
    this.listeners.push(listener);

    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      listener(this.getState(), this.getConfig());
    });
  }
}
