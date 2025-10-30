#!/usr/bin/env python3
"""
Test Script for MindShift RAG System
Tests the system with sample limiting beliefs
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_rag_system():
    """Test the RAG system with sample queries"""
    
    # Check if OpenAI API key is set
    if not os.getenv("OPENAI_API_KEY"):
        print("❌ Error: OPENAI_API_KEY environment variable not set")
        print("Please set your OpenAI API key in a .env file")
        return False
    
    try:
        # Import the RAG system
        from mindshift_rag import MindShiftRAG
        
        print("🧠 Initializing MindShift RAG System...")
        
        # Initialize the system
        rag_system = MindShiftRAG()
        
        # Check if documents exist
        docs_directory = "./som_documents"
        if not os.path.exists(docs_directory):
            print(f"❌ Documents directory '{docs_directory}' not found")
            print("Please run: python3 download_documents.py")
            return False
        
        # Initialize the system
        rag_system.initialize_system(docs_directory)
        
        # Get collection stats
        stats = rag_system.get_collection_stats()
        print(f"✅ System initialized! Loaded {stats.get('total_documents', 0)} documents")
        
        # Test queries
        test_beliefs = [
            "I can't succeed because I'm not experienced enough",
            "I'm too old to learn new skills",
            "I don't have enough time to pursue my dreams"
        ]
        
        print("\n" + "="*60)
        print("🧪 Testing MindShift with sample limiting beliefs...")
        print("="*60)
        
        for i, belief in enumerate(test_beliefs, 1):
            print(f"\n📝 Test {i}: {belief}")
            print("-" * 50)
            
            try:
                response = rag_system.query(belief)
                print(f"🤖 MindShift: {response}")
            except Exception as e:
                print(f"❌ Error: {e}")
                return False
        
        print("\n" + "="*60)
        print("✅ All tests completed successfully!")
        print("🎉 MindShift RAG system is working properly!")
        print("="*60)
        
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("Please install required dependencies: pip install -r requirements.txt")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    """Main test function"""
    print("🧪 MindShift RAG System Test")
    print("=" * 40)
    
    success = test_rag_system()
    
    if success:
        print("\n🚀 Ready to use!")
        print("Run the system with:")
        print("  • CLI: python3 mindshift_rag.py")
        print("  • Web: streamlit run streamlit_app.py")
    else:
        print("\n❌ Tests failed. Please check the errors above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
