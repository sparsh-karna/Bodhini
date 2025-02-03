import numpy as np
import torch
from typing import List, Dict
from langchain_chroma import Chroma
from transformers import AutoTokenizer, AutoModel

class EnsembleRetriever:
    def __init__(self, vector_store: Chroma, embeddings):
        """
        Initialize the Ensemble Retriever with a Chroma vector store and existing embeddings.
        
        :param vector_store: Existing Chroma vector store
        :param embeddings: Existing embedding model (e.g., HuggingFaceEmbeddings)
        """
        self.vector_store = vector_store
        self.original_embeddings = embeddings
        
        # Load additional embedding model for ensemble
        self.bge_model = AutoModel.from_pretrained('BAAI/bge-large-en')
        self.bge_tokenizer = AutoTokenizer.from_pretrained('BAAI/bge-large-en')

    def get_bge_embeddings(self, texts: List[str]) -> np.ndarray:
        """
        Generate embeddings using the BGE model.
        
        :param texts: List of input texts
        :return: Numpy array of embeddings
        """
        # Tokenize inputs
        encoded_input = self.bge_tokenizer(
            texts, 
            padding=True, 
            truncation=True,
            max_length=512, 
            return_tensors='pt'
        )
        
        # Generate embeddings
        with torch.no_grad():
            model_output = self.bge_model(**encoded_input)
            embeddings = model_output.last_hidden_state[:, 0, :].numpy()
        
        return embeddings

    def hybrid_search(self, query: str, top_k: int = 5) -> List:
        """
        Perform hybrid search using multiple embedding approaches.
        
        :param query: Input query string
        :param top_k: Number of results to return
        :return: List of retrieved documents
        """
        # Perform semantic search with original embeddings
        original_results = self.vector_store.similarity_search(query, k=top_k)
        
        # Generate embeddings using both models
        original_embedding = self.original_embeddings.embed_query(query)
        bge_embedding = self.get_bge_embeddings([query])[0]
        
        # Combine embeddings (simple averaging)
        combined_embedding = (np.array(original_embedding) + bge_embedding) / 2
        
        # Perform additional similarity search with combined embedding
        combined_results = self.vector_store.similarity_search_by_vector(combined_embedding, k=top_k)
        
        # Combine and deduplicate results
        all_results = original_results + combined_results
        unique_results = []
        seen_ids = set()
        
        for doc in all_results:
            doc_id = id(doc)  # Use object id as a unique identifier
            if doc_id not in seen_ids:
                unique_results.append(doc)
                seen_ids.add(doc_id)
        
        return unique_results[:top_k]

def modify_rag_chat_retriever(rag_chat):
    """
    Modify the existing RAGChat class to use the EnsembleRetriever.
    
    :param rag_chat: Existing RAGChat instance
    :return: Modified RAGChat instance
    """
    # Create the EnsembleRetriever
    ensemble_retriever = EnsembleRetriever(
        vector_store=rag_chat.vector_store, 
        embeddings=rag_chat.embeddings
    )
    
    # Replace the existing retriever with the hybrid search method
    rag_chat.retriever = ensemble_retriever.hybrid_search
    
    return rag_chat