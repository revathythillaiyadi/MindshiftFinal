#!/usr/bin/env python3
"""
Document Download Script for MindShift RAG System
Downloads SOM pattern documents from Google Drive
"""

import os
from pathlib import Path
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_documents_directory():
    """Create the som_documents directory if it doesn't exist"""
    docs_dir = Path("./som_documents")
    docs_dir.mkdir(exist_ok=True)
    logger.info(f"Created documents directory: {docs_dir}")
    return docs_dir

def download_sample_documents():
    """
    Create sample SOM pattern documents for testing
    Since we can't directly download from Google Drive without authentication,
    we'll create sample documents based on the structure mentioned
    """
    docs_dir = create_documents_directory()
    
    # Sample SOM pattern documents
    sample_docs = {
        "01_About_Sleight_of_Mouth_SOM_patterns.txt": """
SLEIGHT OF MOUTH (SOM) PATTERNS

Sleight of Mouth patterns are linguistic tools developed by Robert Dilts based on the work of Richard Bandler and John Grinder. These patterns help challenge limiting beliefs and reframe perspectives.

KEY SOM PATTERNS:

1. CAUSE-EFFECT CHALLENGE
   - Questions the assumed relationship between cause and effect
   - Example: "How does X necessarily lead to Y?"

2. COMPLEX EQUIVALENCE CHALLENGE  
   - Questions the meaning assigned to events
   - Example: "What else could this mean?"

3. INTENTION CHALLENGE
   - Questions the underlying intention behind actions
   - Example: "What was your intention when...?"

4. REDEFINING CHALLENGE
   - Offers alternative definitions or meanings
   - Example: "Couldn't this also be called...?"

5. CONSEQUENCE CHALLENGE
   - Questions the consequences of maintaining the belief
   - Example: "What happens if you continue to believe this?"

6. CHUNK UP CHALLENGE
   - Moves to a higher level of abstraction
   - Example: "What's the bigger picture here?"

7. CHUNK DOWN CHALLENGE
   - Moves to a more specific level
   - Example: "What specifically about this situation?"

8. ANALOGY CHALLENGE
   - Uses analogies to reframe the situation
   - Example: "It's like saying..."

9. ANOTHER OUTCOME CHALLENGE
   - Suggests alternative outcomes
   - Example: "What else could happen?"

10. HIERARCHY OF CRITERIA CHALLENGE
    - Questions what's most important
    - Example: "What's more important than...?"
""",

        "02_Example_1_SOM_Patterns.txt": """
EXAMPLE CONVERSATION 1: CAREER LIMITATION

User: "I can't get promoted because I don't have a college degree."

MindShift Response using SOM Patterns:

CAUSE-EFFECT CHALLENGE:
"How does not having a college degree necessarily prevent you from getting promoted? What if your experience and skills are more valuable than a piece of paper?"

REDEFINING CHALLENGE:
"Couldn't your years of experience be considered your 'education'? Many successful people have learned through doing rather than studying."

INTENTION CHALLENGE:
"What's your real intention here - to get promoted or to develop yourself? Sometimes focusing on growth leads to advancement naturally."

CONSEQUENCE CHALLENGE:
"What happens if you continue believing that a degree is the only path to promotion? You might miss opportunities to demonstrate your value in other ways."

CHUNK UP CHALLENGE:
"What's the bigger picture here? Companies ultimately want people who can deliver results, regardless of how they gained their knowledge."
""",

        "03_Example_2_SOM_Patterns.txt": """
EXAMPLE CONVERSATION 2: RELATIONSHIP FEARS

User: "I'm afraid to start dating because I always get hurt."

MindShift Response using SOM Patterns:

COMPLEX EQUIVALENCE CHALLENGE:
"What else could 'getting hurt' mean besides something negative? Could it also mean you're learning what you want and don't want in relationships?"

ANALOGY CHALLENGE:
"It's like saying you'll never learn to ride a bike because you fell off once. Each relationship teaches you something valuable, even if it doesn't work out."

ANOTHER OUTCOME CHALLENGE:
"What else could happen besides getting hurt? You might meet someone amazing, learn about yourself, or develop deeper emotional intelligence."

HIERARCHY OF CRITERIA CHALLENGE:
"What's more important - protecting yourself from potential hurt or opening yourself to potential love and connection?"

CHUNK DOWN CHALLENGE:
"What specifically about dating concerns you most? Is it rejection, vulnerability, or something else?"
""",

        "04_Conversation_1_with_MindShift.txt": """
CONVERSATION #1 WITH MINDSHIFT

User: "I can't start my own business because I don't have enough money."

MindShift: "I hear that financial concern is holding you back. Let me ask you this - what if 'not having enough money' is actually a sign that you're ready to be creative and resourceful? 

Many successful entrepreneurs started with very little capital. They used their creativity, network, and skills to build something from nothing. What resources do you already have that you might be overlooking?

Also, what's the cost of not starting? If you continue believing you need a lot of money to begin, what opportunities might you miss? Sometimes the best businesses are born from constraints, not abundance.

What's one small step you could take today that doesn't require much money but moves you toward your business goals?"

User: "I guess I could start by researching my market online."

MindShift: "Exactly! That's a perfect example of using what you have. Research costs nothing but your time and attention. What else could you do that requires minimal financial investment but maximum learning?"
""",

        "05_Conversation_2_with_MindShift.txt": """
CONVERSATION #2 WITH MINDSHIFT

User: "I'm too old to learn new technology."

MindShift: "I understand that feeling. But let me challenge that belief with a question: What if being 'older' actually gives you advantages that younger people don't have? 

You have life experience, patience, and the ability to see the bigger picture. These are incredibly valuable when learning new technology. You're not learning in a vacuum - you're learning with wisdom.

Also, what's the alternative? If you don't learn new technology, what happens to your ability to stay relevant and connected? The world isn't going to stop advancing just because we get older.

Many successful tech entrepreneurs started their companies in their 40s, 50s, and even 60s. Age often brings the focus and determination that younger people lack.

What's one small technology skill you'd like to learn? Let's start there and see how your experience actually helps you learn faster."
""",

        "06_Conversation_3_with_MindShift.txt": """
CONVERSATION #3 WITH MINDSHIFT

User: "I'll never be good at public speaking because I'm naturally shy."

MindShift: "I appreciate you sharing that. But let me ask - what if being 'naturally shy' is actually a strength for public speaking? 

Shy people often think more carefully about what they say, listen better to their audience, and come across as more authentic and trustworthy. Some of the most powerful speakers are introverts who learned to channel their natural thoughtfulness.

Also, what does 'good at public speaking' mean to you? Does it mean being the life of the party, or does it mean connecting authentically with your audience? Sometimes we're comparing ourselves to the wrong standard.

Many successful speakers started out terrified of public speaking. The difference isn't natural talent - it's practice and reframing how you see your natural qualities.

What's one small speaking opportunity you could create for yourself? Maybe sharing an idea in a meeting or telling a story to friends? Let's start where you feel most comfortable."
""",

        "07_Conversation_4_with_MindShift.txt": """
CONVERSATION #4 WITH MINDSHIFT

User: "I can't pursue my passion because I have too many responsibilities."

MindShift: "I hear that your responsibilities feel overwhelming. But let me ask you this - what if your responsibilities are actually teaching you skills that will make you better at pursuing your passion?

Being responsible teaches you time management, prioritization, and resilience. These are exactly the skills you need to succeed in any passion project.

Also, what's the cost of not pursuing your passion? If you continue believing that responsibilities prevent you from following your dreams, what happens to your energy and motivation? Sometimes pursuing our passion actually gives us more energy for our responsibilities.

What's one small way you could integrate your passion into your current responsibilities? Maybe there's a way to serve your passion while fulfilling your duties?

Remember, you don't have to quit everything to pursue your passion. Sometimes the most sustainable path is finding ways to weave your passion into your existing life."
""",

        "08_Conversation_5_with_MindShift.txt": """
CONVERSATION #5 WITH MINDSHIFT

User: "I'm not creative enough to be an artist."

MindShift: "That's an interesting belief. But let me challenge it - what if creativity isn't something you either have or don't have, but something you develop through practice?

Every child is creative until they learn to judge their creativity. What if you're not 'not creative' - you're just out of practice? Creativity is like a muscle that gets stronger with use.

Also, what does being 'creative enough' mean? Are you comparing yourself to famous artists, or are you looking for your own unique creative expression? Sometimes we're measuring ourselves against the wrong standard.

Many successful artists started out thinking they weren't creative. They learned that creativity isn't about being perfect - it's about being willing to experiment and make mistakes.

What's one small creative act you could do today? Maybe doodling, writing a poem, or taking a photo? Let's start with something that feels safe and see how your creativity responds.

Remember, every artist was once an amateur. The difference isn't natural talent - it's the willingness to keep creating despite the fear."
"""
    }
    
    # Write sample documents
    for filename, content in sample_docs.items():
        file_path = docs_dir / filename
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        logger.info(f"Created sample document: {file_path}")
    
    logger.info(f"Created {len(sample_docs)} sample documents in {docs_dir}")
    
    # Create a README file
    readme_content = """
# SOM Pattern Documents

This directory contains the Sleight of Mouth (SOM) pattern documents used by the MindShift RAG system.

## Documents Included:

1. **01_About_Sleight_of_Mouth_SOM_patterns.txt** - Overview of SOM patterns
2. **02_Example_1_SOM_Patterns.txt** - Career limitation example
3. **03_Example_2_SOM_Patterns.txt** - Relationship fears example
4. **04_Conversation_1_with_MindShift.txt** - Business startup conversation
5. **05_Conversation_2_with_MindShift.txt** - Technology learning conversation
6. **06_Conversation_3_with_MindShift.txt** - Public speaking conversation
7. **07_Conversation_4_with_MindShift.txt** - Passion pursuit conversation
8. **08_Conversation_5_with_MindShift.txt** - Creativity conversation

## Note:

These are sample documents created for demonstration purposes. For the full system, you would need to download the actual .docx files from the Google Drive folder and convert them to text format.

## Usage:

The MindShift RAG system will automatically load and index these documents when you run the application.
"""
    
    readme_path = docs_dir / "README.md"
    with open(readme_path, 'w', encoding='utf-8') as f:
        f.write(readme_content)
    
    logger.info(f"Created README file: {readme_path}")

if __name__ == "__main__":
    print("Creating sample SOM pattern documents...")
    download_sample_documents()
    print("✅ Sample documents created successfully!")
    print("\nTo use the full system:")
    print("1. Download the actual .docx files from the Google Drive folder")
    print("2. Convert them to .txt format or use a .docx parser")
    print("3. Place them in the ./som_documents directory")
    print("4. Run the MindShift RAG system")
