#!/bin/bash

# Create test audio files using ffmpeg
# This script creates simple test audio files for the ambient sounds

echo "🎵 Creating test ambient sound files..."

# Check if ffmpeg is available
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ ffmpeg is not installed. Installing via Homebrew..."
    if command -v brew &> /dev/null; then
        brew install ffmpeg
    else
        echo "❌ Homebrew not found. Please install ffmpeg manually or use the manual download method."
        exit 1
    fi
fi

# Create sounds directory if it doesn't exist
mkdir -p public/sounds

# Function to create audio file
create_audio() {
    local filename=$1
    local frequency=$2
    local duration=$3
    local description=$4
    
    echo "🎼 Creating $description..."
    
    ffmpeg -f lavfi -i "sine=frequency=$frequency:duration=$duration" -ac 2 -ar 44100 -q:a 2 "public/sounds/$filename" -y -loglevel quiet
    
    if [ -f "public/sounds/$filename" ]; then
        echo "✅ Successfully created $filename"
    else
        echo "❌ Failed to create $filename"
    fi
}

# Create test audio files (2-3 seconds each for testing)
echo "🌧️  Creating Rain sound (white noise)..."
ffmpeg -f lavfi -i "anoisesrc=duration=3:color=white" -ac 2 -ar 44100 -q:a 2 "public/sounds/rain.mp3" -y -loglevel quiet

echo "🌊 Creating Ocean sound (low frequency)..."
ffmpeg -f lavfi -i "sine=frequency=60:duration=3" -ac 2 -ar 44100 -q:a 2 "public/sounds/ocean.mp3" -y -loglevel quiet

echo "🌲 Creating Forest sound (mid frequency)..."
ffmpeg -f lavfi -i "sine=frequency=150:duration=3" -ac 2 -ar 44100 -q:a 2 "public/sounds/forest.mp3" -y -loglevel quiet

echo "🏞️  Creating River sound (flowing tone)..."
ffmpeg -f lavfi -i "sine=frequency=100:duration=3" -ac 2 -ar 44100 -q:a 2 "public/sounds/river.mp3" -y -loglevel quiet

echo "🐦 Creating Birds sound (high frequency)..."
ffmpeg -f lavfi -i "sine=frequency=800:duration=3" -ac 2 -ar 44100 -q:a 2 "public/sounds/birds.mp3" -y -loglevel quiet

echo "💨 Creating Wind sound (noise)..."
ffmpeg -f lavfi -i "anoisesrc=duration=3:color=pink" -ac 2 -ar 44100 -q:a 2 "public/sounds/wind.mp3" -y -loglevel quiet

echo "🔥 Creating Fireplace sound (crackling)..."
ffmpeg -f lavfi -i "anoisesrc=duration=3:color=brown" -ac 2 -ar 44100 -q:a 2 "public/sounds/fireplace.mp3" -y -loglevel quiet

echo "🧘 Creating Meditation sound (calm tone)..."
ffmpeg -f lavfi -i "sine=frequency=220:duration=3" -ac 2 -ar 44100 -q:a 2 "public/sounds/meditation.mp3" -y -loglevel quiet

echo "🎹 Creating Piano sound (musical tone)..."
ffmpeg -f lavfi -i "sine=frequency=440:duration=3" -ac 2 -ar 44100 -q:a 2 "public/sounds/piano.mp3" -y -loglevel quiet

echo "🎵 Creating Ambient sound (ambient tone)..."
ffmpeg -f lavfi -i "sine=frequency=330:duration=3" -ac 2 -ar 44100 -q:a 2 "public/sounds/ambient.mp3" -y -loglevel quiet

echo ""
echo "🎉 Test audio files created!"
echo ""
echo "📁 Files are now in: public/sounds/"
echo "🧪 These are basic test files - replace with high-quality audio for production"
echo "📖 See public/sounds/README.md for more information"
echo ""
echo "⚠️  Note: These are simple test files. For production, download high-quality"
echo "   ambient sounds from Pixabay, Freesound, or other royalty-free sources."
