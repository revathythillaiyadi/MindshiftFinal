# 🎵 External Audio URLs - Alternative Sources

## ✅ **Currently Active: SoundJay URLs**

The app is now using SoundJay external URLs:
- **Rain**: https://www.soundjay.com/misc/sounds/rain-01.mp3
- **Ocean**: https://www.soundjay.com/misc/sounds/ocean-waves-01.mp3
- **Forest**: https://www.soundjay.com/misc/sounds/forest-01.mp3
- **River**: https://www.soundjay.com/misc/sounds/river-01.mp3
- **Birds**: https://www.soundjay.com/misc/sounds/birds-01.mp3
- **Wind**: https://www.soundjay.com/misc/sounds/wind-01.mp3
- **Fireplace**: https://www.soundjay.com/misc/sounds/fireplace-01.mp3
- **Meditation**: https://www.soundjay.com/misc/sounds/meditation-01.mp3
- **Piano**: https://www.soundjay.com/misc/sounds/piano-01.mp3
- **Ambient**: https://www.soundjay.com/misc/sounds/ambient-01.mp3

## 🔄 **Alternative External URLs (If SoundJay Fails)**

### **Option A: Pixabay Direct Links**
```javascript
const audioUrls = {
  rain: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_bb630cc098.mp3?filename=rain-and-thunder-ambient-116927.mp3',
  ocean: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_bb630cc098.mp3?filename=ocean-waves-ambient-116927.mp3',
  forest: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_bb630cc098.mp3?filename=forest-ambient-116927.mp3',
  // ... etc
};
```

### **Option B: Freesound Direct Links**
```javascript
const audioUrls = {
  rain: 'https://freesound.org/data/previews/316/316847_5123451-lq.mp3',
  ocean: 'https://freesound.org/data/previews/123/123456_7890123-lq.mp3',
  // ... etc
};
```

### **Option C: Incompetech Direct Links**
```javascript
const audioUrls = {
  meditation: 'https://incompetech.com/music/royalty-free/music/meditation.mp3',
  ambient: 'https://incompetech.com/music/royalty-free/music/ambient.mp3',
  // ... etc
};
```

## 🧪 **Test the Current System**

1. **Go to**: http://localhost:5173
2. **Open chat settings** (gear icon)
3. **Click "Ambient Sounds"**
4. **Try each sound button**

## 🔧 **If URLs Don't Work**

The system has **automatic fallback** to Web Audio API if external URLs fail, so you'll always hear something!

## 📝 **To Change URLs**

Replace the `audioUrls` object in the `playAmbientSound` function with your preferred URLs.

