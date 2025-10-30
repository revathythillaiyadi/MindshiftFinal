import streamlit as st
import os
import logging
from mindshift_rag import MindShiftRAG
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Page configuration
st.set_page_config(
    page_title="MindShift NLP Coach",
    page_icon="🧠",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS
st.markdown("""
<style>
    .main-header {
        font-size: 3rem;
        color: #1f77b4;
        text-align: center;
        margin-bottom: 2rem;
    }
    .chat-message {
        padding: 1rem;
        border-radius: 10px;
        margin: 1rem 0;
        border-left: 4px solid #1f77b4;
    }
    .user-message {
        background-color: #f0f2f6;
        border-left-color: #ff6b6b;
    }
    .bot-message {
        background-color: #e8f4fd;
        border-left-color: #1f77b4;
    }
    .stButton > button {
        background-color: #1f77b4;
        color: white;
        border-radius: 20px;
        border: none;
        padding: 0.5rem 2rem;
        font-weight: bold;
    }
    .stButton > button:hover {
        background-color: #0d5aa7;
    }
</style>
""", unsafe_allow_html=True)

@st.cache_resource
def initialize_rag_system():
    """Initialize the RAG system with caching"""
    try:
        rag_system = MindShiftRAG()
        
        # Check if documents directory exists
        docs_directory = "./som_documents"
        if not os.path.exists(docs_directory):
            st.error(f"Documents directory '{docs_directory}' not found.")
            st.info("Please download the SOM pattern documents and place them in this directory.")
            return None
        
        # Initialize the system
        rag_system.initialize_system(docs_directory)
        
        # Get collection stats
        stats = rag_system.get_collection_stats()
        st.success(f"✅ RAG System Initialized! Loaded {stats.get('total_documents', 0)} documents")
        
        return rag_system
        
    except Exception as e:
        st.error(f"Error initializing RAG system: {e}")
        return None

def main():
    """Main Streamlit application"""
    
    # Header
    st.markdown('<h1 class="main-header">🧠 MindShift NLP Coach</h1>', unsafe_allow_html=True)
    st.markdown("### Transform your limiting beliefs with Sleight of Mouth patterns")
    
    # Check for OpenAI API key
    if not os.getenv("OPENAI_API_KEY"):
        st.error("❌ OPENAI_API_KEY environment variable not set")
        st.info("Please set your OpenAI API key in a .env file or environment variable")
        return
    
    # Initialize RAG system
    rag_system = initialize_rag_system()
    
    if rag_system is None:
        return
    
    # Sidebar
    with st.sidebar:
        st.header("📚 About MindShift")
        st.markdown("""
        MindShift is an AI-powered NLP coach that uses **Sleight of Mouth (SOM)** patterns 
        to help you reframe limiting beliefs and develop more empowering perspectives.
        
        ### How it works:
        1. Share your limiting belief
        2. MindShift identifies relevant SOM patterns
        3. Receive powerful questions to challenge your belief
        4. Transform your perspective!
        """)
        
        st.header("🎯 Example Limiting Beliefs")
        example_beliefs = [
            "I can't succeed because I'm not experienced enough",
            "I'm too old to learn new skills",
            "I don't have enough time to pursue my dreams",
            "I'm not smart enough to start my own business",
            "I always fail at relationships"
        ]
        
        for belief in example_beliefs:
            if st.button(f"💭 {belief}", key=f"example_{belief}"):
                st.session_state.user_input = belief
    
    # Main chat interface
    st.header("💬 Chat with MindShift")
    
    # Initialize session state
    if "messages" not in st.session_state:
        st.session_state.messages = []
    
    # Display chat history
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])
    
    # Chat input
    if prompt := st.chat_input("Share your limiting belief..."):
        # Add user message to chat history
        st.session_state.messages.append({"role": "user", "content": prompt})
        
        # Display user message
        with st.chat_message("user"):
            st.markdown(prompt)
        
        # Generate and display assistant response
        with st.chat_message("assistant"):
            with st.spinner("MindShift is thinking..."):
                try:
                    response = rag_system.query(prompt)
                    st.markdown(response)
                    st.session_state.messages.append({"role": "assistant", "content": response})
                except Exception as e:
                    error_msg = f"I apologize, but I encountered an error: {e}"
                    st.error(error_msg)
                    st.session_state.messages.append({"role": "assistant", "content": error_msg})
    
    # Footer
    st.markdown("---")
    st.markdown("""
    <div style='text-align: center; color: #666;'>
        <p>Powered by LlamaIndex, ChromaDB, and OpenAI | Built with Streamlit</p>
    </div>
    """, unsafe_allow_html=True)

if __name__ == "__main__":
    main()
