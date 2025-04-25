document.addEventListener('DOMContentLoaded', function() {
    // Player elements and variables
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
    const repeatBtn = document.getElementById('repeat-btn');
    const shuffleBtn = document.getElementById('shuffle-btn');

    let songs = [];
    let currentSongIndex = 0;
    let isPlaying = false;
    let defaultCover = cover.src;
    let isRepeatOn = false;
    let isShuffleOn = false;
    let originalPlaylist = [];
    let shuffledPlaylist = [];
    const STORAGE_KEY = 'musicPlayerData';

    // Initialize the player
    function init() {
        loadFromLocalStorage();
        setupDragAndDrop();
        
        if (songs.length > 0) {
            loadSong(songs[currentSongIndex]);
            if (isPlaying) {
                playSong();
            }
        } else {
            showEmptyState();
        }
    }

    // Load data from localStorage
    function loadFromLocalStorage() {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            const data = JSON.parse(savedData);
            
            songs = data.songs || [];
            currentSongIndex = data.currentSongIndex || 0;
            isPlaying = data.isPlaying || false;
            isRepeatOn = data.isRepeatOn || false;
            isShuffleOn = data.isShuffleOn || false;
            originalPlaylist = data.originalPlaylist || [];
            shuffledPlaylist = data.shuffledPlaylist || [];
            
            // Update UI to reflect loaded states
            if (isRepeatOn) {
                repeatBtn.classList.add('active');
                repeatBtn.innerHTML = '<i class="fas fa-redo"></i><span class="mode-indicator">1</span>';
                repeatBtn.title = 'Repeat On';
            }
            
            if (isShuffleOn) {
                shuffleBtn.classList.add('active');
                shuffleBtn.title = 'Shuffle On';
            }
            
            if (data.volume) {
                audio.volume = data.volume;
                volumeSlider.value = data.volume;
            }
            
            updatePlaylist();
        }
    }

    // Save data to localStorage
    function saveToLocalStorage() {
        const data = {
            songs: songs,
            currentSongIndex: currentSongIndex,
            isPlaying: isPlaying,
            isRepeatOn: isRepeatOn,
            isShuffleOn: isShuffleOn,
            originalPlaylist: originalPlaylist,
            shuffledPlaylist: shuffledPlaylist,
            volume: audio.volume
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    // Set up drag and drop functionality
    function setupDragAndDrop() {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
            document.body.addEventListener(eventName, preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, unhighlight, false);
        });

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

    // Load song with animations
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
        
        // Save to localStorage
        saveToLocalStorage();
        
        // If song was playing before, continue playing
        if (isPlaying) {
            playSong();
        }
    }

    // Update playlist highlights
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
            
            // Create song info container
            const songInfo = document.createElement('div');
            songInfo.className = 'song-info-container';
            songInfo.textContent = `${song.title || 'Unknown Title'} - ${song.artist || 'Unknown Artist'}`;
            
            // Create duration element
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
                originalPlaylist = [...songs];
                // Save to localStorage
                saveToLocalStorage();
                updatePlaylist();
            }
        });
    }

    // Play song with animations
    function playSong() {
        isPlaying = true;
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        coverArt.style.animationPlayState = 'running';
        
        // Add dancing animation to character
        const character = document.querySelector('.boy-character');
        if (character) {
            character.style.animation = 'float 3s ease-in-out infinite';
        }
        
        audio.play().catch(e => console.error('Playback failed:', e));
        
        // Save to localStorage
        saveToLocalStorage();
    }

    // Pause song with animations
    function pauseSong() {
        isPlaying = false;
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        coverArt.style.animationPlayState = 'paused';
        
        // Reset character animation
        const character = document.querySelector('.boy-character');
        if (character) {
            character.style.animation = 'float 6s ease-in-out infinite';
        }
        
        audio.pause();
        
        // Save to localStorage
        saveToLocalStorage();
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

    // Next song with repeat and shuffle support
    function nextSong() {
        if (songs.length === 0) return;
        
        if (isRepeatOn) {
            // Just restart the current song
            audio.currentTime = 0;
            playSong();
            return;
        }
        
        if (isShuffleOn && currentSongIndex === shuffledPlaylist.length - 1) {
            // Reshuffle when reaching end of shuffled playlist
            shuffledPlaylist = [...originalPlaylist].sort(() => Math.random() - 0.5);
            songs = shuffledPlaylist;
            currentSongIndex = 0;
        } else {
            currentSongIndex++;
            if (currentSongIndex > songs.length - 1) {
                currentSongIndex = 0;
            }
        }
        
        loadSong(songs[currentSongIndex]);
        if (isPlaying) {
            playSong();
        }
    }

    // Update progress bar with animations
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

    // Set progress with ripple effect
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

    // Handle file input change
    function handleFileInputChange(e) {
        handleFiles(e.target.files);
        e.target.value = ''; // Reset input
    }

    // Toggle repeat mode
    function toggleRepeat() {
        isRepeatOn = !isRepeatOn;
        repeatBtn.classList.toggle('active');
        repeatBtn.title = isRepeatOn ? 'Repeat On' : 'Repeat Off';
        
        if (isRepeatOn) {
            repeatBtn.innerHTML = '<i class="fas fa-redo"></i><span class="mode-indicator">1</span>';
        } else {
            repeatBtn.innerHTML = '<i class="fas fa-redo"></i>';
        }
        
        // Save to localStorage
        saveToLocalStorage();
    }

    // Toggle shuffle mode
    function toggleShuffle() {
        isShuffleOn = !isShuffleOn;
        shuffleBtn.classList.toggle('active');
        shuffleBtn.title = isShuffleOn ? 'Shuffle On' : 'Shuffle Off';
        
        if (isShuffleOn) {
            // Save original playlist and create shuffled version
            originalPlaylist = [...songs];
            shuffledPlaylist = [...songs].sort(() => Math.random() - 0.5);
            songs = shuffledPlaylist;
            
            // Find current song in shuffled playlist
            const currentSong = originalPlaylist[currentSongIndex];
            currentSongIndex = shuffledPlaylist.findIndex(song => 
                song.audioUrl === currentSong.audioUrl);
        } else {
            // Restore original playlist
            if (originalPlaylist.length > 0) {
                const currentSong = songs[currentSongIndex];
                songs = originalPlaylist;
                currentSongIndex = songs.findIndex(song => 
                    song.audioUrl === currentSong.audioUrl);
            }
        }
        
        updatePlaylistHighlights();
        
        // Save to localStorage
        saveToLocalStorage();
    }

    // Event listeners
    playBtn.addEventListener('click', () => {
        if (songs.length === 0) return;
        isPlaying ? pauseSong() : playSong();
    });

    prevBtn.addEventListener('click', prevSong);
    nextBtn.addEventListener('click', nextSong);

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', () => {
        if (isRepeatOn) {
            audio.currentTime = 0;
            audio.play();
        } else {
            nextSong();
        }
    });
    progressContainer.addEventListener('click', setProgress);

    volumeSlider.addEventListener('input', (e) => {
        audio.volume = e.target.value;
        saveToLocalStorage();
    });

    uploadBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', handleFileInputChange);

    repeatBtn.addEventListener('click', toggleRepeat);
    shuffleBtn.addEventListener('click', toggleShuffle);

    // Initialize
    init();
});
