document.addEventListener('DOMContentLoaded', function() {
    // Previous player code remains the same until the playSong/pauseSong functions
    
    // Enhanced playSong with character animation
    function playSong() {
        isPlaying = true;
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        coverArt.style.animationPlayState = 'running';
        
        // Add dancing animation to character
        document.querySelector('.boy-character').style.animation = 'float 3s ease-in-out infinite';
        document.querySelector('.arm.left').style.animation = 'swing-arm 1s infinite alternate';
        document.querySelector('.arm.right').style.animation = 'swing-arm 1s infinite alternate';
        document.querySelector('.leg.left').style.animation = 'swing-leg 0.8s infinite alternate';
        document.querySelector('.leg.right').style.animation = 'swing-leg 0.8s infinite alternate';
        
        audio.play().catch(e => console.error('Playback failed:', e));
    }

    // Enhanced pauseSong with character animation
    function pauseSong() {
        isPlaying = false;
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        coverArt.style.animationPlayState = 'paused';
        
        // Reset character animation
        document.querySelector('.boy-character').style.animation = 'float 6s ease-in-out infinite';
        document.querySelector('.arm.left').style.animation = 'swing-arm 3s infinite alternate';
        document.querySelector('.arm.right').style.animation = 'swing-arm 3s infinite alternate 1.5s';
        document.querySelector('.leg.left').style.animation = 'swing-leg 2s infinite alternate';
        document.querySelector('.leg.right').style.animation = 'swing-leg 2s infinite alternate 1s';
        
        audio.pause();
    }

    // Add this to handle song changes with animation
    function loadSong(song) {
        // Add transition effect
        songTitle.style.animation = 'none';
        artist.style.animation = 'none';
        void songTitle.offsetWidth; // Trigger reflow
        void artist.offsetWidth; // Trigger reflow
        songTitle.style.animation = 'slide-in 0.5s ease-out';
        artist.style.animation = 'slide-in 0.5s ease-out';
        
        songTitle.textContent = song.title || 'Unknown Title';
        artist.textContent = song.artist || 'Unknown Artist';
        
        // Add cover art transition
        cover.style.opacity = '0';
        setTimeout(() => {
            if (song.coverUrl) {
                cover.src = song.coverUrl;
                cover.classList.remove('default-cover');
            } else {
                cover.src = defaultCover;
                cover.classList.add('default-cover');
            }
            cover.style.opacity = '1';
        }, 200);
        
        audio.src = song.audioUrl;
        
        // Highlight current song in playlist
        const playlistItems = document.querySelectorAll('#song-list li:not(.empty-state)');
        playlistItems.forEach((item, index) => {
            if (index === currentSongIndex) {
                item.classList.add('playing');
                // Add animation to the playing item
                item.style.animation = 'slide-in 0.3s ease-out';
            } else {
                item.classList.remove('playing');
            }
        });
    }

    // Rest of your existing JavaScript remains the same
    // ...
});document.addEventListener('DOMContentLoaded', function() {
    const audio = document.getElementById('audio');
    const playBtn = document.getElementById('play-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const progressBar = document.getElementById('progress-bar');
    const progressContainer = document.querySelector('.progress-container');
    const songTitle = document.getElementById('song-title');
    const artist = document.getElementById('artist');
    const cover = document.getElementById('cover');
    const currentTimeEl = document.getElementById('current-time');
    const durationEl = document.getElementById('duration');
    const volumeSlider = document.getElementById('volume-slider');
    const songList = document.getElementById('song-list');
    const coverArt = document.querySelector('.cover-art');
    const fileInput = document.getElementById('file-input');
    const uploadBtn = document.getElementById('upload-btn');
    const songCount = document.getElementById('song-count');
    const dropArea = document.getElementById('drop-area');

    let songs = [];
    let currentSongIndex = 0;
    let isPlaying = false;
    let defaultCover = cover.src;

    // Initialize the player
    function init() {
        // Check if there are songs in localStorage
        const savedSongs = localStorage.getItem('musicPlayerSongs');
        if (savedSongs) {
            songs = JSON.parse(savedSongs);
            updatePlaylist();
            if (songs.length > 0) {
                loadSong(songs[0]);
            }
        } else {
            showEmptyState();
        }

        // Set up drag and drop
        setupDragAndDrop();
    }

    // Set up drag and drop functionality
    function setupDragAndDrop() {
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
            document.body.addEventListener(eventName, preventDefaults, false);
        });

        // Highlight drop area when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, unhighlight, false);
        });

        // Handle dropped files
        dropArea.addEventListener('drop', handleDrop, false);
    }

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight() {
        dropArea.classList.add('highlight');
    }

    function unhighlight() {
        dropArea.classList.remove('highlight');
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    // Show empty state
    function showEmptyState() {
        songList.innerHTML = `
            <li class="empty-state">
                <i class="fas fa-music"></i>
                <p>No songs in playlist</p>
                <p>Upload some music to get started</p>
            </li>
        `;
        cover.src = defaultCover;
        cover.classList.add('default-cover');
        songTitle.textContent = 'No song selected';
        artist.textContent = 'Upload music to begin';
    }

    // Load song
    function loadSong(song) {
        songTitle.textContent = song.title || 'Unknown Title';
        artist.textContent = song.artist || 'Unknown Artist';
        
        if (song.coverUrl) {
            cover.src = song.coverUrl;
            cover.classList.remove('default-cover');
        } else {
            cover.src = defaultCover;
            cover.classList.add('default-cover');
        }
        
        audio.src = song.audioUrl;
        
        // Highlight current song in playlist
        const playlistItems = document.querySelectorAll('#song-list li:not(.empty-state)');
        playlistItems.forEach((item, index) => {
            if (index === currentSongIndex) {
                item.classList.add('playing');
            } else {
                item.classList.remove('playing');
            }
        });
    }

    // Update playlist display
    function updatePlaylist() {
        if (songs.length === 0) {
            showEmptyState();
            songCount.textContent = '(0 songs)';
            return;
        }

        songList.innerHTML = '';
        songs.forEach((song, index) => {
            const li = document.createElement('li');
            li.textContent = `${song.title || 'Unknown Title'} - ${song.artist || 'Unknown Artist'}`;
            li.addEventListener('click', () => {
                currentSongIndex = index;
                loadSong(songs[currentSongIndex]);
                playSong();
            });
            songList.appendChild(li);
        });

        songCount.textContent = `(${songs.length} ${songs.length === 1 ? 'song' : 'songs'})`;
        
        // Load the first song if not already loaded
        if (!audio.src) {
            loadSong(songs[0]);
        }
    }

    // Handle files (both from input and drag & drop)
    function handleFiles(files) {
        if (files.length === 0) return;
        
        let filesProcessed = 0;
        
        Array.from(files).forEach(file => {
            if (!file.type.startsWith('audio/')) {
                filesProcessed++;
                if (filesProcessed === files.length) {
                    updatePlaylist();
                }
                return;
            }
            
            const song = {
                title: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
                artist: 'Unknown Artist',
                audioUrl: URL.createObjectURL(file),
                coverUrl: defaultCover
            };
            
            songs.push(song);
            filesProcessed++;
            
            if (filesProcessed === files.length) {
                // Save to localStorage
                localStorage.setItem('musicPlayerSongs', JSON.stringify(songs));
                updatePlaylist();
            }
        });
    }

    // Play song
    function playSong() {
        isPlaying = true;
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        coverArt.style.animationPlayState = 'running';
        audio.play().catch(e => console.error('Playback failed:', e));
    }

    // Pause song
    function pauseSong() {
        isPlaying = false;
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        coverArt.style.animationPlayState = 'paused';
        audio.pause();
    }

    // Previous song
    function prevSong() {
        if (songs.length === 0) return;
        
        currentSongIndex--;
        if (currentSongIndex < 0) {
            currentSongIndex = songs.length - 1;
        }
        loadSong(songs[currentSongIndex]);
        if (isPlaying) {
            playSong();
        }
    }

    // Next song
    function nextSong() {
        if (songs.length === 0) return;
        
        currentSongIndex++;
        if (currentSongIndex > songs.length - 1) {
            currentSongIndex = 0;
        }
        loadSong(songs[currentSongIndex]);
        if (isPlaying) {
            playSong();
        }
    }

    // Update progress bar
    function updateProgress(e) {
        const { duration, currentTime } = e.srcElement;
        const progressPercent = (currentTime / duration) * 100;
        progressBar.style.width = `${progressPercent}%`;
        
        // Update time display
        const durationMinutes = Math.floor(duration / 60);
        let durationSeconds = Math.floor(duration % 60);
        if (durationSeconds < 10) {
            durationSeconds = `0${durationSeconds}`;
        }
        
        // Avoid NaN display
        if (durationSeconds) {
            durationEl.textContent = `${durationMinutes}:${durationSeconds}`;
        }
        
        const currentMinutes = Math.floor(currentTime / 60);
        let currentSeconds = Math.floor(currentTime % 60);
        if (currentSeconds < 10) {
            currentSeconds = `0${currentSeconds}`;
        }
        currentTimeEl.textContent = `${currentMinutes}:${currentSeconds}`;
    }

    // Set progress
    function setProgress(e) {
        if (songs.length === 0) return;
        
        const width = this.clientWidth;
        const clickX = e.offsetX;
        const duration = audio.duration;
        audio.currentTime = (clickX / width) * duration;
    }

    // Handle file input change
    function handleFileInputChange(e) {
        handleFiles(e.target.files);
        e.target.value = ''; // Reset input
    }

    // Event listeners
    playBtn.addEventListener('click', () => {
        if (songs.length === 0) return;
        isPlaying ? pauseSong() : playSong();
    });

    prevBtn.addEventListener('click', prevSong);
    nextBtn.addEventListener('click', nextSong);

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', nextSong);
    progressContainer.addEventListener('click', setProgress);

    volumeSlider.addEventListener('input', (e) => {
        audio.volume = e.target.value;
    });

    uploadBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', handleFileInputChange);

    // Initialize
    init();
});// Modify the updateProgress function to include animations
function updateProgress(e) {
    const { duration, currentTime } = e.srcElement;
    const progressPercent = (currentTime / duration) * 100;
    
    // Add pulse animation when progress updates
    progressBar.style.animation = 'none';
    void progressBar.offsetWidth; // Trigger reflow
    progressBar.style.animation = 'progress-pulse 0.3s ease';
    
    progressBar.style.width = `${progressPercent}%`;
    
    // Update time display with animation
    const durationMinutes = Math.floor(duration / 60);
    let durationSeconds = Math.floor(duration % 60);
    if (durationSeconds < 10) {
        durationSeconds = `0${durationSeconds}`;
    }
    
    if (durationSeconds) {
        durationEl.textContent = `${durationMinutes}:${durationSeconds}`;
    }
    
    const currentMinutes = Math.floor(currentTime / 60);
    let currentSeconds = Math.floor(currentTime % 60);
    if (currentSeconds < 10) {
        currentSeconds = `0${currentSeconds}`;
    }
    
    // Add bounce animation to current time
    currentTimeEl.classList.remove('time-update');
    void currentTimeEl.offsetWidth; // Trigger reflow
    currentTimeEl.classList.add('time-update');
    
    currentTimeEl.textContent = `${currentMinutes}:${currentSeconds}`;
}

