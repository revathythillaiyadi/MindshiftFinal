#!/usr/bin/env python3
"""
Test script for SOM Data Loading and Embedding Pipeline
Verifies the LangChain implementation works correctly
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_environment():
    """Test if required environment variables are set"""
    print("🔍 Testing environment setup...")
    
    if not os.getenv("OPENAI_API_KEY"):
        print("❌ OPENAI_API_KEY not set")
        print("Please create a .env file with your OpenAI API key")
        return False
    
    print("✅ OPENAI_API_KEY is set")
    return True

def test_dependencies():
    """Test if required dependencies are installed"""
    print("🔍 Testing dependencies...")
    
    required_packages = [
        "langchain",
        "langchain_community", 
        "langchain_openai",
        "chromadb",
        "openai",
        "python_dotenv"
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
            print(f"✅ {package}")
        except ImportError:
            print(f"❌ {package}")
            missing_packages.append(package)
    
    if missing_packages:
        print(f"\n❌ Missing packages: {', '.join(missing_packages)}")
        print("Install with: pip install -r requirements_langchain.txt")
        return False
    
    print("✅ All dependencies available")
    return True

def test_documents():
    """Test if documents directory exists and contains files"""
    print("🔍 Testing documents directory...")
    
    docs_dir = Path("./som_documents")
    
    if not docs_dir.exists():
        print("❌ Documents directory not found")
        print("Please ensure ./som_documents/ directory exists with .docx files")
        return False
    
    docx_files = list(docs_dir.glob("*.docx"))
    
    if not docx_files:
        print("❌ No .docx files found in documents directory")
        return False
    
    print(f"✅ Found {len(docx_files)} .docx files:")
    for file in docx_files:
        print(f"  📄 {file.name}")
    
    return True

def test_pipeline():
    """Test the complete pipeline"""
    print("🔍 Testing SOM Data Loading Pipeline...")
    
    try:
        from som_data_loader import SOMDataLoader
        
        # Initialize with test parameters
        data_loader = SOMDataLoader(
            docs_directory="./som_documents",
            collection_name="test_som_mindshift",
            persist_directory="./test_chroma_db",
            chunk_size=500,  # Smaller chunks for testing
            chunk_overlap=100
        )
        
        # Run the pipeline
        results = data_loader.run_pipeline()
        
        if results["success"]:
            print("✅ Pipeline test successful!")
            print(f"📊 Documents loaded: {results['documents_loaded']}")
            print(f"📊 Chunks created: {results['chunks_created']}")
            print(f"📊 Collection stats: {results['collection_stats']}")
            return True
        else:
            print(f"❌ Pipeline test failed: {results['error']}")
            return False
            
    except Exception as e:
        print(f"❌ Pipeline test error: {e}")
        return False

def main():
    """Main test function"""
    print("🧪 SOM Data Loading Pipeline Test Suite")
    print("=" * 50)
    
    tests = [
        ("Environment Setup", test_environment),
        ("Dependencies", test_dependencies),
        ("Documents", test_documents),
        ("Pipeline", test_pipeline)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n📋 Running {test_name} test...")
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} test failed with error: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    print("=" * 50)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
        if result:
            passed += 1
    
    print(f"\n🎯 Overall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! The pipeline is ready to use.")
        print("\n🚀 Next steps:")
        print("1. Run: python3 som_data_loader.py")
        print("2. Use the created vector store for RAG queries")
    else:
        print("❌ Some tests failed. Please fix the issues above.")
        sys.exit(1)

if __name__ == "__main__":
    main()

