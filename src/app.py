from pathlib import Path
import time
import tempfile
import os
from functools import wraps
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
from documents import load_document, get_chunks
from utils import getting_embeddings, keywords_search, reciprocal_rank_function, send_question, vector_seach

load_dotenv()

app = Flask(__name__)
CORS(app)

API_ACCESS_TOKEN = os.getenv("API_ACCESS_TOKEN")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

USER_SESSIONS = {}
MAX_SESSIONS = 20  
SESSION_TIMEOUT = 1800 

def cleanup_sessions():
    """Remove usuários inativos para liberar memória"""
    current_time = time.time()
    expired_sessions = [
        sid for sid, data in USER_SESSIONS.items() 
        if current_time - data['last_active'] > SESSION_TIMEOUT
    ]
            
    for sid in expired_sessions:
        file_path = Path(USER_SESSIONS[sid]['documents'])
        if file_path.exists():
            os.remove(file_path)  
        del USER_SESSIONS[sid]
    
    if len(USER_SESSIONS) > MAX_SESSIONS:
        oldest = min(USER_SESSIONS.keys(), key=lambda k: USER_SESSIONS[k]['last_active'])
        del USER_SESSIONS[oldest]

def require_api_key(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token_recebido = request.headers.get('X-Api-Key')
        
        if not API_ACCESS_TOKEN:
            return jsonify({"error": "Servidor mal configurado (sem token)"}), 500
            
        if token_recebido != API_ACCESS_TOKEN:
            return jsonify({"error": "Acesso negado: Chave inválida"}), 401
            
        return f(*args, **kwargs)
    return decorated_function

@app.route("/", methods=['GET'])
def home():
    return jsonify({"status": "API Online", "sessions_active": len(USER_SESSIONS)})

@app.route("/upload", methods=['POST'])
@require_api_key
def upload_document():
    session_id = request.headers.get('X-Session-ID')
    
    if not session_id:
        return jsonify({"error": "ID de sessão é obrigatório (X-Session-ID)"}), 400

    if 'file' not in request.files:
        return jsonify({"error": "Nenhum arquivo enviado"}), 400
    
    file = request.files['file']

    try:
        cleanup_sessions()
        

        file.name = file.filename 
        
        document = load_document(file)
        chunks = get_chunks(document=document)
        df = pd.DataFrame(chunks)
        
        if df.empty:
             return jsonify({"error": "Não foi possível extrair texto do PDF (arquivo vazio ou ilegível)."}), 400
        
        chunks_text = df['text'].tolist()
        chunk_embeddings = getting_embeddings(GOOGLE_API_KEY, chunks=chunks_text)
        
        USER_SESSIONS[session_id] = {
            "df": df,
            "embeddings": chunk_embeddings,
            "last_active": time.time(), 
            "documents": [file.name]
        }
        
        return jsonify({
                "message": "Processamento concluído com sucesso!", 
                "total_chunks": len(df),
                "session_id": session_id
            }), 200 

    except Exception as e:
        print(f"Erro no upload: {e}")
        return jsonify({"error": f"Erro interno ao processar arquivo: {str(e)}"}), 500

@app.route("/ask", methods=['POST'])
@require_api_key
def ask_question():
    session_id = request.headers.get('X-Session-ID')
    data = request.json
    question = data.get('question')

    if not session_id or session_id not in USER_SESSIONS:
         return jsonify({"error": "Sessão não encontrada. Por favor, faça o upload do documento novamente."}), 404

    try:
        user_data = USER_SESSIONS[session_id]
        df = user_data["df"]
        chunk_embeddings = user_data["embeddings"]
        user_data["last_active"] = time.time() # Atualiza timer

        q_embedding = getting_embeddings(GOOGLE_API_KEY, [question])
        vector_results = vector_seach(q_embedding, chunk_embeddings, df)
        keyword_results = keywords_search(question, df)

        vector_ids = [item['original_index'] for item in vector_results]
        keyword_ids = [item['original_index'] for item in keyword_results]
        
        final_ids = reciprocal_rank_function([vector_ids, keyword_ids])

        top_ids = final_ids[:10]
        final_chunks = df.iloc[top_ids]['text'].tolist()

        resposta = send_question(GOOGLE_API_KEY, question, final_chunks)

        return jsonify({"answer": resposta}), 200

    except Exception as e:
        print(f"Erro na pergunta: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)