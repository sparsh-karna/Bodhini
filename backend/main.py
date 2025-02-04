import os
import numpy as np
import torch
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain_core.documents import Document
from typing import List, Dict
from transformers import AutoModel, AutoTokenizer
import requests

# Load environment variables
load_dotenv()

# Debug print statements to verify environment variables
print("GENAI_API_KEY:", os.getenv("GENAI_API_KEY"))
print("GOOGLE_API_KEY:", os.getenv("GOOGLE_API_KEY"))
print("SARVAM_API_KEY:", os.getenv("SARVAM_API_KEY"))

# Initialize Flask app
app = Flask(__name__)
CORS(app)

class SpeechProcessor:
    def __init__(self):
        self.sarvam_api_key = os.getenv("SARVAM_API_KEY")
        self.google_api_key = os.getenv("GOOGLE_API_KEY")
        
        if not self.sarvam_api_key or not self.google_api_key:
            raise ValueError("API keys are missing. Please set SARVAM_API_KEY and GOOGLE_API_KEY in .env file.")

    def speech_to_text(self, audio_file, language_code='hi-IN'):
        """Convert speech to text using Sarvam AI"""
        url = "https://api.sarvam.ai/speech-to-text"
        
        payload = {
            'model': 'saarika:v1',
            'language_code': language_code,
            'with_timesteps': 'false'
        }
        
        files = [
            ('file', (audio_file.filename, audio_file.read(), 'audio/wav'))
        ]
        
        headers = {
            'api-subscription-key': self.sarvam_api_key
        }
        
        try:
            response = requests.post(url, headers=headers, data=payload, files=files)
            json_response = response.json()
            return json_response.get('transcript', '')
        except requests.exceptions.RequestException as e:
            print(f"Speech-to-Text Error: {e}")
            return None

    def detect_language(self, text):
        """Detect language using Google Translation API"""
        url = "https://translation.googleapis.com/language/translate/v2/detect"
        params = {"key": self.google_api_key}
        data = {"q": text}

        try:
            response = requests.post(url, params=params, json=data)
            response.raise_for_status()
            result = response.json()
            return result["data"]["detections"][0][0]["language"]
        except Exception as e:
            print(f"Language Detection Error: {e}")
            return None

    def translate_text(self, text, target_language="en"):
        """Translate text using Google Translation API"""
        url = "https://translation.googleapis.com/language/translate/v2"
        params = {"key": self.google_api_key}
        data = {"q": text, "target": target_language}

        try:
            response = requests.post(url, params=params, json=data)
            response.raise_for_status()
            result = response.json()
            return result["data"]["translations"][0]["translatedText"]
        except Exception as e:
            print(f"Translation Error: {e}")
            return None

