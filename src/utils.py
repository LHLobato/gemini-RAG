from google import genai
from google.genai import types
import numpy as np 
import faiss 
from rank_bm25 import BM25Okapi

def send_question(API_KEY, question, chunks):
    if isinstance(chunks, list):
        formatted_chunks = "\n\n".join(chunks) 
    else:
        formatted_chunks = str(chunks)

    sys_instruction = (
        "You are a precise and helpful assistant. "
        "Answer the question using ONLY the provided context. If there's any contradiction, explain it and why."
        "If the answer is not in the context, say 'I cannot find the answer in the documents.'"
    )


    full_prompt = f"""
    <context>
    {formatted_chunks}
    </context>

    Question: {question}
    """

    client = genai.Client(api_key=API_KEY)

    response = client.models.generate_content(
        model="gemini-2.5-flash", 
        contents=full_prompt,
        config=types.GenerateContentConfig(
            system_instruction=sys_instruction,
            temperature=0.5, 
        )
    )
    
    return response.text

def getting_embeddings(API_KEY, chunks:list):
    client = genai.Client(api_key=API_KEY)
    result = client.models.embed_content(
            model="text-embedding-004",
            contents=chunks
    )

    embeddings = [e.values for e in result.embeddings]
    return np.array(embeddings, dtype='float32')

def vector_seach(question_embeddings, chunk_embeddings, df):
    dimension = chunk_embeddings.shape[1]
    index = faiss.IndexFlatIP(dimension)
    index.add(chunk_embeddings)
    k = 10

    D, I = index.search(question_embeddings, k)

    results = []
    for i in range(k):
        idx = I[0][i] 
        score = D[0][i] 
        
        if idx < len(df):
            row = df.iloc[idx].to_dict() 
            row['score'] = score
            row['original_index'] = idx
            results.append(row)
            
    return results

def keywords_search(question, df, k=10):
    tokenized_corpus = [doc.lower().split() for doc in df['text'].tolist()]
    
    bm25 = BM25Okapi(tokenized_corpus)
    tokenized_query = question.lower().split()
    
    
    scores = bm25.get_scores(tokenized_query)
    
    
    top_n_indices = np.argsort(scores)[::-1][:k]
    
    
    results = []
    for idx in top_n_indices:
        
        row = df.iloc[idx].to_dict()
        
        row['score'] = scores[idx]     
        row['original_index'] = idx    
        
        results.append(row)
        
    return results


def reciprocal_rank_function(ranked_lists, k=60)-> list:

    fused_scores = {}

    for rank_list in ranked_lists:
        for rank, doc_id in enumerate(rank_list):
            if doc_id not in fused_scores:
                fused_scores[doc_id] = 0
            fused_scores[doc_id] += 1/(rank + k)

    sorted_chunks_scores = sorted(fused_scores.items(), key=lambda item: item[1], reverse=True)

    return [item[0] for item in sorted_chunks_scores]