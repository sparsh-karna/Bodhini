import os
from typing import List
from langchain.schema import Document
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
import PyPDF2
from langchain.text_splitter import CharacterTextSplitter

class DocumentProcessor:
    def __init__(self, persist_directory: str = "./vector_db"):
        self.persist_directory = persist_directory
        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-mpnet-base-v2"
        )
        
    def process_pdf(self, file_path: str) -> List[Document]:
        """Process a single PDF file and return chunks."""
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text = ""
                for page in pdf_reader.pages:
                    text += page.extract_text()
                
                # Include metadata about the source file
                metadata = {
                    "source": file_path,
                    "file_name": os.path.basename(file_path)
                }
                
                # Split text into chunks
                text_splitter = CharacterTextSplitter(
                    chunk_size=1000,
                    chunk_overlap=200
                )
                chunks = text_splitter.split_text(text)
                
                return [Document(page_content=chunk, metadata=metadata) for chunk in chunks]
        except Exception as e:
            print(f"Error processing {file_path}: {str(e)}")
            return []

    def process_directory(self, root_dir: str) -> List[Document]:
        """Recursively process all PDFs in a directory."""
        all_documents = []
        
        for dirpath, _, filenames in os.walk(root_dir):
            for filename in filenames:
                if filename.endswith('.pdf'):
                    file_path = os.path.join(dirpath, filename)
                    documents = self.process_pdf(file_path)
                    all_documents.extend(documents)
        
        return all_documents

    def create_vector_store(self, documents: List[Document]) -> Chroma:
        """Create and persist the vector store."""
        return Chroma.from_documents(
            documents=documents,
            embedding=self.embeddings,
            persist_directory=self.persist_directory
        )

def main():
    # Initialize processor
    processor = DocumentProcessor()
    
    # Process all documents
    documents = processor.process_directory("/Users/sparshkarna/Downloads/Hackathon")  # Change this to your root directory
    
    if documents:
        # Create and persist vector store
        vector_store = processor.create_vector_store(documents)
        vector_store.persist()
        print(f"Successfully processed {len(documents)} document chunks")
    else:
        print("No documents were processed")

if __name__ == "__main__":
    main()