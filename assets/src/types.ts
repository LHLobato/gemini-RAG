export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  time: Date;
}

export interface Document {
  name: string;
  size: number;
  uploadedAt: Date;
  chunks: number;
}

export interface AppState {
  sessionId: string;
  currentDocument: Document | null;
  isLoading: boolean;
  messages: Message[];
  hasDocument: boolean;
}

export interface ApiConfig {
  API_ENDPOINT: string;
  API_KEY: string;
}

export interface UploadResponse {
  message: string;
  total_chunks: number;
  session_id: string;
}

export interface AskResponse {
  answer: string;
}

export interface ErrorResponse {
  error: string;
}
