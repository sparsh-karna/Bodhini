import os
from dotenv import load_dotenv
from langchain_community.vectorstores import Chroma
from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import CharacterTextSplitter
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_huggingface import HuggingFaceEmbeddings
import PyPDF2
import streamlit as st
from datetime import datetime
from langchain.schema import Document

# Load environment variables

load_dotenv()

os.environ["GOOGLE_API_KEY"] = os.getenv("GENAI_API_KEY")


# Initialize session state
if "chat_history" not in st.session_state:
    st.session_state.chat_history = []
if "vector_store" not in st.session_state:
    st.session_state.vector_store = None

# Process PDF to extract text and split it into chunks
def process_pdf(pdf_file):
    pdf_reader = PyPDF2.PdfReader(pdf_file)
    text = ""
    for page in pdf_reader.pages:
        text += page.extract_text()
    
    # Split text into chunks
    text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = text_splitter.split_text(text)
    
    # Create document objects (assuming you have a Document class)
    documents = [Document(page_content=chunk) for chunk in chunks]  # Ensure Document class is defined
    return documents

# Initialize RAG components
def initialize_rag_components(chunks):
    """Initialize the RAG components using HuggingFace embeddings and Gemini LLM"""
    
    # Create embeddings using Hugging Face
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-mpnet-base-v2")
    
    # Create the vector store using Chroma
    vector_store = Chroma.from_documents(
        documents=chunks,  # Ensure chunks are document objects
        embedding=embeddings,
        persist_directory="path_to_your_persist_directory"
    )
    
    # Create retriever
    retriever = vector_store.as_retriever(
        search_type="similarity",
        search_kwargs={"k": 3}
    )
    
    # Define the LLM (Gemini model)
    model = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=os.getenv("GENAI_API_KEY"))
    
    return retriever, model

def get_chat_response(retriever, model, question):
    """Get response from the RAG chain and update chat history."""
    
    # Retrieve relevant documents from the vector store
    relevant_docs = retriever.invoke(question)
    
    # Combine the question and retrieved documents for the model input
    combined_input = (
        "Here are some documents that might help answer the question: "
        + question
        + "\n\nRelevant Documents:\n"
        + "\n\n".join([doc.page_content for doc in relevant_docs])
        + "\n\nPlease provide an answer based only on the provided documents. If the answer is not found in the documents, respond with 'I'm not sure'."
    )

    # Define the messages for the Gemini model
    messages = [
        SystemMessage(content="You are a helpful assistant."),
        HumanMessage(content=combined_input),
    ]
    
    # Invoke the Gemini model
    result = model.invoke(messages)
    
    return result.content

# Streamlit UI
st.title("Research Paper Chat Assistant")
st.write("Upload a PDF research paper and start chatting!")

# File upload
uploaded_file = st.file_uploader("Choose a PDF file", type="pdf")

if uploaded_file is not None:
    # Process PDF if not already processed
    if st.session_state.vector_store is None:
        with st.spinner("Processing PDF..."):
            chunks = process_pdf(uploaded_file)
            retriever, model = initialize_rag_components(chunks)
            st.session_state.retriever = retriever
            st.session_state.model = model
            st.session_state.vector_store = True
        st.success("PDF processed successfully!")

    # Chat interface
    if question := st.chat_input("Ask a question about the paper"):
        # Add user message to chat history
        st.session_state.chat_history.append(HumanMessage(content=question))
        
        # Display user message
        with st.chat_message("user"):
            st.write(question)
        
        # Get and display assistant response
        with st.chat_message("assistant"):
            with st.spinner("Thinking..."):
                response = get_chat_response(st.session_state.retriever, st.session_state.model, question)
                st.write(response)
                st.session_state.chat_history.append(AIMessage(content=response))

    # Display chat history
    for message in st.session_state.chat_history[:-2] if st.session_state.chat_history else []:
        with st.chat_message("user" if isinstance(message, HumanMessage) else "assistant"):
            st.write(message.content)

# Add sidebar with instructions
with st.sidebar:
    st.header("Instructions")
    st.write("""
    1. Upload a PDF research paper using the file uploader.
    2. Wait for the paper to be processed.
    3. Ask questions about the paper's content.
    4. The assistant will provide answers based on the paper's content.
    """)
    
    if st.session_state.vector_store is not None:
        if st.button("Clear Chat History"):
            st.session_state.chat_history = []
            st.rerun()
        
        if st.button("Upload New Paper"):
            st.session_state.vector_store = None
            st.session_state.chat_history = []
            st.rerun()
