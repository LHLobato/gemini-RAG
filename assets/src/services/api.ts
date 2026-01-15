// src/services/api.ts

export class ApiClient {
    private baseUrl: string;
    private apiKey: string | null;
    private sessionId: string | null;

    constructor() {
        // TROQUE PELA URL DO RENDER QUANDO SUBIR
        // Para teste local, use localhost:10000
        this.baseUrl = "http://127.0.0.1:10000"; 
        
        this.apiKey = localStorage.getItem("rag_api_key");
        this.sessionId = localStorage.getItem("rag_session_id");

        if (!this.sessionId) {
            this.sessionId = crypto.randomUUID();
            localStorage.setItem("rag_session_id", this.sessionId);
        }
    }

    setApiKey(key: string) {
        this.apiKey = key;
        localStorage.setItem("rag_api_key", key);
    }

    getApiKey(): string | null {
        return this.apiKey;
    }

    logout() {
        this.apiKey = null;
        localStorage.removeItem("rag_api_key");
    }

    async checkHealth(): Promise<boolean> {
        try {
            const res = await fetch(`${this.baseUrl}/`);
            return res.ok;
        } catch (error) {
            return false;
        }
    }

    async uploadFile(file: File): Promise<any> {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`${this.baseUrl}/upload`, {
            method: "POST",
            headers: {
                "X-Api-Key": this.apiKey || "",
                "X-Session-ID": this.sessionId || ""
            },
            body: formData
        });

        return res.json();
    }

    async askQuestion(question: string): Promise<any> {
        const res = await fetch(`${this.baseUrl}/ask`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Api-Key": this.apiKey || "",
                "X-Session-ID": this.sessionId || ""
            },
            body: JSON.stringify({ question })
        });

        return res.json();
    }
}