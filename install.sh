#!/bin/bash
# MindShift RAG System Installation Script

echo "🧠 MindShift RAG System Installation"
echo "====================================="

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip3."
    exit 1
fi

echo "✅ pip3 found"

# Install requirements
echo "📦 Installing Python dependencies..."
pip3 install -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Create sample documents
echo "📚 Creating sample documents..."
python3 download_documents.py

if [ $? -eq 0 ]; then
    echo "✅ Sample documents created"
else
    echo "❌ Failed to create sample documents"
    exit 1
fi

# Check for .env file
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found"
    echo "📝 Creating .env file from template..."
    cp env_example.txt .env
    echo "🔑 Please edit .env and add your OpenAI API key"
    echo "   You can get an API key from: https://platform.openai.com/api-keys"
else
    echo "✅ .env file found"
fi

echo ""
echo "🎉 Installation completed!"
echo ""
echo "Next steps:"
echo "1. Edit .env file and add your OpenAI API key"
echo "2. Test the system: python3 test_rag.py"
echo "3. Run the CLI version: python3 mindshift_rag.py"
echo "4. Run the web version: streamlit run streamlit_app.py"
echo ""
echo "📖 For more information, see README_RAG.md"
