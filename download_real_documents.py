#!/usr/bin/env python3
"""
Google Drive Document Downloader for MindShift RAG System
Downloads actual SOM pattern documents from Google Drive
"""

import os
import requests
import zipfile
from pathlib import Path
import logging
from urllib.parse import urlparse, parse_qs
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GoogleDriveDownloader:
    """Downloads documents from Google Drive folder"""
    
    def __init__(self, folder_url: str, output_dir: str = "./som_documents"):
        self.folder_url = folder_url
        self.output_dir = Path(output_dir)
        self.session = requests.Session()
        
    def extract_folder_id(self, url: str) -> str:
        """Extract folder ID from Google Drive URL"""
        if 'folders/' in url:
            return url.split('folders/')[1].split('?')[0]
        elif 'id=' in url:
            return url.split('id=')[1].split('&')[0]
        else:
            raise ValueError("Invalid Google Drive folder URL")
    
    def get_folder_contents(self, folder_id: str) -> list:
        """Get list of files in Google Drive folder"""
        try:
            # Use Google Drive API to get folder contents
            api_url = f"https://drive.google.com/drive/folders/{folder_id}"
            
            # Alternative approach: Use gdown for Google Drive downloads
            import subprocess
            import sys
            
            # Install gdown if not available
            try:
                import gdown
            except ImportError:
                logger.info("Installing gdown for Google Drive downloads...")
                subprocess.check_call([sys.executable, "-m", "pip", "install", "gdown"])
                import gdown
            
            # Download folder as zip
            zip_path = self.output_dir / "som_documents.zip"
            gdown.download_folder(self.folder_url, output=str(self.output_dir), quiet=False, use_cookies=False)
            
            logger.info(f"Downloaded folder contents to {self.output_dir}")
            return True
            
        except Exception as e:
            logger.error(f"Error downloading folder: {e}")
            return False
    
    def download_documents(self) -> bool:
        """Download all documents from the Google Drive folder"""
        try:
            # Create output directory
            self.output_dir.mkdir(exist_ok=True)
            
            # Extract folder ID
            folder_id = self.extract_folder_id(self.folder_url)
            logger.info(f"Folder ID: {folder_id}")
            
            # Download folder contents
            success = self.get_folder_contents(folder_id)
            
            if success:
                logger.info("✅ Documents downloaded successfully!")
                return True
            else:
                logger.error("❌ Failed to download documents")
                return False
                
        except Exception as e:
            logger.error(f"Error in download_documents: {e}")
            return False

def manual_download_instructions():
    """Provide manual download instructions"""
    print("""
📁 MANUAL DOWNLOAD INSTRUCTIONS
===============================

Since automatic Google Drive download requires authentication, please follow these steps:

1. Go to: https://drive.google.com/drive/folders/1k9rsWGuIjYBTqmXpE0FKP8LJcnWuXHgp

2. Download these files:
   - 01 About Slight of Mouth & SOM patterns.docx
   - 02 Example 1 SOM Patterns.docx
   - 03 Example 2 SOM Patterns.docx
   - 04 Conversation #1 with MindShift.docx
   - 05 Conversation #2 with MindShift.docx
   - 06 Conversation #3 with MindShift.docx
   - 07 Conversation #4 with MindShift.docx
   - 08 Conversation #5 with MindShift 5.docx

3. Convert .docx files to .txt format:
   - Use online converter: https://www.zamzar.com/convert/docx-to-txt/
   - Or use LibreOffice: File > Export as PDF > Choose Plain Text
   - Or use Microsoft Word: Save As > Plain Text

4. Place all .txt files in the ./som_documents/ directory

5. Run the RAG system: python3 mindshift_rag.py

Alternative: Install python-docx and modify the system to read .docx directly
""")

def create_docx_reader():
    """Create a script to read .docx files directly"""
    docx_reader_code = '''
import os
from pathlib import Path
from docx import Document

def read_docx_files(directory: str) -> dict:
    """Read all .docx files from directory and return content"""
    docs_content = {}
    docs_dir = Path(directory)
    
    if not docs_dir.exists():
        print(f"Directory {directory} does not exist")
        return docs_content
    
    for docx_file in docs_dir.glob("*.docx"):
        try:
            doc = Document(docx_file)
            content = []
            
            for paragraph in doc.paragraphs:
                if paragraph.text.strip():
                    content.append(paragraph.text.strip())
            
            docs_content[docx_file.name] = "\\n".join(content)
            print(f"✅ Read {docx_file.name}: {len(content)} paragraphs")
            
        except Exception as e:
            print(f"❌ Error reading {docx_file.name}: {e}")
    
    return docs_content

if __name__ == "__main__":
    content = read_docx_files("./som_documents")
    print(f"\\nRead {len(content)} documents")
'''
    
    with open("read_docx.py", "w") as f:
        f.write(docx_reader_code)
    
    print("📝 Created read_docx.py for reading .docx files directly")

def main():
    """Main function"""
    print("📥 Google Drive Document Downloader")
    print("=" * 40)
    
    folder_url = "https://drive.google.com/drive/folders/1k9rsWGuIjYBTqmXpE0FKP8LJcnWuXHgp"
    
    # Try automatic download first
    downloader = GoogleDriveDownloader(folder_url)
    
    print("🔄 Attempting automatic download...")
    success = downloader.download_documents()
    
    if not success:
        print("\n⚠️  Automatic download failed. Using manual method...")
        manual_download_instructions()
        create_docx_reader()
        
        print("\n📋 Next steps:")
        print("1. Manually download the .docx files from Google Drive")
        print("2. Place them in ./som_documents/ directory")
        print("3. Install python-docx: pip install python-docx")
        print("4. Run: python3 read_docx.py")
        print("5. Run the RAG system: python3 mindshift_rag.py")

if __name__ == "__main__":
    main()

