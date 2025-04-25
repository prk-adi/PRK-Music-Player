# PRK-Music-Player
# Music Player Web Application

![Music Player Screenshot](screenshot.png)

A modern, responsive music player web application with drag-and-drop functionality, playlist management, and visual animations.

## Features

- 🎵** Local File Playback**: Play audio files directly from your device
- 📁 **Drag & Drop**: Easily add songs by dragging files into the player
- 🔁 **Playback Controls**: Play/pause, previous/next, repeat, and shuffle
- 📊 **Visual Progress Bar**: Animated progress bar with time indicators
- 🎨 **Animated UI**: Rotating album art, animated character, and smooth transitions
- 💾 **Persistent Playlist**: Songs remain after page refresh using localStorage
- 📱 **Fully Responsive**: Works on mobile, tablet, and desktop devices
- 🎚️ **Volume Control**: Adjustable volume slider
- 🎭 **Glassmorphism Design**: Modern frosted glass aesthetic

## Technologies Used

- HTML5
- CSS3 (with animations and transitions)
- JavaScript (ES6)
- Web Audio API
- localStorage for data persistence
- Font Awesome for icons
- Google Fonts (Poppins)

## Installation

No installation required! Simply open the `index.html` file in any modern web browser.

## Usage

1. **Add Music**:
   - Click "Browse Files" to select audio files
   - Or drag and drop audio files directly into the upload area

2. **Playback Controls**:
   - ▶️ Play/Pause: Toggle playback
   - ⏮️ Previous: Go to previous song
   - ⏭️ Next: Go to next song
   - 🔁 Repeat: Toggle repeat mode
   - 🔀 Shuffle: Toggle shuffle mode

3. **Volume Control**:
   - Use the slider to adjust volume

4. **Progress Bar**:
   - Shows current playback position
   - Click anywhere to seek to a specific time

## File Structure

```
music-player/
├── index.html          # Main HTML file
├── styles.css          # CSS stylesheet
└── script.js           # JavaScript functionality
```

## Customization

1. **Change Colors**:
   - Modify the CSS variables in `styles.css` to change the color scheme

2. **Add Features**:
   - Extend the JavaScript in `script.js` to add new functionality

3. **Update Character**:
   - Customize the animated character in the CSS

## Browser Support

The music player works best in modern browsers including:
- Google Chrome
- Mozilla Firefox
- Microsoft Edge
- Safari

## Known Limitations

- Audio files are stored temporarily using object URLs
- Playlist data is browser-specific (cleared when clearing browser data)
- Some older browsers may not support all features

## License

This project is open source and available under the [MIT License](LICENSE).

---

Enjoy your music! 🎧
Created with ❤️ by Aditya Gulshan
