from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from typing import List, Dict
import json

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

class RAGChat:
    def __init__(self):
        self.api_key = os.getenv("GENAI_API_KEY")
        if not self.api_key:
            raise ValueError("API key is missing. Please set GENAI_API_KEY in .env file.")
        
        # Initialize embeddings
        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-mpnet-base-v2"
        )
        
        # Load the vector store
        self.vector_store = Chroma(
            persist_directory="./vector_db",
            embedding_function=self.embeddings
        )
        
        # Initialize retriever
        self.retriever = self.vector_store.as_retriever(
            search_type="similarity",
            search_kwargs={"k": 3}  # You can tweak this number based on your needs
        )
        
        # Initialize LLM
        self.model = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=self.api_key
        )
        
        # Initialize chat history storage
        self.chat_histories: Dict[str, List] = {}

    def get_chat_response(self, question: str) -> str:
        """Generate response using RAG."""
        try:
            # Retrieve relevant documents
            relevant_docs = self.retriever.invoke(question)
            
            # If no documents are found, fallback response
            if not relevant_docs:
                return "Sorry, I couldn't find relevant documents for your query."
            
            # Prepare the context by joining the content of the relevant documents
            context = "\n\n".join([doc.page_content for doc in relevant_docs])
            
            # System and user messages for the prompt
            system_prompt = """You are an AI assistant providing information about government services, 
            legal assistance, and other general inquiries. You have access to relevant documents and 
            can use them to generate accurate responses. Strictly adhere to the information in the documents."""
            
            # Include the context in the system message
            system_message = SystemMessage(content=f"{system_prompt}\n\nContext:\n{context}")
            user_message = HumanMessage(content=question)
            
            # Generate the response
            response = self.model.invoke([system_message, user_message])
            return response.content
        except Exception as e:
            return f"Error: {str(e)}"
        
# Initialize RAGChat instance
rag_chat = RAGChat()

@app.route('/chat', methods=['POST'])
def chat():
    try:
        # Get the incoming message from the request
        data = request.get_json()
        message = data.get('message', '')
        
        if not message:
            return jsonify({'response': 'No message provided'}), 400
        
        # Get the chat response
        response = rag_chat.get_chat_response(message)
        
        return jsonify({'response': response}), 200
    except Exception as e:
        return jsonify({'response': f"Error: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)