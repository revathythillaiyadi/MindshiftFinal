# Manual Audio Download Guide

Since automatic downloads failed, here's how to manually download high-quality ambient sounds:

## 🎵 **Step 1: Visit These Reliable Sources**

### **Pixabay** (Recommended - Free & High Quality)
- **URL**: https://pixabay.com/music/
- **Search terms**: "rain ambient", "ocean waves", "forest sounds", etc.
- **Format**: MP3
- **License**: Free for commercial use

### **Freesound** (Free Sound Effects)
- **URL**: https://freesound.org/
- **Search terms**: "rain loop", "ocean loop", "forest ambience", etc.
- **Format**: MP3/WAV
- **License**: Various (check individual files)

### **Incompetech** (Royalty-Free Music)
- **URL**: https://incompetech.com/
- **Search terms**: "ambient", "nature sounds", "meditation"
- **Format**: MP3
- **License**: Free with attribution

## 🎯 **Step 2: Download These Specific Files**

### **Nature Sounds**
1. **Rain** - Search for "rain loop" or "rain ambient" (2-5 minutes)
2. **Ocean** - Search for "ocean waves loop" or "seaside ambient" (2-5 minutes)
3. **Forest** - Search for "forest ambience" or "woodland sounds" (2-5 minutes)
4. **River** - Search for "river stream" or "flowing water" (2-5 minutes)
5. **Birds** - Search for "birds chirping" or "bird songs" (2-5 minutes)
6. **Wind** - Search for "wind ambient" or "breeze sounds" (2-5 minutes)

### **Meditative & Music**
1. **Fireplace** - Search for "fireplace crackling" or "fire sounds" (2-5 minutes)
2. **Meditation** - Search for "meditation music" or "calm ambient" (2-5 minutes)
3. **Piano** - Search for "piano ambient" or "soft piano" (2-5 minutes)
4. **Ambient** - Search for "ambient music" or "atmospheric sounds" (2-5 minutes)

## 📁 **Step 3: Save Files with Exact Names**

Save each file in `/public/sounds/` with these exact names:
- `rain.mp3`
- `ocean.mp3`
- `forest.mp3`
- `river.mp3`
- `birds.mp3`
- `wind.mp3`
- `fireplace.mp3`
- `meditation.mp3`
- `piano.mp3`
- `ambient.mp3`

## 🧪 **Step 4: Test the System**

1. **Start your app**: `npm run dev`
2. **Go to**: http://localhost:5173
3. **Open chat settings** (gear icon)
4. **Click "Ambient Sounds"**
5. **Test each sound** by clicking the buttons

## ⚡ **Quick Test with One File**

To test the system immediately:
1. Download **any one** MP3 file (e.g., rain.mp3)
2. Save it as `/public/sounds/rain.mp3`
3. Test the "Rain" button in the app
4. If it works, download the rest!

## 🔧 **Alternative: Use Web Audio API**

If you prefer not to download files, the app will automatically fall back to the Web Audio API (synthesized sounds) when audio files are missing.

## 📞 **Need Help?**

The system is already set up and ready to work. Just add the audio files and test!