class RAGChat:
    def __init__(self):
        # API Key Setup
        self.api_key = os.getenv("GENAI_API_KEY")
        if not self.api_key:
            raise ValueError("API key is missing. Please set GENAI_API_KEY in .env file.")
        
        # Initialize Embeddings
        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-mpnet-base-v2"
        )
        
        # Initialize Vector Store
        self.vector_store = Chroma(
            persist_directory="./vector_db", 
            embedding_function=self.embeddings
        )
        
        # Initialize Language Model
        self.model = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash", 
            google_api_key=self.api_key
        )
        
        # Chat History Management
        self.chat_histories: Dict[str, List] = {}
        self.MAX_HISTORY_LENGTH = 5

    def cosine_similarity(self, vec1, vec2):
        """Compute cosine similarity between two vectors."""
        vec1 = np.asarray(vec1)
        vec2 = np.asarray(vec2)
        
        dot_product = np.dot(vec1, vec2)
        magnitude1 = np.linalg.norm(vec1)
        magnitude2 = np.linalg.norm(vec2)
        
        if magnitude1 == 0 or magnitude2 == 0:
            return 0.0
        
        return dot_product / (magnitude1 * magnitude2)

    def add_to_chat_history(self, session_id: str, role: str, message: str):
        """Add a message to the session's chat history."""
        if session_id not in self.chat_histories:
            self.chat_histories[session_id] = []
        
        # Maintain maximum history length
        if len(self.chat_histories[session_id]) >= self.MAX_HISTORY_LENGTH * 2:
            self.chat_histories[session_id] = self.chat_histories[session_id][-self.MAX_HISTORY_LENGTH * 2:]
        
        self.chat_histories[session_id].append({
            'role': role,
            'content': message
        })

    def get_chat_context(self, session_id: str) -> str:
        """Compile chat history context."""
        if session_id not in self.chat_histories:
            return ""
        
        history_context = "\nPrevious Conversation Context:\n"
        for msg in self.chat_histories[session_id]:
            history_context += f"{msg['role'].upper()}: {msg['content']}\n"
        
        return history_context

    def hybrid_retrieval(self, question: str, session_id: str = 'default') -> List[Document]:
        """Perform ensemble retrieval using multiple search methods."""
        # Enhance query with chat history context
        history_context = self.get_chat_context(session_id)
        enhanced_query = f"{history_context}\n\nCurrent Question: {question}"

        # Retrieve documents
        try:
            docs = self.vector_store.similarity_search(enhanced_query, k=3)
            
            # Compute and rank documents by relevance
            query_embedding = self.embeddings.embed_query(enhanced_query)
            
            # Score and sort documents
            scored_docs = []
            for doc in docs:
                doc_embedding = self.embeddings.embed_query(doc.page_content)
                similarity_score = self.cosine_similarity(query_embedding, doc_embedding)
                scored_docs.append((doc, similarity_score))
            
            # Sort by relevance
            sorted_docs = sorted(scored_docs, key=lambda x: x[1], reverse=True)
            
            return [doc for doc, _ in sorted_docs]
        
        except Exception as e:
            print(f"Retrieval error: {e}")
            return []

    def get_chat_response(self, question: str, session_id: str = 'default') -> str:
        """Generate response using ensemble retrieval and chat history."""
        try:
            # Add user's question to chat history
            self.add_to_chat_history(session_id, 'user', question)
            
            # Retrieve relevant documents
            relevant_docs = self.hybrid_retrieval(question, session_id)
            
            # Prepare context
            context = "\n\n".join([doc.page_content for doc in relevant_docs])
            
            # Enhanced system prompt
            system_prompt = """You are an AI assistant providing contextual information about government services, 
                        legal assistance, and other general inquiries. Use retrieved documents and previous conversation 
                        context to generate accurate and coherent responses.

                        **Response Formatting:**  
                        - Use Markdown (`.md`) syntax properly.
                        - Use `#` for headings, `-` for lists, `**bold**` for emphasis, and `*italic*` where necessary.
                        - Ensure that all responses adhere to valid Markdown formatting.
                        - Always wrap code snippets in triple backticks (```).

                        ### Example:
                        #### Government Service Information
                        - **Service Name:** XYZ Assistance Program
                        - **Eligibility:** Citizens above 18 years
                        - **Application Link:** [Click Here](https://example.com)

                        Now generate a response strictly in this Markdown format."""  # Add more guidelines as needed
                        
            # Include chat history in system message
            history_context = self.get_chat_context(session_id)
            system_message = SystemMessage(content=f"{system_prompt}\n\nContext:\n{context}\n{history_context}")
            user_message = HumanMessage(content=question)
            
            # Generate response
            response = self.model.invoke([system_message, user_message])
            
            # Add AI's response to chat history
            self.add_to_chat_history(session_id, 'assistant', response.content)
            
            return response.content
        
        except Exception as e:
            print(f"Response generation error: {e}")
            return f"Sorry, I encountered an error: {str(e)}"

# Initialize RAGChat instance
rag_chat = RAGChat()
speech_processor = SpeechProcessor()

@app.route('/speech-to-text', methods=['POST'])
def process_speech():
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file uploaded'}), 400
        
        audio_file = request.files['audio']
        session_id = request.form.get('session_id', 'default')
        
        # Process speech to text
        speech_text = speech_processor.speech_to_text(audio_file)
        
        if not speech_text:
            return jsonify({'error': 'Speech-to-Text processing failed'}), 500
        
        # Detect language
        detected_lang = speech_processor.detect_language(speech_text)
        
        # Translate speech text to English if detected language is not English
        if detected_lang != 'en':
            translated_text = speech_processor.translate_text(speech_text)
            if not translated_text:
                return jsonify({'error': 'Translation failed'}), 500
            speech_text = translated_text
        
        # Get chat response
        response = rag_chat.get_chat_response(speech_text, session_id)
        
        # Translate response back to detected language if necessary
        if detected_lang != 'en':
            response = speech_processor.translate_text(response, target_language=detected_lang)
            if not response:
                return jsonify({'error': 'Translation failed'}), 500
        
        return jsonify({
            'original_text': speech_text,
            'response': response,
            'session_id': session_id
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        message = data.get('message', '')
        session_id = data.get('session_id', 'default')
        
        if not message:
            return jsonify({'response': 'No message provided'}), 400
        
        # Detect language
        detected_lang = speech_processor.detect_language(message)
        
        # Translate message to English if detected language is not English
        if detected_lang != 'en':
            translated_message = speech_processor.translate_text(message)
            if not translated_message:
                return jsonify({'response': 'Translation failed'}), 500
            message = translated_message
        
        response = rag_chat.get_chat_response(message, session_id)
        
        # Translate response back to detected language if necessary
        if detected_lang != 'en':
            response = speech_processor.translate_text(response, target_language=detected_lang)
            if not response:
                return jsonify({'response': 'Translation failed'}), 500
        
        return jsonify({
            'response': response,
            'session_id': session_id
        }), 200
    except Exception as e:
        return jsonify({'response': f"Error: {str(e)}"}), 500

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=False)