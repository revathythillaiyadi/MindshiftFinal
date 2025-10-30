# MindShift SOM Data Loading and Embedding Pipeline

A complete, modular Python script using **LangChain** that performs the **Data Loading and Embedding** steps, mirroring the n8n 'Load Data Flow' from the [Google Drive folder](https://drive.google.com/drive/folders/1k9rsWGuIjYBTqmXpE0FKP8LJcnWuXHgp).

## 🎯 Overview

This implementation provides a clean, focused data ingestion pipeline that:

1. **File Loading**: Efficiently loads and reads all uploaded `.docx` files (01 through 08)
2. **Text Splitting**: Uses `RecursiveCharacterTextSplitter` for optimal chunking (chunk size: 1000, overlap: 200)
3. **Embedding**: Initializes OpenAI Embeddings model (`text-embedding-3-small`)
4. **Vector Store**: Creates a local persistent ChromaDB collection (`som_mindshift`)

## 📁 File Structure

```
Mindshift_bolt/
├── som_data_loader.py          # Main LangChain data loading pipeline
├── test_som_loader.py          # Test suite for the pipeline
├── requirements_langchain.txt   # LangChain-specific dependencies
├── som_documents/              # Your SOM pattern documents
│   ├── 01 About Slight of Mouth & SOM patterns.docx
│   ├── 02 Example 1 SOM Patterns.docx
│   ├── 03 Example 2 SOM Patterns.docx
│   ├── 04 Conversation #1 with MindShift.docx
│   ├── 05 Conversation #2 with MindShift.docx
│   ├── 06 Conversation #3 with MindShift.docx
│   ├── 07 Conversation #4 with MindShift.docx
│   └── 08 Conversation #5 with MindShift 5.docx
└── chroma_db/                  # Persistent vector database (created after running)
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements_langchain.txt
```

### 2. Set Up Environment Variables

Create a `.env` file with your OpenAI API key:

```bash
# Copy the template
cp env_template.txt .env

# Edit .env and add your API key
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Test the Pipeline

```bash
# Run the test suite
python3 test_som_loader.py
```

### 4. Run the Data Loading Pipeline

```bash
# Execute the main pipeline
python3 som_data_loader.py
```

## 📋 Required Python Libraries

The script requires these specific libraries:

```python
# Core LangChain packages
langchain==0.1.0
langchain-community==0.0.10
langchain-openai==0.0.5

# Document processing
python-docx==1.1.0

# Vector database
chromadb==0.4.22

# OpenAI integration
openai==1.12.0

# Environment management
python-dotenv==1.0.0
```

## 🔧 Configuration Options

The `SOMDataLoader` class supports these configuration parameters:

```python
data_loader = SOMDataLoader(
    docs_directory="./som_documents",      # Path to .docx files
    collection_name="som_mindshift",     # ChromaDB collection name
    persist_directory="./chroma_db",     # Persistent storage location
    chunk_size=1000,                     # Text chunk size
    chunk_overlap=200                    # Overlap between chunks
)
```

## 📊 Pipeline Output

Upon successful completion, the script prints:

```
🎉 Pipeline completed successfully!
📊 Documents loaded: 8
📊 Chunks created: 156
📊 Collection: som_mindshift
📊 Total documents in collection: 156
```

## 🔍 How It Works

### 1. File Loading
- Uses LangChain's `DirectoryLoader` to efficiently load all `.docx` files
- Supports multithreading for faster processing
- Automatically detects and processes document metadata

### 2. Text Splitting
- Implements `RecursiveCharacterTextSplitter` with intelligent separators:
  - `\n\n` (paragraphs)
  - `\n` (lines)
  - ` ` (spaces)
  - `` (characters)
- Optimized chunk size (1000) and overlap (200) for RAG performance

### 3. Embedding Generation
- Uses OpenAI's `text-embedding-3-small` model
- Consistent embedding generation for both storage and retrieval
- Automatic API key validation and error handling

### 4. Vector Store Creation
- Creates persistent ChromaDB collection named `som_mindshift`
- Stores document chunks with their embeddings
- Enables efficient similarity search for RAG queries

## 🧪 Testing

The included test suite verifies:

- ✅ Environment setup (API keys)
- ✅ Dependency installation
- ✅ Document availability
- ✅ Complete pipeline execution

Run tests with:
```bash
python3 test_som_loader.py
```

## 🔄 Integration with RAG System

After running the data loading pipeline, you can use the created vector store for RAG queries:

```python
from langchain.vectorstores import Chroma
from langchain.embeddings import OpenAIEmbeddings

# Load the created vector store
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
vectorstore = Chroma(
    collection_name="som_mindshift",
    embedding_function=embeddings,
    persist_directory="./chroma_db"
)

# Perform similarity search
results = vectorstore.similarity_search("limiting belief", k=5)
```

## 🎯 Key Features

- **Modular Design**: Clean separation of concerns
- **Error Handling**: Comprehensive error checking and logging
- **Progress Tracking**: Detailed logging of each pipeline step
- **Statistics**: Complete metrics on documents and chunks
- **Persistence**: Vector store survives restarts
- **Configurable**: Flexible parameters for different use cases

## 🚨 Troubleshooting

### Common Issues:

1. **"OPENAI_API_KEY not set"**
   - Create `.env` file with your OpenAI API key
   - Get API key from: https://platform.openai.com/api-keys

2. **"No .docx files found"**
   - Ensure `./som_documents/` directory exists
   - Verify files are downloaded from Google Drive

3. **Import errors**
   - Install dependencies: `pip install -r requirements_langchain.txt`
   - Check Python version (3.8+ required)

4. **ChromaDB errors**
   - Delete `./chroma_db/` directory and restart
   - Check file permissions

## 📈 Performance Metrics

Typical performance on the SOM documents:
- **Documents**: 8 .docx files
- **Total Content**: ~61,000 characters
- **Chunks Created**: ~150-200 chunks
- **Processing Time**: 2-5 minutes (depending on API response time)
- **Storage Size**: ~50-100 MB (including embeddings)

## 🔗 Related Files

- `mindshift_rag.py` - Complete RAG system using LlamaIndex
- `streamlit_app.py` - Web interface for the chatbot
- `test_rag.py` - Test suite for the RAG system

## 📝 License

This implementation is for educational and personal use. Please respect OpenAI's usage policies and rate limits.

---

**Note**: This script mirrors the n8n 'Load Data Flow' functionality using pure Python and LangChain, providing a clean, maintainable alternative to workflow-based solutions.

