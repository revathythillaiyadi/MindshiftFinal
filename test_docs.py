#!/usr/bin/env python3
"""
Test script to verify document loading
"""

import os
from pathlib import Path
from docx import Document as DocxDocument

def test_document_loading():
    """Test loading the actual .docx documents"""
    
    docs_dir = Path("./som_documents")
    
    if not docs_dir.exists():
        print("❌ Documents directory not found")
        return False
    
    print("📚 Testing document loading...")
    
    docx_files = list(docs_dir.glob("*.docx"))
    print(f"Found {len(docx_files)} .docx files:")
    
    total_content = 0
    
    for docx_file in docx_files:
        try:
            doc = DocxDocument(docx_file)
            content_parts = []
            
            for paragraph in doc.paragraphs:
                if paragraph.text.strip():
                    content_parts.append(paragraph.text.strip())
            
            content = "\n".join(content_parts)
            total_content += len(content)
            
            print(f"✅ {docx_file.name}: {len(content)} characters, {len(content_parts)} paragraphs")
            
            # Show first few lines as preview
            lines = content.split('\n')[:3]
            print(f"   Preview: {' '.join(lines[:2])}...")
            print()
            
        except Exception as e:
            print(f"❌ Error reading {docx_file.name}: {e}")
    
    print(f"📊 Total content loaded: {total_content:,} characters")
    return True

if __name__ == "__main__":
    test_document_loading()

