import os
import numpy as np
import time
import re
from fuzzywuzzy import fuzz
import torch
import json
from dotenv import load_dotenv
from werkzeug.utils import secure_filename
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from pymongo import MongoClient
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain_core.documents import Document
from typing import List, Dict
from transformers import AutoModel, AutoTokenizer
import requests
from browser_use import Agent
from browser_use.agent.service import Agent
from browser_use.browser.browser import Browser, BrowserConfig, BrowserContextConfig
import asyncio
from datetime import datetime
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
import tempfile
from database_create import DocumentProcessor
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from typing import List, Dict, Any, Tuple

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Authentication Setup
bcrypt = Bcrypt(app)
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET')
jwt = JWTManager(app)

# MongoDB Setup
client = MongoClient(os.getenv('MONGO_URI'))
db = client['Bodhini']
users_collection = db['Users']

@app.route('/process-pdf', methods=['POST'])
def process_pdf():
    if 'pdf' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['pdf']
    session_id = request.form.get('session_id', 'default_session')
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    if file and file.filename.endswith('.pdf'):
        # Create a temporary file to save the uploaded PDF
        temp_dir = tempfile.mkdtemp()
        file_path = os.path.join(temp_dir, secure_filename(file.filename))
        file.save(file_path)
        
        try:
            # Initialize the document processor with the existing database path
            processor = DocumentProcessor(persist_directory="./vector_db")
            
            # Process the PDF file
            documents = processor.process_pdf(file_path)
            
            if documents:
                # Load the existing vector store
                vector_store = Chroma(
                    persist_directory="./vector_db",
                    embedding_function=processor.embeddings
                )
                
                # Add the new documents to the existing vector store
                vector_store.add_documents(documents)
                
                return jsonify({
                    "response": f"Successfully processed '{file.filename}' and added {len(documents)} chunks to the existing database.",
                    "chunks_processed": len(documents)
                })
            else:
                return jsonify({
                    "response": f"Could not extract any text from '{file.filename}'. Please make sure it's a valid PDF with text content.",
                    "chunks_processed": 0
                })
                
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        finally:
            # Clean up the temporary file
            os.remove(file_path)
            os.rmdir(temp_dir)
    
    return jsonify({"error": "Only PDF files are allowed"}), 400