// Add this to handle progress bar clicks with animation
function setProgress(e) {
    if (songs.length === 0) return;
    
    const width = this.clientWidth;
    const clickX = e.offsetX;
    const duration = audio.duration;
    
    // Add ripple effect animation
    const ripple = document.createElement('div');
    ripple.style.position = 'absolute';
    ripple.style.width = '20px';
    ripple.style.height = '20px';
    ripple.style.background = 'rgba(255, 255, 255, 0.5)';
    ripple.style.borderRadius = '50%';
    ripple.style.top = '50%';
    ripple.style.left = `${clickX}px`;
    ripple.style.transform = 'translate(-50%, -50%) scale(0)';
    ripple.style.animation = 'ripple 0.6s linear';
    progressContainer.appendChild(ripple);
    
    // Remove ripple element after animation
    setTimeout(() => {
        ripple.remove();
    }, 600);
    
    audio.currentTime = (clickX / width) * duration;
}

// Add this CSS for ripple animation dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: translate(-50%, -50%) scale(10);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
// Modify the loadSong function to include playlist animations
function loadSong(song, index = currentSongIndex) {
    currentSongIndex = index;
    
    // Add transition effect to song info
    songTitle.style.animation = 'none';
    artist.style.animation = 'none';
    void songTitle.offsetWidth;
    void artist.offsetWidth;
    songTitle.style.animation = 'slide-in 0.5s ease-out';
    artist.style.animation = 'slide-in 0.5s ease-out';
    
    songTitle.textContent = song.title || 'Unknown Title';
    artist.textContent = song.artist || 'Unknown Artist';
    
    // Add cover art transition
    cover.style.opacity = '0';
    setTimeout(() => {
        if (song.coverUrl) {
            cover.src = song.coverUrl;
            cover.classList.remove('default-cover');
        } else {
            cover.src = defaultCover;
            cover.classList.add('default-cover');
        }
        cover.style.opacity = '1';
    }, 200);
    
    audio.src = song.audioUrl;
    
    // Update playlist highlights
    updatePlaylistHighlights();
    
    // If song was playing before, continue playing
    if (isPlaying) {
        playSong();
    }
}

