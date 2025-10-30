#!/usr/bin/env python3
"""
Simple Google Drive Downloader using gdown
Downloads the actual SOM pattern documents
"""

import os
import subprocess
import sys
from pathlib import Path

def install_gdown():
    """Install gdown package"""
    try:
        import gdown
        print("✅ gdown already installed")
        return True
    except ImportError:
        print("📦 Installing gdown...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "gdown"])
            print("✅ gdown installed successfully")
            return True
        except Exception as e:
            print(f"❌ Failed to install gdown: {e}")
            return False

def download_folder():
    """Download the Google Drive folder"""
    try:
        import gdown
        
        # Create documents directory
        docs_dir = Path("./som_documents")
        docs_dir.mkdir(exist_ok=True)
        
        # Google Drive folder URL
        folder_url = "https://drive.google.com/drive/folders/1k9rsWGuIjYBTqmXpE0FKP8LJcnWuXHgp"
        
        print(f"📥 Downloading folder from: {folder_url}")
        print(f"📁 Saving to: {docs_dir}")
        
        # Download the folder
        gdown.download_folder(
            folder_url, 
            output=str(docs_dir), 
            quiet=False, 
            use_cookies=False
        )
        
        print("✅ Download completed!")
        
        # List downloaded files
        files = list(docs_dir.glob("*"))
        print(f"\n📋 Downloaded {len(files)} files:")
        for file in files:
            print(f"  - {file.name}")
        
        return True
        
    except Exception as e:
        print(f"❌ Download failed: {e}")
        return False

def main():
    """Main function"""
    print("📥 Google Drive SOM Documents Downloader")
    print("=" * 50)
    
    # Install gdown
    if not install_gdown():
        return
    
    # Download folder
    if download_folder():
        print("\n🎉 Success! Documents downloaded.")
        print("\nNext steps:")
        print("1. Install python-docx: pip install python-docx")
        print("2. Test the system: python3 test_rag.py")
        print("3. Run the chatbot: python3 mindshift_rag.py")
    else:
        print("\n❌ Download failed. Please try manual download:")
        print("1. Go to: https://drive.google.com/drive/folders/1k9rsWGuIjYBTqmXpE0FKP8LJcnWuXHgp")
        print("2. Download all .docx files")
        print("3. Place them in ./som_documents/ directory")

if __name__ == "__main__":
    main()

