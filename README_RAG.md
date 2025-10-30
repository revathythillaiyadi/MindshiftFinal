# MindShift RAG System - Complete Setup Guide

## Overview
This is a complete RAG (Retrieval-Augmented Generation) system that creates an AI-powered NLP coach named "MindShift" using Sleight of Mouth (SOM) patterns. The system uses LlamaIndex, ChromaDB, and OpenAI to provide intelligent responses to limiting beliefs.

## Features
- 🤖 AI-powered NLP coaching using SOM patterns
- 📚 Document ingestion from .docx files
- 🔍 Vector-based semantic search with ChromaDB
- 💬 Interactive chat interface (CLI and Streamlit)
- 🎯 Pattern recognition and challenging questions
- 💾 Persistent vector storage

## Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Download Real Documents
The actual SOM pattern documents have been downloaded from your Google Drive folder:
```bash
# Documents are already in ./som_documents/ directory
ls som_documents/
```

### 3. Set Up Environment Variables
Create a `.env` file with your OpenAI API key:
```bash
cp env_template.txt .env
# Edit .env and add your OpenAI API key
```

### 4. Test the System
```bash
# Test document loading
python3 test_docs.py

# Test RAG system (requires OpenAI API key)
python3 test_real_rag.py
```

### 5. Run the System

#### Command Line Interface:
```bash
python3 mindshift_rag.py
```

#### Web Interface (Streamlit):
```bash
streamlit run streamlit_app.py
```

## File Structure
```
Mindshift_bolt/
├── mindshift_rag.py          # Main RAG system implementation
├── streamlit_app.py          # Web interface
├── download_documents.py     # Document creation script
├── requirements.txt          # Python dependencies
├── env_example.txt          # Environment variables template
├── som_documents/           # Document storage directory
│   ├── 01_About_Sleight_of_Mouth_SOM_patterns.txt
│   ├── 02_Example_1_SOM_Patterns.txt
│   ├── 03_Example_2_SOM_Patterns.txt
│   ├── 04_Conversation_1_with_MindShift.txt
│   ├── 05_Conversation_2_with_MindShift.txt
│   ├── 06_Conversation_3_with_MindShift.txt
│   ├── 07_Conversation_4_with_MindShift.txt
│   ├── 08_Conversation_5_with_MindShift.txt
│   └── README.md
└── chroma_db/               # Vector database storage
```

## Usage Examples

### Example Limiting Beliefs:
- "I can't succeed because I'm not experienced enough"
- "I'm too old to learn new skills"
- "I don't have enough time to pursue my dreams"
- "I'm not smart enough to start my own business"
- "I always fail at relationships"

### Sample Response:
**User:** "I can't get promoted because I don't have a college degree."

**MindShift:** "I hear that concern about education requirements. Let me ask you this - what if your years of experience are actually more valuable than a piece of paper? Many successful leaders learned through doing rather than studying. What specific skills have you developed through your work experience that might be exactly what your company needs for that promotion?"

## SOM Patterns Used

The system recognizes and applies these Sleight of Mouth patterns:

1. **Cause-Effect Challenge** - Questions assumed relationships
2. **Complex Equivalence Challenge** - Questions assigned meanings
3. **Intention Challenge** - Questions underlying intentions
4. **Redefining Challenge** - Offers alternative definitions
5. **Consequence Challenge** - Questions belief consequences
6. **Chunk Up Challenge** - Moves to higher abstraction
7. **Chunk Down Challenge** - Moves to specific details
8. **Analogy Challenge** - Uses analogies to reframe
9. **Another Outcome Challenge** - Suggests alternatives
10. **Hierarchy of Criteria Challenge** - Questions priorities

## Technical Details

### Dependencies:
- `llama-index` - RAG framework
- `chromadb` - Vector database
- `openai` - Language model
- `streamlit` - Web interface
- `python-docx` - Document parsing
- `python-dotenv` - Environment management

### Architecture:
1. **Document Ingestion** - Loads and parses .docx files
2. **Vector Indexing** - Creates embeddings and stores in ChromaDB
3. **Retrieval** - Semantic search for relevant patterns
4. **Generation** - Uses OpenAI GPT-4 for response generation
5. **Interface** - CLI and web interfaces for interaction

## Customization

### Modify the System Prompt:
Edit the `coaching_prompt` in `mindshift_rag.py` to change how MindShift responds.

### Add New Documents:
1. Place .docx or .txt files in `som_documents/`
2. Restart the system to re-index

### Change Models:
Modify the model settings in `mindshift_rag.py`:
```python
LlamaIndexSettings.embed_model = OpenAIEmbedding(model="text-embedding-3-large")
LlamaIndexSettings.llm = OpenAI(model="gpt-3.5-turbo")
```

## Troubleshooting

### Common Issues:

1. **"OPENAI_API_KEY not set"**
   - Create a `.env` file with your OpenAI API key
   - Ensure the key is valid and has sufficient credits

2. **"Documents directory not found"**
   - Run `python download_documents.py` to create sample documents
   - Or manually create the `som_documents/` directory

3. **"ChromaDB connection error"**
   - Delete the `chroma_db/` directory and restart
   - Check file permissions

4. **"Import errors"**
   - Ensure all dependencies are installed: `pip install -r requirements.txt`
   - Check Python version (3.8+ required)

## Advanced Usage

### Batch Processing:
```python
from mindshift_rag import MindShiftRAG

rag = MindShiftRAG()
rag.initialize_system("./som_documents")

beliefs = [
    "I'm not creative enough",
    "I can't learn new skills",
    "I'm too old to change"
]

for belief in beliefs:
    response = rag.query(belief)
    print(f"Belief: {belief}")
    print(f"Response: {response}\n")
```

### Custom Document Processing:
```python
from llama_index.core import Document
from mindshift_rag import MindShiftRAG

# Create custom documents
custom_docs = [
    Document(text="Your custom SOM pattern content here...")
]

rag = MindShiftRAG()
rag.setup_chromadb()
rag.create_index(custom_docs)
rag.setup_query_engine()
```

## Contributing

To add new SOM patterns or improve the system:

1. Add new pattern examples to the documents
2. Update the coaching prompt for better responses
3. Test with various limiting beliefs
4. Submit improvements via pull request

## License

This project is for educational and personal use. Please respect OpenAI's usage policies and rate limits.

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the error logs
3. Ensure all dependencies are properly installed
4. Verify your OpenAI API key is valid
