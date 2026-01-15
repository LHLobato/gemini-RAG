from utils import getting_embeddings, send_question, vector_seach, keywords_search, reciprocal_rank_function
from documents import load_document, get_chunks 
import pandas as pd 
import sys 
from dotenv import load_dotenv
import os 

load_dotenv()


API_KEY = os.getenv("GOOGLE_API_KEY")
with open("../teste_fake.docx", "rb") as f:
    document = load_document(f)


chunks_policy = get_chunks(document=document)

df = pd.DataFrame(chunks_policy)

question = sys.argv[1]

print("Gerando embeddings dos chunks...")
chunks_text = df['text'].tolist()
chunk_embeddings = getting_embeddings(API_KEY, chunks_text)

print(f"\nPergunta: {question}")

q_embedding = getting_embeddings(API_KEY, [question]) 
vector_results = vector_seach(q_embedding, chunk_embeddings, df)

keyword_results = keywords_search(question, df)

vector_ids = [item['original_index'] for item in vector_results]
keyword_ids = [item['original_index'] for item in keyword_results]

final_ids = reciprocal_rank_function([vector_ids, keyword_ids])

final_chunks = df.iloc[final_ids[:10]]['text'].tolist()

print("\nGerando resposta com LLM...")
resposta_final = send_question(API_KEY, question, final_chunks)

print("\n--- RESPOSTA FINAL ---")
print(resposta_final)