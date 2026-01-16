import { ApiClient } from "./services/api"; // Certo (procura dentro do src)
import { AppStateManager } from './state';
import { DocumentUI } from './components/document-ui';
import { MessageUI } from './components/message-ui';
import { saveConfig } from './services/storage';
import { truncateText } from './utils';

export class RagChatApp {
  private stateManager: AppStateManager;
  private apiClient: ApiClient;
  private elements: Record<string, HTMLElement | null> = {};
  private currentLoadingMessage: HTMLElement | null = null;

  constructor() {
    this.stateManager = new AppStateManager();
    const config = this.stateManager.getConfig();
    this.apiClient = new ApiClient();
    this.apiClient.setApiKey(config.API_KEY);
    this.cacheElements();
    this.setupEventListeners();
    this.render();

    // Subscribe to state changes
    this.stateManager.subscribe(() => this.render());
  }

  private cacheElements(): void {
    const elementIds = [
      'apiEndpoint',
      'apiKey',
      'sessionId',
      'uploadZone',
      'fileInput',
      'documentsList',
      'messagesContainer',
      'questionInput',
      'askBtn',
      'clearBtn',
      'newSessionBtn',
      'statusMessages',
      'settingsBtn',
    ];

    elementIds.forEach((id) => {
      this.elements[id] = document.getElementById(id);
    });
  }

