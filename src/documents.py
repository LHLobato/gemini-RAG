import os
import tempfile
from langchain_community.document_loaders import PyPDFLoader 
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import Docx2txtLoader
from langchain_community.document_loaders import UnstructuredMarkdownLoader
from langchain_community.document_loaders import CSVLoader
from langchain_community.document_loaders import TextLoader
from pathlib import Path
import shutil 

def saving_disk_temp(file_input):
    """
    Saves a file-like object OR a file path to a temporary file on disk.
    Returns the absolute path of the created temp file.
    """

    filename = getattr(file_input, "name", str(file_input))
    suffix = Path(filename).suffix
    
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
        
        
        if isinstance(file_input, (str, Path)):
            if not os.path.exists(file_input):
                raise FileNotFoundError(f"Path not found: {file_input}")
                
            with open(file_input, "rb") as source_file:
                shutil.copyfileobj(source_file, tmp_file)

        
        elif hasattr(file_input, "read"):
            
            if hasattr(file_input, "seek"):
                try:
                    file_input.seek(0)
                except Exception as e:
                    print(f"Aviso: Não foi possível fazer seek(0): {e}")
                
            shutil.copyfileobj(file_input, tmp_file)
            
        else:
            raise ValueError(f"Unsupported input type: {type(file_input)}")
            
        return tmp_file.name, suffix

def load_document(uploaded_file):
    document = [] 
    
    file_path, extension = saving_disk_temp(uploaded_file)
    file_path = Path(file_path)
    if not file_path.exists():
        raise FileNotFoundError(f"File Not Uploaded: {file_path}")
    
    try:
        
        
        if not extension:
            
            mime_map = {
                'application/pdf': '.pdf',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
                'application/msword': '.doc',
                'text/plain': '.txt',
                'text/markdown': '.md',
                'text/csv': '.csv'
            }
            
            content_type = getattr(uploaded_file, 'type', None)
            extension = mime_map.get(content_type, '')
        

        loader_map = {
            '.pdf': PyPDFLoader,
            '.docx': Docx2txtLoader,
            '.txt': TextLoader,
            '.md': UnstructuredMarkdownLoader,
            '.csv': CSVLoader
        }

        if extension in loader_map:
            document_loader = loader_map[extension](str(file_path))
            document = document_loader.load()
        else:
            print(f"Extension Not supported: {extension}")
            
    except Exception as e:
        print(f"Error: {e}")

    finally: 
        if file_path.exists():
            os.remove(file_path)  
            
    return document

def get_chunks(document, chunk_size=1000, chunk_overlap=150) -> dict:
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)

    pages = text_splitter.split_documents(document)
    chunks = {'id':[], 'text':[], 'page':[]}

    for i, chunk in enumerate(pages):
        chunks['text'].append(chunk.page_content)
        chunks['id'].append(i)
        chunks['page'].append(chunk.metadata.get('page', None))

    return chunks 