// New function to handle playlist highlighting
function updatePlaylistHighlights() {
    const playlistItems = document.querySelectorAll('#song-list li:not(.empty-state)');
    playlistItems.forEach((item, index) => {
        if (index === currentSongIndex) {
            item.classList.add('playing');
            // Add selection animation
            item.style.animation = 'playlist-item-selected 0.5s ease';
            // Remove animation after it completes
            setTimeout(() => {
                item.style.animation = '';
            }, 500);
        } else {
            item.classList.remove('playing');
        }
    });
}

// Modify the updatePlaylist function to include durations
function updatePlaylist() {
    if (songs.length === 0) {
        showEmptyState();
        songCount.textContent = '(0 songs)';
        return;
    }

    songList.innerHTML = '';
    songs.forEach((song, index) => {
        const li = document.createElement('li');
        
        // Create song info container
        const songInfo = document.createElement('div');
        songInfo.className = 'song-info-container';
        songInfo.textContent = `${song.title || 'Unknown Title'} - ${song.artist || 'Unknown Artist'}`;
        
        // Create duration element (we'll update this later)
        const durationEl = document.createElement('span');
        durationEl.className = 'song-duration';
        durationEl.textContent = '0:00';
        
        li.appendChild(songInfo);
        li.appendChild(durationEl);
        
        li.addEventListener('click', () => {
            loadSong(songs[index], index);
            playSong();
        });
        
        // Set up audio element to get duration
        const tempAudio = new Audio(song.audioUrl);
        tempAudio.addEventListener('loadedmetadata', () => {
            const duration = tempAudio.duration;
            const minutes = Math.floor(duration / 60);
            const seconds = Math.floor(duration % 60);
            durationEl.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        });
        
        songList.appendChild(li);
    });

    songCount.textContent = `(${songs.length} ${songs.length === 1 ? 'song' : 'songs'})`;
    
    // Load the first song if not already loaded
    if (!audio.src && songs.length > 0) {
        loadSong(songs[0]);
    }
}

// Add this to handle song ended event to auto-play next
audio.addEventListener('ended', () => {
    nextSong();
    // If playlist is on repeat
    if (currentSongIndex === songs.length - 1) {
        currentSongIndex = -1; // Reset to beginning
    }
});