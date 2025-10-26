#!/bin/bash

# Ambient Sounds Download Script
# This script downloads high-quality ambient sounds from reliable sources

echo "🎵 Downloading ambient sounds for Mindshift app..."

# Create sounds directory if it doesn't exist
mkdir -p public/sounds

# Function to download audio file
download_audio() {
    local filename=$1
    local url=$2
    local description=$3
    
    echo "📥 Downloading $description..."
    
    if curl -L -o "public/sounds/$filename" "$url" --fail --silent --show-error; then
        echo "✅ Successfully downloaded $filename"
    else
        echo "❌ Failed to download $filename"
        echo "   You can manually download from: $url"
    fi
}

# Download high-quality ambient sounds from Pixabay
# Note: These are sample URLs - you may need to find current working URLs

echo "🌧️  Downloading Rain sound..."
download_audio "rain.mp3" "https://cdn.pixabay.com/download/audio/2022/03/10/audio_bb630cc098.mp3?filename=rain-and-thunder-ambient-116927.mp3" "Rain and Thunder"

echo "🌊 Downloading Ocean sound..."
download_audio "ocean.mp3" "https://cdn.pixabay.com/download/audio/2021/08/09/audio_bb630cc098.mp3?filename=ocean-waves-ambient-116927.mp3" "Ocean Waves"

echo "🌲 Downloading Forest sound..."
download_audio "forest.mp3" "https://cdn.pixabay.com/download/audio/2021/08/09/audio_bb630cc098.mp3?filename=forest-ambient-116927.mp3" "Forest Ambience"

echo "🏞️  Downloading River sound..."
download_audio "river.mp3" "https://cdn.pixabay.com/download/audio/2021/08/09/audio_bb630cc098.mp3?filename=river-stream-ambient-116927.mp3" "River Stream"

echo "🐦 Downloading Birds sound..."
download_audio "birds.mp3" "https://cdn.pixabay.com/download/audio/2021/08/09/audio_bb630cc098.mp3?filename=birds-chirping-ambient-116927.mp3" "Birds Chirping"

echo "💨 Downloading Wind sound..."
download_audio "wind.mp3" "https://cdn.pixabay.com/download/audio/2021/08/09/audio_bb630cc098.mp3?filename=wind-ambient-116927.mp3" "Wind"

echo "🔥 Downloading Fireplace sound..."
download_audio "fireplace.mp3" "https://cdn.pixabay.com/download/audio/2021/08/09/audio_bb630cc098.mp3?filename=fireplace-crackling-ambient-116927.mp3" "Fireplace Crackling"

echo "🧘 Downloading Meditation sound..."
download_audio "meditation.mp3" "https://cdn.pixabay.com/download/audio/2021/08/09/audio_bb630cc098.mp3?filename=meditation-ambient-116927.mp3" "Meditation Music"

echo "🎹 Downloading Piano sound..."
download_audio "piano.mp3" "https://cdn.pixabay.com/download/audio/2021/08/09/audio_bb630cc098.mp3?filename=piano-ambient-116927.mp3" "Piano Ambient"

echo "🎵 Downloading Ambient sound..."
download_audio "ambient.mp3" "https://cdn.pixabay.com/download/audio/2021/08/09/audio_bb630cc098.mp3?filename=ambient-music-116927.mp3" "Ambient Music"

echo ""
echo "🎉 Download complete!"
echo ""
echo "📁 Files are now in: public/sounds/"
echo "🔧 You can replace any files with your own high-quality audio"
echo "📖 See public/sounds/README.md for more information"
echo ""
echo "⚠️  Note: If some downloads failed, you can manually download audio files"
echo "   from sources like Pixabay, Freesound, or Incompetech and place them"
echo "   in the public/sounds/ directory with the correct filenames."
