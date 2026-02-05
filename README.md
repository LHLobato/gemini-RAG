# Gemini-RAG System

This project features a comprehensive Retrieval-Augmented Generation (RAG) ecosystem designed to perform intelligent queries on technical documents using the Gemini API and a high-performance vector search system.



# 🚀 Methodology

The system operates through a natural language processing pipeline divided into four main stages:

    Ingestion & Chunking: Documents are loaded and fragmented into smaller pieces (chunks) using overlapping strategies to preserve semantic context.

    Embedding Generation: Each fragment is converted into a high-dimensional numerical vector through integrated embedding models.

    Vector Search: Vectors are stored in an index (FAISS), allowing the system to retrieve the most relevant fragments via cosine similarity at the moment a query is made.

    Contextual Generation: The retrieved content is injected into the Gemini API prompt, which generates a precise response based exclusively on the provided data.

# 🛠️ System Architecture

The project is built on a decoupled architecture to ensure scalability and performance:

    Backend (Flask API): Acts as the intelligence core of the system. This Python-based API is responsible for:

        Managing secure communication with the Gemini API.

        Executing document processing and RAG logic.

        Orchestrating vector search and embedding database maintenance.

    Frontend: A modern user interface that allows document uploads and real-time chat interaction.

# 💻 Tech Stack

    Language: Python

    Web Framework: Flask (API) & React (Interface)

    LLM: Google Gemini API

    Orchestration: LangChain

    Vector Database: FAISS

# 🚀 Getting Started
1. Backend Configuration

```sh
cd src
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

2. Frontend Configuration
```sh
npm install
npm run dev
```

The project is currently online, with the Flask API running at Render, and the Front-End in Github Pages: https://lhlobato.github.io/gemini-RAG/
