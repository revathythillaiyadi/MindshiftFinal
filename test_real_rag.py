#!/usr/bin/env python3
"""
Test the RAG system with actual documents
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_rag_with_real_docs():
    """Test the RAG system with actual documents"""
    
    # Check if OpenAI API key is set
    if not os.getenv("OPENAI_API_KEY"):
        print("❌ OPENAI_API_KEY not set. Please set it in .env file")
        print("You can get an API key from: https://platform.openai.com/api-keys")
        return False
    
    try:
        from mindshift_rag import MindShiftRAG
        
        print("🧠 Testing MindShift RAG with real documents...")
        
        # Initialize the system
        rag_system = MindShiftRAG()
        
        # Initialize with actual documents
        docs_directory = "./som_documents"
        rag_system.initialize_system(docs_directory)
        
        # Get collection stats
        stats = rag_system.get_collection_stats()
        print(f"✅ System initialized! Loaded {stats.get('total_documents', 0)} documents")
        
        # Test with a simple query
        test_belief = "I can't succeed because I'm not experienced enough"
        
        print(f"\n🧪 Testing with: '{test_belief}'")
        print("-" * 60)
        
        response = rag_system.query(test_belief)
        print(f"🤖 MindShift Response:\n{response}")
        
        print("\n✅ RAG system is working with real documents!")
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("Please install required dependencies: pip install -r requirements.txt")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    test_rag_with_real_docs()