@app.route('/automate-order', methods=['POST'])
async def automate_order():
    try:
        data = request.get_json()
        order_details = data.get('orderDetails', {})
        
        # First response with required details
        if not order_details:
            required_details = {
                "message": "To process your Amazon order, I need the following essential details:",
                "required_fields": [
                    {
                        "field": "mobile_number",
                        "description": "Your Amazon account mobile number"
                    },
                    {
                        "field": "password",
                        "description": "Your Amazon account password"
                    },
                    {
                        "field": "product",
                        "description": "Product you want to order (e.g., 'iPad')"
                    },
                    {
                        "field": "max_price",
                        "description": "Maximum price you're willing to pay"
                    },
                    {
                        "field": "specific_model",
                        "description": "Specific model preferences (if any)"
                    }
                ],
                "security_note": "Your credentials will be used only for this automation and won't be stored."
            }
            return jsonify(required_details), 200
        
        # Validate required fields
        required_fields = ['mobile_number', 'password', 'product']
        missing_fields = [field for field in required_fields if field not in order_details]
        
        if missing_fields:
            return jsonify({
                "message": f"Missing required fields: {', '.join(missing_fields)}",
                "status": "error"
            }), 400
        
        # Once details are provided, construct the automation task
        task = f"""
        Place an order on Amazon using these steps:
        1. Go to https://amazon.in/
        2. Click on 'hello, sign in' option on top right of the screen
        3. Click on Sign In
        4. Enter the mobile number: {order_details['mobile_number']}
        5. Enter the password: {order_details['password']}
        6. Click on the Search Bar
        7. Fill in '{order_details['product']}' and click on the search icon
        8. Click on 'Add to Cart' button of the first {order_details['product']} visible on screen
        9. Click on 'Go to Cart' button on the right sidebar of the screen
        10. Click on yellow coloured 'Proceed to buy' button on the right side of the screen
        """
        
        if 'max_price' in order_details:
            task += f"\nNote: Only proceed if product price is less than {order_details['max_price']}"
            
        if 'specific_model' in order_details:
            task += f"\nNote: Look for model matching '{order_details['specific_model']}'"
        
        # Initialize browser and agent (as in your original code)
        browser = Browser(
            config=BrowserConfig(
                headless=False,
                disable_security=True,
                new_context_config=BrowserContextConfig(
                    disable_security=True,
                    minimum_wait_page_load_time=1,
                    maximum_wait_page_load_time=10,
                    browser_window_size={
                        'width': 1280,
                        'height': 1100,
                    },
                ),
            )
        )

        llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", api_key=os.getenv("GENAI_API_KEY"))
        
        agent = Agent(
            task=task,
            llm=llm,
            browser=browser,
            validate_output=True,
        )
        
        # Run automation
        history = await agent.run(max_steps=50)
        
        return jsonify({
            "message": "Order automation completed successfully",
            "status": "success",
            "order_summary": {
                "product": order_details['product'],
                "timestamp": str(datetime.now())
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            "message": f"Error in order automation: {str(e)}",
            "status": "error"
        }), 500

# Authentication Routes
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if users_collection.find_one({"email": email}):
        return jsonify({"message": "User already exists"}), 400

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    users_collection.insert_one({"email": email, "password": hashed_password})

    return jsonify({"message": "User registered successfully"}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = users_collection.find_one({"email": email})
    if not user or not bcrypt.check_password_hash(user['password'], password):
        return jsonify({"message": "Invalid credentials"}), 400

    access_token = create_access_token(identity=str(user['_id']))
    return jsonify({"token": access_token, "userId": str(user['_id'])})


# Debug print statements to verify environment variables
# print("GENAI_API_KEY:", os.getenv("GENAI_API_KEY"))
# print("GOOGLE_API_KEY:", os.getenv("GOOGLE_API_KEY"))
# print("SARVAM_API_KEY:", os.getenv("SARVAM_API_KEY"))

# Keyword list
INSURANCE_KEYWORDS = {
    "insurance", "policy", "premium", "claim", "coverage", "benefits", "payout", "sum assured",
    "tenure", "riders", "maturity", "max life", "maxlife", "max life insurance", "maxlife insurance",
    "maxlife claim", "maxlife premium", "maxlife policy", "maxlife customer care", "maxlife payout",
    "maxlife fund value", "maxlife surrender value", "maxlife maturity", "LIC", "Life Insurance Corporation",
    "LIC India", "LIC policy", "LIC premium", "LIC claim", "LIC surrender value", "LIC maturity",
    "LIC pension", "LIC annuity", "LIC loan", "LIC Jeevan", "LIC term plan", "LIC endowment",
    "LIC agent", "LIC customer care", "term plan", "endowment plan", "ULIP", "whole life insurance",
    "pension plan", "child plan", "health insurance", "savings plan", "retirement plan", "investment plan",
    "death claim", "maturity claim", "surrender policy", "lapse policy", "renew policy", "refund premium",
    "settlement", "bonus calculation", "loan against policy", "free-look period", "tax benefits",
    "section 80C", "income tax rebate", "nominee", "sum insured", "accidental cover", "health rider",
    "wealth creation", "financial planning", "policy bond", "fingerprint"
}

def contains_insurance_keywords(query: str) -> bool:
    """Check if the query contains insurance-related keywords with fuzzy matching."""
    words = query.lower().split()
    
    # Direct match
    for word in words:
        if word in INSURANCE_KEYWORDS:
            return True

    # Fuzzy match (checks similarity)
    for keyword in INSURANCE_KEYWORDS:
        if any(fuzz.partial_ratio(word, keyword) > 80 for word in words):
            return True
            
    return False

class SpeechProcessor:
    def __init__(self):
        self.sarvam_api_key = os.getenv("SARVAM_API_KEY")
        self.google_api_key = os.getenv("GOOGLE_API_KEY")
        
        if not self.sarvam_api_key or not self.google_api_key:
            raise ValueError("API keys are missing. Please set SARVAM_API_KEY and GOOGLE_API_KEY in .env file.")

    def speech_to_text(self, audio_file,):
        """Convert speech to text using Sarvam AI"""
        url = "https://api.sarvam.ai/speech-to-text"
        
        payload = {
            'model': 'saarika:v2',
            'language_code': 'unknown',
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
        
class LLMExplainableAI:
    """Provides LLM-generated explanations for AI reasoning and response generation."""
    
    def __init__(self, llm):
        """
        Initialize the Explainable AI module with an LLM.
        
        Args:
            llm: A language model that can be used to generate explanations
        """
        self.llm = llm
        self.parser = JsonOutputParser()
        
    def generate_explanation_prompt(self, query: str, retrieved_docs: List[Dict], 
                                chat_history: List[Dict], response: str) -> str:
        """
        Generate a detailed prompt for the LLM to explain its reasoning process.
        
        Args:
            query: The user's original query
            retrieved_docs: List of retrieved documents with their content and scores
            chat_history: Previous conversation turns
            response: The generated response
            
        Returns:
            A detailed prompt for the explanation LLM
        """
        # Format retrieved documents for the prompt
        docs_formatted = ""
        if retrieved_docs:
            for i, (doc, score) in enumerate(retrieved_docs[:3], 1):  # Limit to top 3 for prompt clarity
                docs_formatted += f"Document {i} (Relevance: {score:.2f}):\n{doc.page_content[:500]}...\n\n"
        else:
            docs_formatted = "No documents were retrieved for this query.\n"
            
        # Format chat history
        history_formatted = ""
        if chat_history and len(chat_history) > 1:  # At least one turn (excluding current)
            history_formatted = "Recent conversation history:\n"
            # Get last 2 turns maximum (4 messages: user, assistant, user, assistant)
            relevant_history = chat_history[:-1][-4:] if len(chat_history) > 4 else chat_history[:-1]
            for msg in relevant_history:
                role = "User" if msg['role'] == 'user' else "Assistant"
                # Truncate very long messages
                content = msg['content']
                if len(content) > 200:
                    content = content[:200] + "..."
                history_formatted += f"{role}: {content}\n"
        else:
            history_formatted = "No prior conversation history.\n"
        
        # Create the prompt for explanation generation
        prompt = f"""You are an explainable AI assistant that helps users understand how a RAG (Retrieval-Augmented Generation) system processes their query.
        
        Here is the information about the current query processing:
        
        USER QUERY:
        "{query}"
        
        RETRIEVED INFORMATION:
        {docs_formatted}
        
        CONVERSATION HISTORY:
        {history_formatted}
        
        GENERATED RESPONSE:
        "{response[:300]}..."
        
        Based on this information, provide a detailed reasoning trace of how the system processed this query and generated the response.
        Be specific and insightful in your explanations. Think step by step.
        
        Structure your reasoning using these components:
        1. Query Analysis: Break down what the user is asking for and identify key concepts, intent, and any domain-specific terminology
        2. Retrieval Analysis: Analyze what information was retrieved, why it's relevant or not relevant, and how the retrieval process worked
        3. Context Integration: Explain how the retrieved information connects with the prior conversation and user's needs
        4. Evidence Evaluation: Assess the quality, relevance, and reliability of the evidence used to form the response
        5. Response Strategy: Describe the approach taken to construct a helpful response based on the available evidence
        
        YOUR OUTPUT MUST BE VALID JSON with the following structure:
        {{
            "query_analysis": "explanation of query understanding",
            "retrieval_analysis": "analysis of retrieved information",
            "context_integration": "how this connects with prior conversation",
            "evidence_evaluation": "assessment of evidence quality",
            "response_strategy": "approach to constructing the response"
        }}
        
        Keep each explanation concise but insightful (1-3 sentences each).
        ONLY GIVE THE JSON OUTPUT NOTHING OTHER THAN THAT.
        """
        return prompt
    
    async def generate_explanation(self, query: str, retrieved_docs: List, 
                               chat_history: List, response: str) -> Dict:
        """
        Generate a complete explanation for the AI's reasoning process using the LLM.
        
        Args:
            query: The user's original query
            retrieved_docs: List of retrieved documents with their content and scores
            chat_history: Previous conversation turns 
            response: The generated response
            
        Returns:
            A dictionary containing explanations for each reasoning step
        """
        try:
            # Create the explanation prompt
            explanation_prompt = self.generate_explanation_prompt(
                query, retrieved_docs, chat_history, response
            )
            
            # Generate the explanation using the LLM
            explanation_message = HumanMessage(content=explanation_prompt)
            llm_response = await self.llm.ainvoke([explanation_message])
            print("Response",  llm_response)
            
            # Parse the JSON response
            try:
                # Try to extract JSON from the response
                explanation_text = llm_response.content
                
                # Handle the case where the LLM might include extra text around the JSON
                if "```json" in explanation_text:
                    json_content = explanation_text.split("```json")[1].split("```")[0].strip()
                elif "```" in explanation_text:
                    json_content = explanation_text.split("```")[1].strip()
                else:
                    json_content = explanation_text
                
                explanation = json.loads(json_content)
                
                # Ensure all required keys are present
                required_keys = ["query_analysis", "retrieval_analysis", "context_integration", 
                                "evidence_evaluation", "response_strategy"]
                for key in required_keys:
                    if key not in explanation:
                        explanation[key] = "No explanation provided for this step."
                
                return explanation
            
            except (json.JSONDecodeError, IndexError) as e:
                print(f"Error parsing explanation JSON: {e}")
                # Fallback explanation if JSON parsing fails
                return {
                    "query_analysis": "The system analyzed your query for key concepts and intent.",
                    "retrieval_analysis": "Relevant information was searched based on your query.",
                    "context_integration": "Your current query was considered in the context of the conversation.",
                    "evidence_evaluation": "Available information was evaluated for relevance and accuracy.",
                    "response_strategy": "A response was formulated based on the most relevant information."
                }
                
        except Exception as e:
            print(f"Error generating explanation: {e}")
            return {
                "query_analysis": "Error generating explanation.",
                "retrieval_analysis": "Error generating explanation.",
                "context_integration": "Error generating explanation.",
                "evidence_evaluation": "Error generating explanation.",
                "response_strategy": "Error generating explanation."
            }

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

        self.explainer = LLMExplainableAI(self.model)

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

    def hybrid_retrieval(self, question: str, session_id: str = 'default') -> Tuple[List, float]:
        """Perform ensemble retrieval using multiple search methods."""
        # Start timing the retrieval process
        start_time = time.time()
        
        # Enhance query with chat history context
        history_context = self.get_chat_context(session_id)
        enhanced_query = f"{question}"

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
            
            # Calculate retrieval time
            retrieval_time = time.time() - start_time
            
            return sorted_docs, retrieval_time
        
        except Exception as e:
            print(f"Retrieval error: {e}")
            retrieval_time = time.time() - start_time
            return [], retrieval_time


    async def get_chat_response(self, question: str, session_id: str = 'default', explain: bool = False) -> Dict:
        """Generate response using ensemble retrieval and chat history with optional explanation."""
        try:
            print(f"Starting response generation for query: {question}")
            
            # Add user's question to chat history
            self.add_to_chat_history(session_id, 'user', question)
            print("Added user message to chat history.")

            context = ""
            insurance_keywords_found = contains_insurance_keywords(question)
            print(f"Insurance keywords found: {insurance_keywords_found}")
            
            # Retrieve relevant documents
            if insurance_keywords_found:
                print("Triggering RAG search...")
                relevant_docs, retrieval_time = self.hybrid_retrieval(question, session_id)
                print(f"Documents retrieved: {len(relevant_docs)}")
                print(f"Retrieval time: {retrieval_time} seconds")
                
                # Extract document content for context
                context = "\n\n".join([doc.page_content for doc, _ in relevant_docs])
                print("Context extracted from documents.")
            else:
                print("Skipping RAG search, directly invoking LLM...")
                context = ""
                relevant_docs, retrieval_time = [], 0
            
            # Enhanced system prompt
            system_prompt = """You are an AI assistant providing contextual information about government services, 
                        personal chatbot and other general inquiries. Use retrieved documents and previous conversation 
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

                        Now generate a response strictly in this Markdown format."""
                            
            # Include chat history in system message
            history_context = self.get_chat_context(session_id)
            print("Chat history context compiled.")
            
            system_message = SystemMessage(content=f"{system_prompt}\n\nContext:\n{context}\n\n{history_context}")
            user_message = HumanMessage(content=question)
            print("System and user messages created.")
            
            # Generate response
            print("Invoking LLM to generate response...")
            response = self.model.invoke([system_message, user_message])
            response_content = response.content
            print("Response generated by LLM.")
            
            # Add AI's response to chat history
            self.add_to_chat_history(session_id, 'assistant', response_content)
            print("Added bot response to chat history.")
            
            result = {"response": response_content}
            
            # Generate explanation if requested
            if explain:
                print("Generating explanation...")
                explanation = await self.explainer.generate_explanation(
                    query=question,
                    retrieved_docs=relevant_docs,
                    chat_history=self.chat_histories.get(session_id, []),
                    response=response_content
                )
                result["explanation"] = explanation
                print("Explanation generated.")
            
            return result
        
        except Exception as e:
            print(f"Response generation error: {e}")
            error_response = {"response": f"Sorry, I encountered an error: {str(e)}"}
            if explain:
                error_response["explanation"] = {
                    "query_analysis": "Error occurred during processing",
                    "retrieval_analysis": "Error occurred during processing",
                    "context_integration": "Error occurred during processing",
                    "evidence_evaluation": "Error occurred during processing",
                    "response_strategy": "Error occurred during processing"
                }
            return error_response


# Initialize RAGChat instance
rag_chat = RAGChat()
speech_processor = SpeechProcessor()

@app.route('/speech-to-text', methods=['POST'])
async def process_speech():
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
        print("Detected language:", detected_lang)
        
        # Translate speech text to English if detected language is not English
        if detected_lang != 'en':
            translated_text = speech_processor.translate_text(speech_text)
            if not translated_text:
                return jsonify({'error': 'Translation failed'}), 500
            speech_text = translated_text
        
        # Get chat response
        response = await rag_chat.get_chat_response(speech_text, session_id)
        
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
async def chat():
    try:
        data = request.get_json()
        message = data.get('message', '')
        session_id = data.get('session_id', 'default')
        explain = data.get('explain', False)  # Extract the explain flag
        
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
        
        # Pass the explain flag to get_chat_response
        response = await rag_chat.get_chat_response(message, session_id, explain=explain)
        
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