  private setupEventListeners(): void {
    // Config inputs
    this.elements['apiEndpoint']?.addEventListener('change', (e) => {
      const endpoint = (e.target as HTMLInputElement).value;
      this.stateManager.setConfig({ API_ENDPOINT: endpoint });
      saveConfig({ API_ENDPOINT: endpoint });
      this.showStatus('API endpoint updated', 'success');
    });

    this.elements['apiKey']?.addEventListener('change', (e) => {
      const key = (e.target as HTMLInputElement).value;
      this.stateManager.setConfig({ API_KEY: key });
      this.apiClient.setApiKey(key);
      saveConfig({ API_KEY: key });
      this.showStatus('API key updated', 'success');
    });

    // Upload zone
    this.elements['uploadZone']?.addEventListener('click', () => {
      this.elements['fileInput']?.click();
    });

    this.elements['fileInput']?.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        this.handleUpload(file);
        (e.target as HTMLInputElement).value = '';
      }
    });

    // Drag and drop
    this.elements['uploadZone']?.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.elements['uploadZone']?.classList.add('dragover');
    });

    this.elements['uploadZone']?.addEventListener('dragleave', () => {
      this.elements['uploadZone']?.classList.remove('dragover');
    });

    this.elements['uploadZone']?.addEventListener('drop', (e) => {
      e.preventDefault();
      this.elements['uploadZone']?.classList.remove('dragover');
      const file = e.dataTransfer?.files?.[0];
      if (file) {
        this.handleUpload(file);
      }
    });

    // Question input
    this.elements['questionInput']?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const state = this.stateManager.getState();
        if (!state.isLoading) {
          this.handleQuestion();
        }
      }
    });

    // Buttons
    this.elements['askBtn']?.addEventListener('click', () => {
      const state = this.stateManager.getState();
      if (!state.isLoading) {
        this.handleQuestion();
      }
    });

    this.elements['clearBtn']?.addEventListener('click', () => {
      const input = this.elements['questionInput'] as HTMLTextAreaElement;
      if (input) {
        input.value = '';
      }
      this.stateManager.clearMessages();
    });

    this.elements['newSessionBtn']?.addEventListener('click', () => {
      if (confirm('Start a new session? (Current document will be cleared)')) {
        this.stateManager.newSession();
        this.render();
        this.showStatus('New session created', 'success');
      }
    });

    this.elements['settingsBtn']?.addEventListener('click', () => {
      this.showSettings();
    });
  }

  private async handleUpload(file: File): Promise<void> {
    const state = this.stateManager.getState();
    const config = this.stateManager.getConfig();

    if (!config.API_KEY) {
      this.showStatus('Please set your API Key first', 'error');
      return;
    }

    const uploadZone = this.elements['uploadZone'];
    const originalContent = uploadZone?.innerHTML;

    try {
      this.stateManager.setLoading(true);
      uploadZone!.innerHTML = '<div class="spinner"></div>';

      this.apiClient.setApiKey(config.API_KEY);
      const response = await this.apiClient.uploadFile(file);

      this.stateManager.setDocument({
        name: file.name,
        size: file.size,
        uploadedAt: new Date(),
        chunks: response.total_chunks,
      });

      this.showStatus(
        `Document uploaded successfully! (${response.total_chunks} chunks)`,
        'success'
      );
      this.stateManager.clearMessages();
    } catch (error) {
      this.showStatus(
        `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      );
    } finally {
      this.stateManager.setLoading(false);
      if (uploadZone) {
        uploadZone.innerHTML = originalContent || '';
      }
    }
  }

  private async handleQuestion(): Promise<void> {
    const state = this.stateManager.getState();
    const config = this.stateManager.getConfig();
    const input = this.elements['questionInput'] as HTMLTextAreaElement;
    const question = input?.value.trim() || '';

    if (!question) {
      this.showStatus('Please enter a question', 'error');
      return;
    }

    if (!state.hasDocument) {
      this.showStatus('Please upload a document first', 'error');
      return;
    }

    if (!config.API_KEY) {
      this.showStatus('Please set your API Key first', 'error');
      return;
    }

    try {
      this.stateManager.setLoading(true);
      const askBtn = this.elements['askBtn'] as HTMLButtonElement;
      if (askBtn) askBtn.disabled = true;

      // Add user message
      this.stateManager.addMessage(question, 'user');
      if (input) input.value = '';

      // Add loading message
      const messagesContainer = this.elements['messagesContainer'];
      this.currentLoadingMessage = MessageUI.renderLoadingMessage();
      messagesContainer?.appendChild(this.currentLoadingMessage);
      this.scrollToBottom();

      // Get response
      this.apiClient.setApiKey(config.API_KEY);
      const response = await this.apiClient.askQuestion(question);

      // Debug: log the response to see what we're getting
      console.log('API Response:', response);

      // Remove loading message and add actual response
      this.currentLoadingMessage?.remove();
      
      // Extract answer from response - handle different formats
      const answerText = response?.answer || response?.text || response?.response || '';
      
      if (answerText && typeof answerText === 'string' && answerText.trim()) {
        this.stateManager.addMessage(answerText, 'assistant');
      } else {
        console.error('Invalid response format:', response);
        this.showStatus('Invalid response from API', 'error');
      }
    } catch (error) {
      this.currentLoadingMessage?.remove();
      this.showStatus(
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      );
    } finally {
      this.stateManager.setLoading(false);
      const askBtn = this.elements['askBtn'] as HTMLButtonElement;
      if (askBtn) askBtn.disabled = false;
      (this.elements['questionInput'] as HTMLTextAreaElement)?.focus();
    }
  }

  private render(): void {
    this.renderConfig();
    this.renderSessionInfo();
    this.renderDocuments();
    this.renderMessages();
    this.updateButtonStates();
  }

  private renderConfig(): void {
    const config = this.stateManager.getConfig();
    const apiEndpoint = this.elements['apiEndpoint'] as HTMLInputElement;
    const apiKey = this.elements['apiKey'] as HTMLInputElement;

    if (apiEndpoint && apiEndpoint.value !== config.API_ENDPOINT) {
      apiEndpoint.value = config.API_ENDPOINT;
    }

    if (apiKey && apiKey.value !== config.API_KEY) {
      apiKey.value = config.API_KEY;
    }
  }

  private renderSessionInfo(): void {
    const state = this.stateManager.getState();
    const sessionIdEl = this.elements['sessionId'];
    if (sessionIdEl) {
      sessionIdEl.textContent = state.sessionId;
      sessionIdEl.title = state.sessionId;
    }
  }

  private renderDocuments(): void {
    const state = this.stateManager.getState();
    const container = this.elements['documentsList'];

    if (!container) return;

    container.innerHTML = '';

    if (!state.currentDocument) {
      container.appendChild(DocumentUI.renderNoDocuments());
    } else {
      container.appendChild(DocumentUI.renderDocumentItem(state.currentDocument));
    }
  }

  private renderMessages(): void {
    const state = this.stateManager.getState();
    const container = this.elements['messagesContainer'];

    if (!container) return;

    if (state.messages.length === 0) {
      container.innerHTML = '';
      container.appendChild(DocumentUI.renderEmptyState());
    } else {
      container.innerHTML = '';
      state.messages.forEach((message) => {
        container.appendChild(MessageUI.renderMessage(message));
      });
      this.scrollToBottom();
    }
  }

  private updateButtonStates(): void {
    const state = this.stateManager.getState();
    const askBtn = this.elements['askBtn'] as HTMLButtonElement;
    const clearBtn = this.elements['clearBtn'] as HTMLButtonElement;
    const input = this.elements['questionInput'] as HTMLTextAreaElement;

    if (askBtn) askBtn.disabled = state.isLoading || !state.hasDocument;
    if (clearBtn) clearBtn.disabled = state.isLoading;
    if (input) input.disabled = state.isLoading;
  }

  private showStatus(message: string, type: 'success' | 'error' | 'info' | 'warning'): void {
    const container = this.elements['statusMessages'];
    if (!container) return;

    const statusEl = MessageUI.renderStatusMessage(message, type);
    container.innerHTML = '';
    container.appendChild(statusEl);

    setTimeout(() => {
      if (container.contains(statusEl)) {
        statusEl.remove();
      }
    }, 5000);
  }

  private showSettings(): void {
    const state = this.stateManager.getState();
    const config = this.stateManager.getConfig();

    alert(
      `RAG Chat - Settings\n\n` +
        `API Endpoint: ${config.API_ENDPOINT}\n` +
        `API Key: ${config.API_KEY ? '••••••••' : 'Not set'}\n` +
        `Session ID: ${truncateText(state.sessionId, 20)}\n\n` +
        `Update the API endpoint and key in the header to change settings.`
    );
  }

  private scrollToBottom(): void {
    const container = this.elements['messagesContainer'];
    if (container) {
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 0);
    }
  }

  static initialize(): void {
    const init = () => {
      new RagChatApp();
      console.log('🧠 RAG Chat Application initialized');
    };

    // Check if DOM is already loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      // DOM is already loaded
      init();
    }
  }
}
