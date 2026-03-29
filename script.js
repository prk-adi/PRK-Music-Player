document.addEventListener('DOMContentLoaded', () => {
    const audio = document.getElementById('audio');
    const playBtn = document.getElementById('play-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const progressBar = document.getElementById('progress-bar');
    const progressThumb = document.getElementById('progress-thumb');
    const progressContainer = document.querySelector('.progress-container');
    const songTitle = document.getElementById('song-title');
    const artist = document.getElementById('artist');
    const cover = document.getElementById('cover');
    const currentTimeEl = document.getElementById('current-time');
    const durationEl = document.getElementById('duration');
    const volumeSlider = document.getElementById('volume-slider');
    const speedSelect = document.getElementById('speed-select');
    const sleepTimerSelect = document.getElementById('sleep-timer-select');
    const lyricsInput = document.getElementById('lyrics-input');
    const lyricsUploadBtn = document.getElementById('lyrics-upload-btn');
    const clearLyricsBtn = document.getElementById('clear-lyrics-btn');
    const lyricsSongLabel = document.getElementById('lyrics-song-label');
    const lyricsContent = document.getElementById('lyrics-content');
    const songList = document.getElementById('song-list');
    const coverArt = document.querySelector('.cover-art');
    const fileInput = document.getElementById('file-input');
    const uploadBtn = document.getElementById('upload-btn');
    const songCount = document.getElementById('song-count');
    const dropArea = document.getElementById('drop-area');
    const repeatBtn = document.getElementById('repeat-btn');
    const shuffleBtn = document.getElementById('shuffle-btn');
    const clearPlaylistBtn = document.getElementById('clear-playlist-btn');
    const clearQueueBtn = document.getElementById('clear-queue-btn');
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');
    const favoritesFilterBtn = document.getElementById('favorites-filter-btn');
    const statusMessage = document.getElementById('status-message');
    const toastContainer = document.getElementById('toast-container');
    const totalDurationEl = document.getElementById('total-duration');
    const favoriteCountEl = document.getElementById('favorite-count');
    const mostPlayedStatEl = document.getElementById('most-played-stat');
    const lastPlayedStatEl = document.getElementById('last-played-stat');
    const queueCountEl = document.getElementById('queue-count');
    const queueList = document.getElementById('queue-list');
    const character = document.querySelector('.boy-character');

    const STORAGE_KEY = 'musicPlayerSettings';
    const DB_NAME = 'prkMusicPlayerDB';
    const DB_VERSION = 1;
    const SONG_STORE = 'songs';
    const SEEK_STEP = 5;
    const VOLUME_STEP = 0.05;

    let songs = [];
    let currentSongIndex = 0;
    let isPlaying = false;
    let isRepeatOn = false;
    let isShuffleOn = false;
    let searchTerm = '';
    let sortMode = 'added';
    let showFavoritesOnly = false;
    let favoriteSignatures = [];
    let shuffleOrder = [];
    let shufflePosition = 0;
    let isSeeking = false;
    let playbackRate = 1;
    let sleepTimerMinutes = 0;
    let sleepTimerId = null;
    let draggedSongIndex = null;
    let draggedQueueIndex = null;
    let playNextQueue = [];
    let lyricsBySongId = {};
    let playHistory = {};
    let countedPlaySongId = null;
    let activeLyricsLineIndex = -1;

    const defaultCover = cover.src;

    function init() {
        initializePlayer().catch((error) => {
            console.error('Player initialization failed:', error);
            showEmptyState();
            showToast('Could not restore saved songs');
        });
    }

    async function initializePlayer() {
        loadSettings();
        setupDragAndDrop();
        applyModeButtonStates();
        bindEvents();
        scheduleSleepTimer();
        songs = await loadSongsFromDatabase();
        const songIds = new Set(songs.map((song) => song.id));
        playNextQueue = playNextQueue.filter((songId) => songIds.has(songId));

        if (songs.length === 0) {
            showEmptyState();
            return;
        }

        currentSongIndex = Math.min(currentSongIndex, songs.length - 1);
        updatePlaylist();
        loadSong(songs[currentSongIndex], currentSongIndex);
        showStatus(`Restored ${songs.length} saved ${songs.length === 1 ? 'song' : 'songs'}`);
        showToast(`Restored ${songs.length} saved ${songs.length === 1 ? 'song' : 'songs'}`);
    }

    function loadSettings() {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (!savedData) {
            audio.volume = Number(volumeSlider.value);
            return;
        }

        try {
            const data = JSON.parse(savedData);
            isRepeatOn = Boolean(data.isRepeatOn);
            isShuffleOn = Boolean(data.isShuffleOn);
            searchTerm = typeof data.searchTerm === 'string' ? data.searchTerm : '';
            sortMode = typeof data.sortMode === 'string' ? data.sortMode : 'added';
            showFavoritesOnly = Boolean(data.showFavoritesOnly);
            playbackRate = typeof data.playbackRate === 'number' ? data.playbackRate : 1;
            sleepTimerMinutes = typeof data.sleepTimerMinutes === 'number' ? data.sleepTimerMinutes : 0;
            currentSongIndex = typeof data.currentSongIndex === 'number' ? data.currentSongIndex : 0;
            playNextQueue = Array.isArray(data.playNextQueue) ? data.playNextQueue : [];
            favoriteSignatures = Array.isArray(data.favoriteSignatures) ? data.favoriteSignatures : [];
            lyricsBySongId = typeof data.lyricsBySongId === 'object' && data.lyricsBySongId !== null ? data.lyricsBySongId : {};
            playHistory = typeof data.playHistory === 'object' && data.playHistory !== null ? data.playHistory : {};

            if (typeof data.volume === 'number') {
                audio.volume = data.volume;
                volumeSlider.value = data.volume;
            } else {
                audio.volume = Number(volumeSlider.value);
            }

            audio.playbackRate = playbackRate;
        } catch (error) {
            console.error('Could not load player settings:', error);
            audio.volume = Number(volumeSlider.value);
            audio.playbackRate = playbackRate;
        }
    }

    function saveSettings() {
        const persistedFavoriteSignatures = Array.from(new Set([
            ...songs.filter((song) => song.isFavorite).map((song) => song.fileSignature),
            ...favoriteSignatures.filter((signature) => !songs.some((song) => song.fileSignature === signature))
        ]));
        favoriteSignatures = persistedFavoriteSignatures;

        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            isRepeatOn,
            isShuffleOn,
            searchTerm,
            sortMode,
            showFavoritesOnly,
            playbackRate,
            sleepTimerMinutes,
            currentSongIndex,
            playNextQueue,
            lyricsBySongId,
            playHistory,
            favoriteSignatures: persistedFavoriteSignatures,
            volume: audio.volume
        }));
    }

    function applyModeButtonStates() {
        repeatBtn.classList.toggle('active', isRepeatOn);
        repeatBtn.title = isRepeatOn ? 'Repeat On' : 'Repeat Off';
        repeatBtn.setAttribute('aria-pressed', String(isRepeatOn));
        repeatBtn.innerHTML = isRepeatOn
            ? '<i class="fas fa-redo"></i><span class="mode-indicator">1</span>'
            : '<i class="fas fa-redo"></i>';

        shuffleBtn.classList.toggle('active', isShuffleOn);
        shuffleBtn.title = isShuffleOn ? 'Shuffle On' : 'Shuffle Off';
        shuffleBtn.setAttribute('aria-pressed', String(isShuffleOn));

        favoritesFilterBtn.classList.toggle('active', showFavoritesOnly);
        favoritesFilterBtn.textContent = showFavoritesOnly ? 'Favorites On' : 'Favorites';
        favoritesFilterBtn.setAttribute('aria-pressed', String(showFavoritesOnly));
        if (searchInput.value !== searchTerm) {
            searchInput.value = searchTerm;
        }
        if (sortSelect.value !== sortMode) {
            sortSelect.value = sortMode;
        }
        if (speedSelect.value !== String(playbackRate)) {
            speedSelect.value = String(playbackRate);
        }
        if (sleepTimerSelect.value !== String(sleepTimerMinutes)) {
            sleepTimerSelect.value = String(sleepTimerMinutes);
        }
    }

    function setupDragAndDrop() {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
            dropArea.addEventListener(eventName, preventDefaults, false);
            document.body.addEventListener(eventName, preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach((eventName) => {
            dropArea.addEventListener(eventName, () => dropArea.classList.add('highlight'), false);
        });

        ['dragleave', 'drop'].forEach((eventName) => {
            dropArea.addEventListener(eventName, () => dropArea.classList.remove('highlight'), false);
        });

        dropArea.addEventListener('drop', (event) => {
            handleFiles(event.dataTransfer.files);
        }, false);
    }

    function preventDefaults(event) {
        event.preventDefault();
        event.stopPropagation();
    }

    function showStatus(message) {
        statusMessage.textContent = message;
    }

    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-6px)';
            setTimeout(() => toast.remove(), 220);
        }, 2400);
    }

    function formatLastPlayed(timestamp) {
        if (!timestamp) {
            return 'None';
        }

        const date = new Date(timestamp);
        if (Number.isNaN(date.getTime())) {
            return 'None';
        }

        return date.toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    }

    function getHistorySummary() {
        const availableSongIds = new Set(songs.map((song) => song.id));
        const entries = Object.entries(playHistory)
            .filter(([songId, info]) => availableSongIds.has(songId) && info && typeof info === 'object');

        let mostPlayed = null;
        let lastPlayed = null;

        entries.forEach(([songId, info]) => {
            const song = songs.find((entry) => entry.id === songId);
            if (!song) {
                return;
            }

            const normalizedInfo = {
                count: Number(info.count) || 0,
                lastPlayedAt: info.lastPlayedAt || null
            };

            if (normalizedInfo.count > 0 && (!mostPlayed || normalizedInfo.count > mostPlayed.count)) {
                mostPlayed = { song, count: normalizedInfo.count };
            }

            const lastPlayedTime = normalizedInfo.lastPlayedAt ? new Date(normalizedInfo.lastPlayedAt).getTime() : 0;
            const existingLastPlayedTime = lastPlayed?.timestamp ? new Date(lastPlayed.timestamp).getTime() : 0;
            if (lastPlayedTime > 0 && lastPlayedTime > existingLastPlayedTime) {
                lastPlayed = { song, timestamp: normalizedInfo.lastPlayedAt };
            }
        });

        return { mostPlayed, lastPlayed };
    }

    function updatePlaylistStats() {
        const totalSeconds = songs.reduce((sum, song) => sum + (Number(song.durationSeconds) || 0), 0);
        const totalMinutes = Math.floor(totalSeconds / 60);
        const remainingSeconds = Math.floor(totalSeconds % 60);
        const { mostPlayed, lastPlayed } = getHistorySummary();

        totalDurationEl.textContent = `Total: ${totalMinutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        favoriteCountEl.textContent = `Favorites: ${songs.filter((song) => song.isFavorite).length}`;
        mostPlayedStatEl.textContent = mostPlayed
            ? `Most Played: ${mostPlayed.song.title} (${mostPlayed.count})`
            : 'Most Played: None';
        lastPlayedStatEl.textContent = lastPlayed
            ? `Last Played: ${lastPlayed.song.title} (${formatLastPlayed(lastPlayed.timestamp)})`
            : 'Last Played: None';
    }

    function getCurrentSong() {
        return songs[currentSongIndex] || null;
    }

    function getCurrentLyrics() {
        const song = getCurrentSong();
        if (!song) {
            return [];
        }

        return Array.isArray(lyricsBySongId[song.id]) ? lyricsBySongId[song.id] : [];
    }

    function renderLyrics(activeTime = audio.currentTime || 0) {
        const song = getCurrentSong();
        const lyrics = getCurrentLyrics();

        lyricsSongLabel.textContent = song
            ? `${song.title} ${lyrics.length ? 'lyrics loaded' : 'lyrics not loaded'}`
            : 'No song selected';

        if (!song) {
            activeLyricsLineIndex = -1;
            lyricsContent.innerHTML = '<p class="lyrics-empty">Select a song, then load a local .lrc file.</p>';
            return;
        }

        if (lyrics.length === 0) {
            activeLyricsLineIndex = -1;
            lyricsContent.innerHTML = '<p class="lyrics-empty">Load a local .lrc file for this song to see synced lyrics here.</p>';
            return;
        }

        const nextActiveIndex = lyrics.reduce((activeIndex, entry, index) => (
            activeTime >= entry.time ? index : activeIndex
        ), -1);

        if (lyricsContent.childElementCount !== lyrics.length || lyricsContent.querySelector('.lyrics-empty')) {
            lyricsContent.innerHTML = '';

            lyrics.forEach((entry, index) => {
                const line = document.createElement('p');
                line.className = 'lyrics-line';
                line.dataset.lyricsIndex = String(index);
                line.textContent = entry.text || '...';
                lyricsContent.appendChild(line);
            });
        }

        if (activeLyricsLineIndex === nextActiveIndex) {
            return;
        }

        const previousLine = lyricsContent.querySelector('.lyrics-line.active');
        if (previousLine) {
            previousLine.classList.remove('active');
        }

        activeLyricsLineIndex = nextActiveIndex;
        if (activeLyricsLineIndex >= 0) {
            const activeLine = lyricsContent.querySelector(`[data-lyrics-index="${activeLyricsLineIndex}"]`);
            if (activeLine) {
                activeLine.classList.add('active');
                activeLine.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }
    }

    function parseLrc(text) {
        if (typeof text !== 'string') {
            return [];
        }

        return text
            .split(/\r?\n/)
            .flatMap((line) => {
                const matches = [...line.matchAll(/\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g)];
                if (matches.length === 0) {
                    return [];
                }

                const lyricText = line.replace(/\[[^\]]+\]/g, '').trim();
                return matches.map((match) => {
                    const minutes = Number(match[1]) || 0;
                    const seconds = Number(match[2]) || 0;
                    const fraction = (match[3] || '').padEnd(3, '0').slice(0, 3);
                    return {
                        time: (minutes * 60) + seconds + (Number(fraction) || 0) / 1000,
                        text: lyricText
                    };
                });
            })
            .sort((left, right) => left.time - right.time);
    }

    function normalizeTrackLabel(value) {
        return String(value || '')
            .replace(/\.[^/.]+$/, '')
            .replace(/[_-]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
    }

    function findSongIndexByLyricsFile(fileName) {
        const normalizedFileName = normalizeTrackLabel(fileName);
        if (!normalizedFileName) {
            return -1;
        }

        return songs.findIndex((song) => normalizeTrackLabel(song.title) === normalizedFileName);
    }

    function getSongHistory(song) {
        if (!song) {
            return { count: 0, lastPlayedAt: null };
        }

        const info = playHistory[song.id];
        return {
            count: Number(info?.count) || 0,
            lastPlayedAt: info?.lastPlayedAt || null
        };
    }

    function recordPlayback(song) {
        if (!song) {
            return;
        }

        const currentEntry = playHistory[song.id] || { count: 0, lastPlayedAt: null };
        playHistory[song.id] = {
            count: (Number(currentEntry.count) || 0) + 1,
            lastPlayedAt: new Date().toISOString()
        };
        updatePlaylistStats();
        saveSettings();
    }

    function renderQueue() {
        const queuedSongs = playNextQueue
            .map((songId) => songs.find((song) => song.id === songId))
            .filter(Boolean);

        queueCountEl.textContent = `(${queuedSongs.length})`;

        if (queuedSongs.length === 0) {
            queueList.innerHTML = '<li class="empty-state queue-empty">No songs queued</li>';
            return;
        }

        queueList.innerHTML = '';
        queuedSongs.forEach((song, queueIndex) => {
            const item = document.createElement('li');
            item.draggable = true;
            item.dataset.queueIndex = String(queueIndex);

            const label = document.createElement('span');
            label.className = 'queue-song-label';
            label.textContent = `${queueIndex + 1}. ${song.title} - ${song.artist || 'Local File'}`;

            const actions = document.createElement('div');
            actions.className = 'queue-actions';

            const playBtn = document.createElement('button');
            playBtn.type = 'button';
            playBtn.className = 'queue-add-btn';
            playBtn.setAttribute('aria-label', `Play ${song.title} now`);
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
            playBtn.addEventListener('click', () => {
                playNextQueue.splice(queueIndex, 1);
                loadSong(song, songs.findIndex((entry) => entry.id === song.id));
                playSong();
                updatePlaylist();
                saveSettings();
            });

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'queue-remove-btn';
            removeBtn.setAttribute('aria-label', `Remove ${song.title} from queue`);
            removeBtn.innerHTML = '<i class="fas fa-times"></i>';
            removeBtn.addEventListener('click', () => {
                playNextQueue.splice(queueIndex, 1);
                updatePlaylist();
                saveSettings();
                showStatus(`Removed ${song.title} from queue`);
            });

            actions.appendChild(playBtn);
            actions.appendChild(removeBtn);
            item.appendChild(label);
            item.appendChild(actions);
            item.addEventListener('dragstart', (event) => handleQueueDragStart(event, queueIndex));
            item.addEventListener('dragover', handleQueueDragOver);
            item.addEventListener('dragleave', handleQueueDragLeave);
            item.addEventListener('drop', (event) => handleQueueDrop(event, queueIndex));
            item.addEventListener('dragend', handleQueueDragEnd);
            queueList.appendChild(item);
        });
    }

    function resetAudioState() {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
        setProgressVisual(0);
        currentTimeEl.textContent = '0:00';
        durationEl.textContent = '0:00';
        updatePlayState(false);
    }

    function openDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(SONG_STORE)) {
                    db.createObjectStore(SONG_STORE, { keyPath: 'id' });
                }
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    function mapRecordToSong(record) {
        return {
            id: record.id,
            title: record.title,
            artist: record.artist,
            audioUrl: URL.createObjectURL(record.audioBlob),
            audioBlob: record.audioBlob,
            coverUrl: record.coverUrl || defaultCover,
            durationText: record.durationText || '',
            durationSeconds: record.durationSeconds || 0,
            isFavorite: Boolean(record.isFavorite),
            fileSignature: record.fileSignature
        };
    }

    async function loadSongsFromDatabase() {
        const db = await openDatabase();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(SONG_STORE, 'readonly');
            const store = transaction.objectStore(SONG_STORE);
            const request = store.getAll();

            request.onsuccess = () => {
                const records = request.result || [];
                records.sort((left, right) => (left.order ?? 0) - (right.order ?? 0));
                resolve(records.map(mapRecordToSong));
                db.close();
            };

            request.onerror = () => {
                reject(request.error);
                db.close();
            };
        });
    }

    async function syncSongsToDatabase() {
        const db = await openDatabase();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(SONG_STORE, 'readwrite');
            const store = transaction.objectStore(SONG_STORE);
            store.clear();

            songs.forEach((song, index) => {
                store.put({
                    id: song.id,
                    title: song.title,
                    artist: song.artist,
                    coverUrl: song.coverUrl,
                    durationText: song.durationText || '',
                    durationSeconds: Number(song.durationSeconds) || 0,
                    isFavorite: Boolean(song.isFavorite),
                    fileSignature: song.fileSignature,
                    order: index,
                    audioBlob: song.audioBlob
                });
            });

            transaction.oncomplete = () => {
                db.close();
                resolve();
            };
            transaction.onerror = () => {
                reject(transaction.error);
                db.close();
            };
        });
    }

    function persistSongsInBackground() {
        syncSongsToDatabase().catch((error) => {
            console.error('Could not save songs to IndexedDB:', error);
            showToast('Could not save songs locally');
        });
    }

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
        songCount.textContent = '(0 songs)';
        updatePlaylistStats();
        renderQueue();
        renderLyrics(0);
        resetAudioState();
        showStatus('Ready to play your local music');
    }

    function showFilteredEmptyState() {
        songList.innerHTML = `
            <li class="empty-state">
                <i class="fas fa-search"></i>
                <p>No songs match this filter</p>
                <p>Try another search or turn off favorites-only mode</p>
            </li>
        `;
        songCount.textContent = `(0 shown of ${songs.length})`;
        updatePlaylistStats();
    }

    function createSongId(file) {
        return `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`;
    }

    function getFileSignature(file) {
        return `${file.name}-${file.size}-${file.lastModified}`;
    }

    function formatTime(value) {
        if (!Number.isFinite(value) || value < 0) {
            return '0:00';
        }

        const minutes = Math.floor(value / 60);
        const seconds = Math.floor(value % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    function setProgressVisual(progressPercent) {
        const safePercent = Math.max(0, Math.min(100, progressPercent || 0));
        progressBar.style.width = `${safePercent}%`;
        progressThumb.style.left = `${safePercent}%`;
    }

    function clearSleepTimer() {
        if (sleepTimerId) {
            clearTimeout(sleepTimerId);
            sleepTimerId = null;
        }
    }

    function scheduleSleepTimer() {
        clearSleepTimer();

        if (!sleepTimerMinutes) {
            return;
        }

        sleepTimerId = setTimeout(() => {
            pauseSong();
            sleepTimerMinutes = 0;
            applyModeButtonStates();
            saveSettings();
            showStatus('Sleep timer finished');
            showToast('Sleep timer finished');
        }, sleepTimerMinutes * 60 * 1000);
    }

    function getPointerProgress(clientX) {
        const rect = progressContainer.getBoundingClientRect();
        const relativeX = Math.min(Math.max(clientX - rect.left, 0), rect.width);
        return rect.width ? relativeX / rect.width : 0;
    }

    function seekFromClientX(clientX) {
        if (songs.length === 0 || !Number.isFinite(audio.duration)) {
            return;
        }

        const progressRatio = getPointerProgress(clientX);
        audio.currentTime = progressRatio * audio.duration;
        setProgressVisual(progressRatio * 100);
        currentTimeEl.textContent = formatTime(audio.currentTime);
    }

    function readFileChunk(file, length) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(file.slice(0, length));
        });
    }

    function decodeText(bytes, encodingByte) {
        if (!bytes || bytes.length === 0) {
            return '';
        }

        let decoderEncoding = 'utf-8';
        let payload = bytes;

        if (encodingByte === 0) {
            decoderEncoding = 'iso-8859-1';
        } else if (encodingByte === 1) {
            if (bytes.length >= 2) {
                if (bytes[0] === 0xff && bytes[1] === 0xfe) {
                    decoderEncoding = 'utf-16le';
                    payload = bytes.slice(2);
                } else if (bytes[0] === 0xfe && bytes[1] === 0xff) {
                    decoderEncoding = 'utf-16be';
                    payload = bytes.slice(2);
                } else {
                    decoderEncoding = 'utf-16le';
                }
            } else {
                decoderEncoding = 'utf-16le';
            }
        } else if (encodingByte === 2) {
            decoderEncoding = 'utf-16be';
        }

        try {
            return new TextDecoder(decoderEncoding)
                .decode(payload)
                .replace(/\u0000/g, '')
                .trim();
        } catch (error) {
            console.error('Metadata decoding failed:', error);
            return '';
        }
    }

    function readSyncSafeInteger(bytes, offset) {
        return (bytes[offset] << 21)
            | (bytes[offset + 1] << 14)
            | (bytes[offset + 2] << 7)
            | bytes[offset + 3];
    }

    function readFrameSize(bytes, offset, usesSyncSafe) {
        return usesSyncSafe
            ? readSyncSafeInteger(bytes, offset)
            : ((bytes[offset] << 24)
                | (bytes[offset + 1] << 16)
                | (bytes[offset + 2] << 8)
                | bytes[offset + 3]);
    }

    function findNullTerminator(bytes, start, step = 1) {
        for (let index = start; index < bytes.length - (step - 1); index += step) {
            if (step === 1 && bytes[index] === 0) {
                return index;
            }
            if (step === 2 && bytes[index] === 0 && bytes[index + 1] === 0) {
                return index;
            }
        }
        return -1;
    }

    function extractApicFrame(frameData) {
        if (!frameData || frameData.length < 4) {
            return '';
        }

        const encodingByte = frameData[0];
        const mimeEnd = findNullTerminator(frameData, 1, 1);
        if (mimeEnd === -1) {
            return '';
        }

        const mimeType = decodeText(frameData.slice(1, mimeEnd), 0) || 'image/jpeg';
        let offset = mimeEnd + 2;
        const descriptionEnd = encodingByte === 0 || encodingByte === 3
            ? findNullTerminator(frameData, offset, 1)
            : findNullTerminator(frameData, offset, 2);

        if (descriptionEnd === -1) {
            return '';
        }

        offset = descriptionEnd + (encodingByte === 0 || encodingByte === 3 ? 1 : 2);
        const imageBytes = frameData.slice(offset);
        if (imageBytes.length === 0) {
            return '';
        }

        let binary = '';
        imageBytes.forEach((byte) => {
            binary += String.fromCharCode(byte);
        });

        return `data:${mimeType};base64,${btoa(binary)}`;
    }

    async function extractMetadata(file) {
        const fallbackTitle = file.name.replace(/\.[^/.]+$/, '');

        try {
            const buffer = await readFileChunk(file, Math.min(file.size, 256 * 1024));
            const bytes = new Uint8Array(buffer);

            if (bytes.length < 10 || String.fromCharCode(...bytes.slice(0, 3)) !== 'ID3') {
                return {
                    title: fallbackTitle,
                    artist: 'Local File',
                    coverUrl: defaultCover
                };
            }

            const version = bytes[3];
            const tagSize = readSyncSafeInteger(bytes, 6);
            const usesSyncSafeFrameSizes = version === 4;
            let offset = 10;

            const metadata = {
                title: fallbackTitle,
                artist: 'Local File',
                coverUrl: defaultCover
            };

            while (offset + 10 <= Math.min(bytes.length, tagSize + 10)) {
                const frameId = String.fromCharCode(
                    bytes[offset],
                    bytes[offset + 1],
                    bytes[offset + 2],
                    bytes[offset + 3]
                );

                if (!frameId.trim()) {
                    break;
                }

                const frameSize = readFrameSize(bytes, offset + 4, usesSyncSafeFrameSizes);
                if (!frameSize || frameSize < 0) {
                    break;
                }

                const frameStart = offset + 10;
                const frameEnd = frameStart + frameSize;
                if (frameEnd > bytes.length) {
                    break;
                }

                const frameData = bytes.slice(frameStart, frameEnd);
                const encodingByte = frameData[0];
                const textValue = decodeText(frameData.slice(1), encodingByte);

                if (frameId === 'TIT2' && textValue) {
                    metadata.title = textValue;
                } else if (frameId === 'TPE1' && textValue) {
                    metadata.artist = textValue;
                } else if (frameId === 'APIC') {
                    const embeddedCover = extractApicFrame(frameData);
                    if (embeddedCover) {
                        metadata.coverUrl = embeddedCover;
                    }
                }

                offset = frameEnd;
            }

            return metadata;
        } catch (error) {
            console.error('Metadata extraction failed:', error);
            return {
                title: fallbackTitle,
                artist: 'Local File',
                coverUrl: defaultCover
            };
        }
    }

    function getFilteredSongs() {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        return songs
            .map((song, index) => ({ song, index }))
            .filter(({ song }) => {
                const matchesSearch = !normalizedSearch
                    || `${song.title} ${song.artist}`.toLowerCase().includes(normalizedSearch);
                const matchesFavorites = !showFavoritesOnly || Boolean(song.isFavorite);
                return matchesSearch && matchesFavorites;
            })
            .sort((left, right) => {
                if (sortMode === 'title') {
                    return left.song.title.localeCompare(right.song.title);
                }

                if (sortMode === 'favorites') {
                    const favoriteDelta = Number(Boolean(right.song.isFavorite)) - Number(Boolean(left.song.isFavorite));
                    return favoriteDelta || right.index - left.index;
                }

                if (sortMode === 'most-played') {
                    const leftHistory = getSongHistory(left.song);
                    const rightHistory = getSongHistory(right.song);
                    return (rightHistory.count - leftHistory.count)
                        || (new Date(rightHistory.lastPlayedAt || 0).getTime() - new Date(leftHistory.lastPlayedAt || 0).getTime())
                        || (right.index - left.index);
                }

                if (sortMode === 'recent-played') {
                    const leftPlayedAt = new Date(getSongHistory(left.song).lastPlayedAt || 0).getTime();
                    const rightPlayedAt = new Date(getSongHistory(right.song).lastPlayedAt || 0).getTime();
                    return (rightPlayedAt - leftPlayedAt) || (right.index - left.index);
                }

                return right.index - left.index;
            });
    }

    function shuffleIndices(length) {
        const indices = Array.from({ length }, (_, index) => index);

        for (let index = indices.length - 1; index > 0; index -= 1) {
            const randomIndex = Math.floor(Math.random() * (index + 1));
            [indices[index], indices[randomIndex]] = [indices[randomIndex], indices[index]];
        }

        return indices;
    }

    function rebuildShuffleOrder(currentIndex = currentSongIndex) {
        if (songs.length === 0) {
            shuffleOrder = [];
            shufflePosition = 0;
            return;
        }

        shuffleOrder = shuffleIndices(songs.length);
        const currentPosition = shuffleOrder.indexOf(currentIndex);

        if (currentPosition > 0) {
            shuffleOrder.splice(currentPosition, 1);
            shuffleOrder.unshift(currentIndex);
        } else if (currentPosition === -1) {
            shuffleOrder.unshift(currentIndex);
        }

        shufflePosition = 0;
    }

    function syncShufflePosition() {
        if (!isShuffleOn || songs.length === 0) {
            return;
        }

        const currentPosition = shuffleOrder.indexOf(currentSongIndex);
        if (currentPosition === -1 || shuffleOrder.length !== songs.length) {
            rebuildShuffleOrder(currentSongIndex);
            return;
        }

        shufflePosition = currentPosition;
    }

    function updatePlayState(playing) {
        isPlaying = playing;
        playBtn.innerHTML = playing ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
        playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
        coverArt.style.animationPlayState = playing ? 'running' : 'paused';
        coverArt.classList.toggle('playing', playing);

        if (character) {
            character.style.animation = playing
                ? 'float 3s ease-in-out infinite'
                : 'float 6s ease-in-out infinite';
        }

        updatePlaylistHighlights();
    }

    function loadSong(song, index = currentSongIndex) {
        if (!song) {
            showEmptyState();
            return;
        }

        currentSongIndex = index;
        countedPlaySongId = null;
        activeLyricsLineIndex = -1;
        syncShufflePosition();

        songTitle.style.animation = 'none';
        artist.style.animation = 'none';
        void songTitle.offsetWidth;
        void artist.offsetWidth;
        songTitle.style.animation = 'slide-in 0.5s ease-out';
        artist.style.animation = 'slide-in 0.5s ease-out';

        songTitle.textContent = song.title || 'Unknown Title';
        artist.textContent = song.artist || 'Local File';

        cover.style.opacity = '0';
        setTimeout(() => {
            cover.src = song.coverUrl || defaultCover;
            cover.classList.toggle('default-cover', !song.coverUrl || song.coverUrl === defaultCover);
            cover.style.opacity = '1';
        }, 200);

        audio.src = song.audioUrl;
        audio.playbackRate = playbackRate;
        currentTimeEl.textContent = '0:00';
        durationEl.textContent = '0:00';
        setProgressVisual(0);
        renderLyrics(0);
        updatePlaylistHighlights();
        saveSettings();
        showStatus(`${isPlaying ? 'Playing' : 'Selected'}: ${song.title}`);
    }

    function updatePlaylistHighlights() {
        const playlistItems = document.querySelectorAll('#song-list li[data-song-index]');

        playlistItems.forEach((item) => {
            const itemIndex = Number(item.dataset.songIndex);
            const isCurrent = itemIndex === currentSongIndex;

            item.classList.toggle('playing', isCurrent);
            if (isCurrent) {
                item.style.animation = 'playlist-item-selected 0.5s ease';
                item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                setTimeout(() => {
                    item.style.animation = '';
                }, 500);
            }
        });
    }

    function reorderSongs(fromIndex, toIndex) {
        if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= songs.length || toIndex >= songs.length) {
            return;
        }

        const [movedSong] = songs.splice(fromIndex, 1);
        songs.splice(toIndex, 0, movedSong);

        if (currentSongIndex === fromIndex) {
            currentSongIndex = toIndex;
        } else if (fromIndex < currentSongIndex && toIndex >= currentSongIndex) {
            currentSongIndex -= 1;
        } else if (fromIndex > currentSongIndex && toIndex <= currentSongIndex) {
            currentSongIndex += 1;
        }

        if (isShuffleOn) {
            rebuildShuffleOrder(currentSongIndex);
        }

        updatePlaylist();
        persistSongsInBackground();
        saveSettings();
    }

    function enqueueSong(songId) {
        const song = songs.find((entry) => entry.id === songId);
        if (!song) {
            return;
        }

        playNextQueue = playNextQueue.filter((queuedId) => queuedId !== songId);
        playNextQueue.unshift(songId);
        updatePlaylist();
        saveSettings();
        showStatus(`${song.title} added to play next queue`);
        showToast(`${song.title} added to queue`);
    }

    function reorderQueue(fromIndex, toIndex) {
        if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= playNextQueue.length || toIndex >= playNextQueue.length) {
            return;
        }

        const [movedSongId] = playNextQueue.splice(fromIndex, 1);
        playNextQueue.splice(toIndex, 0, movedSongId);
        updatePlaylist();
        saveSettings();
    }

    function clearQueue() {
        playNextQueue = [];
        updatePlaylist();
        saveSettings();
        showStatus('Queue cleared');
        showToast('Queue cleared');
    }

    function handleQueueDragStart(event, queueIndex) {
        draggedQueueIndex = queueIndex;
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', String(queueIndex));
        event.currentTarget.classList.add('dragging');
    }

    function handleQueueDragOver(event) {
        if (draggedQueueIndex === null) {
            return;
        }

        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        event.currentTarget.classList.add('drag-over');
    }

    function handleQueueDragLeave(event) {
        event.currentTarget.classList.remove('drag-over');
    }

    function handleQueueDrop(event, queueIndex) {
        if (draggedQueueIndex === null) {
            return;
        }

        event.preventDefault();
        event.currentTarget.classList.remove('drag-over');
        reorderQueue(draggedQueueIndex, queueIndex);
        showStatus('Queue order updated');
        showToast('Queue order updated');
        draggedQueueIndex = null;
    }

    function handleQueueDragEnd(event) {
        event.currentTarget.classList.remove('dragging');
        document.querySelectorAll('#queue-list li.drag-over').forEach((item) => {
            item.classList.remove('drag-over');
        });
        draggedQueueIndex = null;
    }

    function handleDragStart(event, index) {
        if (sortMode !== 'added') {
            event.preventDefault();
            showStatus('Switch sorting to Recently Added to reorder songs');
            return;
        }

        draggedSongIndex = index;
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', String(index));
        event.currentTarget.classList.add('dragging');
    }

    function handleDragOver(event) {
        if (draggedSongIndex === null || sortMode !== 'added') {
            return;
        }

        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        event.currentTarget.classList.add('drag-over');
    }

    function handleDragLeave(event) {
        event.currentTarget.classList.remove('drag-over');
    }

    function handleDrop(event, targetIndex) {
        if (draggedSongIndex === null || sortMode !== 'added') {
            return;
        }

        event.preventDefault();
        event.currentTarget.classList.remove('drag-over');
        reorderSongs(draggedSongIndex, targetIndex);
        showStatus('Playlist order updated');
        draggedSongIndex = null;
    }

    function handleDragEnd(event) {
        event.currentTarget.classList.remove('dragging');
        document.querySelectorAll('#song-list li.drag-over').forEach((item) => {
            item.classList.remove('drag-over');
        });
        draggedSongIndex = null;
    }

    function updatePlaylist() {
        if (songs.length === 0) {
            showEmptyState();
            return;
        }

        if (currentSongIndex >= songs.length) {
            currentSongIndex = songs.length - 1;
        }

        const filteredSongs = getFilteredSongs();
        if (filteredSongs.length === 0) {
            songList.innerHTML = '';
            showFilteredEmptyState();
            renderQueue();
            updatePlaylistHighlights();
            return;
        }

        songList.innerHTML = '';

        filteredSongs.forEach(({ song, index }) => {
            const li = document.createElement('li');
            li.dataset.songIndex = String(index);
            li.draggable = sortMode === 'added';

            const songInfo = document.createElement('div');
            songInfo.className = 'song-info-container';

            const equalizer = document.createElement('span');
            equalizer.className = 'equalizer';
            equalizer.setAttribute('aria-hidden', 'true');
            equalizer.innerHTML = '<span></span><span></span><span></span>';

            const songText = document.createElement('div');
            songText.className = 'song-text';

            const songLabel = document.createElement('span');
            songLabel.className = 'song-label';
            songLabel.textContent = `${song.title || 'Unknown Title'} - ${song.artist || 'Local File'}`;

            const songMetaRow = document.createElement('div');
            songMetaRow.className = 'song-meta-row';

            const queuePosition = playNextQueue.indexOf(song.id);
            if (queuePosition !== -1) {
                const queueBadge = document.createElement('span');
                queueBadge.className = `song-badge${queuePosition === 0 ? ' next-up' : ''}`;
                queueBadge.textContent = queuePosition === 0
                    ? 'Next Up'
                    : `Queued ${queuePosition + 1}`;
                songMetaRow.appendChild(queueBadge);
            }

            if (Array.isArray(lyricsBySongId[song.id]) && lyricsBySongId[song.id].length > 0) {
                const lyricsBadge = document.createElement('span');
                lyricsBadge.className = 'song-badge lyrics-loaded';
                lyricsBadge.textContent = 'Lyrics';
                songMetaRow.appendChild(lyricsBadge);
            }

            songText.appendChild(songLabel);
            if (songMetaRow.childElementCount > 0) {
                songText.appendChild(songMetaRow);
            }
            songInfo.appendChild(equalizer);
            songInfo.appendChild(songText);

            const durationBadge = document.createElement('span');
            durationBadge.className = 'song-duration';
            durationBadge.textContent = song.durationText || '0:00';

            const favoriteBtn = document.createElement('button');
            favoriteBtn.type = 'button';
            favoriteBtn.className = `playlist-favorite-btn${song.isFavorite ? ' active' : ''}`;
            favoriteBtn.setAttribute('aria-label', `${song.isFavorite ? 'Remove from' : 'Add to'} favorites`);
            favoriteBtn.innerHTML = `<i class="${song.isFavorite ? 'fas' : 'far'} fa-star"></i>`;
            favoriteBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                toggleFavorite(index);
            });

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'playlist-remove-btn';
            removeBtn.setAttribute('aria-label', `Remove ${song.title} from playlist`);
            removeBtn.innerHTML = '<i class="fas fa-times"></i>';
            removeBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                removeSong(index);
            });

            const queueBtn = document.createElement('button');
            queueBtn.type = 'button';
            queueBtn.className = 'queue-add-btn';
            queueBtn.setAttribute('aria-label', `Add ${song.title} to play next queue`);
            queueBtn.innerHTML = '<i class="fas fa-list"></i>';
            queueBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                enqueueSong(song.id);
            });

            li.appendChild(songInfo);
            li.appendChild(durationBadge);
            li.appendChild(favoriteBtn);
            li.appendChild(queueBtn);
            li.appendChild(removeBtn);

            li.addEventListener('click', () => {
                loadSong(song, index);
                playSong();
            });
            li.addEventListener('dragstart', (event) => handleDragStart(event, index));
            li.addEventListener('dragover', handleDragOver);
            li.addEventListener('dragleave', handleDragLeave);
            li.addEventListener('drop', (event) => handleDrop(event, index));
            li.addEventListener('dragend', handleDragEnd);

            if (!song.durationText) {
                const tempAudio = new Audio(song.audioUrl);
                tempAudio.addEventListener('loadedmetadata', () => {
                    song.durationText = formatTime(tempAudio.duration);
                    song.durationSeconds = tempAudio.duration;
                    durationBadge.textContent = song.durationText;
                    updatePlaylistStats();
                    persistSongsInBackground();
                }, { once: true });
            }

            songList.appendChild(li);
        });

        songCount.textContent = filteredSongs.length === songs.length
            ? `(${songs.length} ${songs.length === 1 ? 'song' : 'songs'})`
            : `(${filteredSongs.length} shown of ${songs.length})`;
        updatePlaylistStats();
        renderQueue();
        updatePlaylistHighlights();
    }

    function revokeSongUrl(song) {
        if (song && song.audioUrl) {
            URL.revokeObjectURL(song.audioUrl);
        }
    }

    async function handleFiles(fileList) {
        if (!fileList || fileList.length === 0) {
            return;
        }

        try {
            const existingSignatures = new Set(songs.map((song) => song.fileSignature));
            let skippedFiles = 0;
            let invalidFiles = 0;

            const metadataTasks = Array.from(fileList).map(async (file) => {
                if (!file.type.startsWith('audio/')) {
                    invalidFiles += 1;
                    return null;
                }

                const fileSignature = getFileSignature(file);
                if (existingSignatures.has(fileSignature)) {
                    skippedFiles += 1;
                    return null;
                }

                existingSignatures.add(fileSignature);

                const metadata = await extractMetadata(file);

                return {
                    id: createSongId(file),
                    title: metadata.title || file.name.replace(/\.[^/.]+$/, ''),
                    artist: metadata.artist || 'Local File',
                    audioUrl: URL.createObjectURL(file),
                    audioBlob: file,
                    coverUrl: metadata.coverUrl || defaultCover,
                    durationText: '',
                    durationSeconds: 0,
                    isFavorite: favoriteSignatures.includes(fileSignature),
                    fileSignature
                };
            });

            const nextSongs = (await Promise.all(metadataTasks)).filter(Boolean);

            if (nextSongs.length === 0) {
                const reasons = [];
                if (invalidFiles) {
                    reasons.push(`${invalidFiles} unsupported`);
                }
                if (skippedFiles) {
                    reasons.push(`${skippedFiles} duplicate`);
                }
                showStatus(`No new songs added${reasons.length ? ` (${reasons.join(', ')})` : ''}`);
                return;
            }

            const hadSongs = songs.length > 0;
            songs.push(...nextSongs);
            nextSongs.forEach((song) => {
                if (!playHistory[song.id]) {
                    playHistory[song.id] = { count: 0, lastPlayedAt: null };
                }
            });

            if (isShuffleOn) {
                rebuildShuffleOrder(hadSongs ? currentSongIndex : 0);
            }

            updatePlaylist();
            persistSongsInBackground();

            if (!hadSongs) {
                loadSong(songs[0], 0);
            }

            const statusParts = [`Added ${nextSongs.length} ${nextSongs.length === 1 ? 'song' : 'songs'}`];
            if (invalidFiles) {
                statusParts.push(`${invalidFiles} unsupported`);
            }
            if (skippedFiles) {
                statusParts.push(`${skippedFiles} duplicate`);
            }
            showStatus(statusParts.join(' | '));
            showToast(statusParts.join(' | '));
        } catch (error) {
            console.error('Could not process uploaded files:', error);
            showStatus('Could not read one or more files');
            showToast('Could not read one or more files');
        }
    }

    function removeSong(index) {
        if (index < 0 || index >= songs.length) {
            return;
        }

        const removedSong = songs[index];
        const wasCurrentSong = index === currentSongIndex;
        const wasPlaying = isPlaying;

        revokeSongUrl(removedSong);
        songs.splice(index, 1);
        playNextQueue = playNextQueue.filter((songId) => songId !== removedSong.id);
        delete lyricsBySongId[removedSong.id];
        delete playHistory[removedSong.id];

        if (songs.length === 0) {
            currentSongIndex = 0;
            shuffleOrder = [];
            shufflePosition = 0;
            resetAudioState();
            updatePlaylist();
            persistSongsInBackground();
            saveSettings();
            showStatus(`Removed: ${removedSong.title}`);
            showToast(`Removed: ${removedSong.title}`);
            return;
        }

        if (index < currentSongIndex) {
            currentSongIndex -= 1;
        } else if (wasCurrentSong) {
            currentSongIndex = Math.min(index, songs.length - 1);
        }

        if (isShuffleOn) {
            rebuildShuffleOrder(currentSongIndex);
        }

        updatePlaylist();

        if (wasCurrentSong) {
            updatePlayState(false);
            loadSong(songs[currentSongIndex], currentSongIndex);
            if (wasPlaying) {
                playSong();
            }
        }

        persistSongsInBackground();
        saveSettings();
        showStatus(`Removed: ${removedSong.title}`);
        showToast(`Removed: ${removedSong.title}`);
    }

    function toggleFavorite(index) {
        if (index < 0 || index >= songs.length) {
            return;
        }

        songs[index].isFavorite = !songs[index].isFavorite;
        if (songs[index].isFavorite) {
            favoriteSignatures = Array.from(new Set([...favoriteSignatures, songs[index].fileSignature]));
        } else {
            favoriteSignatures = favoriteSignatures.filter((signature) => signature !== songs[index].fileSignature);
        }
        updatePlaylist();
        persistSongsInBackground();
        saveSettings();
        showStatus(`${songs[index].title} ${songs[index].isFavorite ? 'added to' : 'removed from'} favorites`);
    }

    function clearPlaylist() {
        songs.forEach(revokeSongUrl);
        songs = [];
        currentSongIndex = 0;
        shuffleOrder = [];
        shufflePosition = 0;
        playNextQueue = [];
        lyricsBySongId = {};
        playHistory = {};
        countedPlaySongId = null;
        activeLyricsLineIndex = -1;
        resetAudioState();
        updatePlaylist();
        persistSongsInBackground();
        saveSettings();
        showStatus('Playlist cleared');
        showToast('Playlist cleared');
    }

    function playSong() {
        if (songs.length === 0 || !songs[currentSongIndex]) {
            showStatus('Add songs to start playing');
            return;
        }

        updatePlayState(true);
        audio.play()
            .then(() => {
                if (countedPlaySongId !== songs[currentSongIndex].id) {
                    recordPlayback(songs[currentSongIndex]);
                    countedPlaySongId = songs[currentSongIndex].id;
                }
                showStatus(`Playing: ${songs[currentSongIndex].title}`);
            })
            .catch((error) => {
                console.error('Playback failed:', error);
                updatePlayState(false);
                showStatus('Playback failed for this file');
            });
    }

    function pauseSong() {
        audio.pause();
        updatePlayState(false);

        if (songs[currentSongIndex]) {
            showStatus(`Paused: ${songs[currentSongIndex].title}`);
        }
    }

    function prevSong() {
        if (songs.length === 0) {
            return;
        }

        if (isShuffleOn) {
            syncShufflePosition();
            shufflePosition = (shufflePosition - 1 + shuffleOrder.length) % shuffleOrder.length;
            currentSongIndex = shuffleOrder[shufflePosition];
        } else {
            currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
        }

        loadSong(songs[currentSongIndex], currentSongIndex);
        if (isPlaying) {
            playSong();
        }
    }

    function nextSong() {
        if (songs.length === 0) {
            return;
        }

        if (isRepeatOn) {
            audio.currentTime = 0;
            playSong();
            return;
        }

        if (playNextQueue.length > 0) {
            const nextQueuedId = playNextQueue.shift();
            const queuedIndex = songs.findIndex((song) => song.id === nextQueuedId);
            if (queuedIndex !== -1) {
                currentSongIndex = queuedIndex;
                updatePlaylist();
                saveSettings();
                loadSong(songs[currentSongIndex], currentSongIndex);
                if (isPlaying) {
                    playSong();
                }
                return;
            }
        }

        if (isShuffleOn) {
            syncShufflePosition();

            if (shufflePosition >= shuffleOrder.length - 1) {
                rebuildShuffleOrder(currentSongIndex);
            }

            shufflePosition += 1;
            currentSongIndex = shuffleOrder[shufflePosition] ?? shuffleOrder[0];
        } else {
            currentSongIndex = (currentSongIndex + 1) % songs.length;
        }

        loadSong(songs[currentSongIndex], currentSongIndex);
        if (isPlaying) {
            playSong();
        }
    }

    function updateProgress(event) {
        const { duration, currentTime } = event.target;
        const progressPercent = duration ? (currentTime / duration) * 100 : 0;

        if (!isSeeking) {
            setProgressVisual(progressPercent);
        }

        progressBar.style.animation = 'none';
        void progressBar.offsetWidth;
        progressBar.style.animation = 'progress-pulse 0.3s ease';

        currentTimeEl.classList.remove('time-update');
        void currentTimeEl.offsetWidth;
        currentTimeEl.classList.add('time-update');

        currentTimeEl.textContent = formatTime(currentTime);
        durationEl.textContent = formatTime(duration);
        renderLyrics(currentTime);
    }

    function setProgress(event) {
        if (songs.length === 0 || !Number.isFinite(audio.duration)) {
            return;
        }

        const rect = progressContainer.getBoundingClientRect();
        const clickX = event.clientX - rect.left;

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

        setTimeout(() => ripple.remove(), 600);

        seekFromClientX(event.clientX);
    }

    function startSeek(event) {
        if (songs.length === 0 || !Number.isFinite(audio.duration)) {
            return;
        }

        isSeeking = true;
        progressContainer.classList.add('dragging');
        progressContainer.setPointerCapture?.(event.pointerId);
        seekFromClientX(event.clientX);
    }

    function moveSeek(event) {
        if (!isSeeking) {
            return;
        }

        seekFromClientX(event.clientX);
    }

    function endSeek(event) {
        if (!isSeeking) {
            return;
        }

        seekFromClientX(event.clientX);
        isSeeking = false;
        progressContainer.classList.remove('dragging');
        progressContainer.releasePointerCapture?.(event.pointerId);
    }

    async function handleFileInputChange(event) {
        await handleFiles(event.target.files);
        event.target.value = '';
    }

    async function handleLyricsInputChange(event) {
        const song = getCurrentSong();
        const files = Array.from(event.target.files || []);
        event.target.value = '';

        if (files.length === 0) {
            return;
        }

        try {
            let loadedCount = 0;
            let matchedCount = 0;
            let fallbackCount = 0;

            for (const file of files) {
                const text = await file.text();
                const parsedLyrics = parseLrc(text);
                if (parsedLyrics.length === 0) {
                    continue;
                }

                const matchedSongIndex = findSongIndexByLyricsFile(file.name);
                const targetSong = matchedSongIndex !== -1
                    ? songs[matchedSongIndex]
                    : (files.length === 1 ? song : null);

                if (!targetSong) {
                    continue;
                }

                lyricsBySongId[targetSong.id] = parsedLyrics;
                loadedCount += 1;
                if (matchedSongIndex !== -1) {
                    matchedCount += 1;
                } else {
                    fallbackCount += 1;
                }
            }

            if (loadedCount === 0) {
                showStatus(song
                    ? 'No matching timed lyrics found for the selected files'
                    : 'Select a song or use matching lyric filenames');
                showToast('No lyrics were loaded');
                return;
            }

            activeLyricsLineIndex = -1;
            renderLyrics(audio.currentTime || 0);
            updatePlaylist();
            saveSettings();

            const parts = [`Loaded ${loadedCount} lyric ${loadedCount === 1 ? 'file' : 'files'}`];
            if (matchedCount) {
                parts.push(`${matchedCount} auto-matched`);
            }
            if (fallbackCount) {
                parts.push(`${fallbackCount} assigned to current song`);
            }
            showStatus(parts.join(' | '));
            showToast(parts.join(' | '));
        } catch (error) {
            console.error('Could not read lyrics file:', error);
            showStatus('Could not read this lyrics file');
            showToast('Could not read this lyrics file');
        }
    }

    function clearCurrentLyrics() {
        const song = getCurrentSong();
        if (!song) {
            showStatus('Select a song before clearing lyrics');
            return;
        }

        delete lyricsBySongId[song.id];
        activeLyricsLineIndex = -1;
        renderLyrics(0);
        saveSettings();
        showStatus(`Cleared lyrics for ${song.title}`);
        showToast(`Cleared lyrics for ${song.title}`);
    }

    function toggleRepeat() {
        isRepeatOn = !isRepeatOn;
        applyModeButtonStates();
        saveSettings();
        showStatus(`Repeat ${isRepeatOn ? 'enabled' : 'disabled'}`);
    }

    function toggleShuffle() {
        isShuffleOn = !isShuffleOn;

        if (isShuffleOn) {
            rebuildShuffleOrder(currentSongIndex);
        } else {
            shuffleOrder = [];
            shufflePosition = 0;
        }

        applyModeButtonStates();
        saveSettings();
        showStatus(`Shuffle ${isShuffleOn ? 'enabled' : 'disabled'}`);
    }

    function handleSearchInput(event) {
        searchTerm = event.target.value;
        updatePlaylist();
        saveSettings();

        const normalizedSearch = searchTerm.trim();
        showStatus(normalizedSearch ? `Showing results for "${normalizedSearch}"` : 'Showing all songs');
    }

    function handleSortChange(event) {
        sortMode = event.target.value;
        updatePlaylist();
        saveSettings();
        showStatus(
            sortMode === 'title'
                ? 'Sorting by title'
                : sortMode === 'favorites'
                    ? 'Sorting with favorites first'
                    : sortMode === 'most-played'
                        ? 'Sorting by most played'
                        : sortMode === 'recent-played'
                            ? 'Sorting by recently played'
                            : 'Sorting by recently added'
        );
    }

    function handleSpeedChange(event) {
        playbackRate = Number(event.target.value);
        audio.playbackRate = playbackRate;
        saveSettings();
        showStatus(`Playback speed: ${playbackRate}x`);
    }

    function handleSleepTimerChange(event) {
        sleepTimerMinutes = Number(event.target.value);
        scheduleSleepTimer();
        saveSettings();
        showStatus(sleepTimerMinutes ? `Sleep timer: ${sleepTimerMinutes} min` : 'Sleep timer off');
        showToast(sleepTimerMinutes ? `Sleep timer set for ${sleepTimerMinutes} min` : 'Sleep timer off');
    }

    function toggleFavoritesFilter() {
        showFavoritesOnly = !showFavoritesOnly;
        applyModeButtonStates();
        updatePlaylist();
        saveSettings();
        showStatus(showFavoritesOnly ? 'Showing favorite songs only' : 'Showing all songs');
    }

    function adjustVolume(delta) {
        const nextVolume = Math.max(0, Math.min(1, audio.volume + delta));
        audio.volume = Number(nextVolume.toFixed(2));
        volumeSlider.value = audio.volume;
        saveSettings();
        showStatus(`Volume: ${Math.round(audio.volume * 100)}%`);
    }

    function isInteractiveElement(target) {
        return ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(target.tagName) || target.isContentEditable;
    }

    function handleKeyboardShortcuts(event) {
        if (isInteractiveElement(event.target)) {
            return;
        }

        if (event.code === 'Space') {
            event.preventDefault();
            if (songs.length === 0) {
                return;
            }
            isPlaying ? pauseSong() : playSong();
            return;
        }

        if (event.key === 'ArrowRight') {
            event.preventDefault();
            if (Number.isFinite(audio.duration)) {
                audio.currentTime = Math.min(audio.duration, audio.currentTime + SEEK_STEP);
            }
            return;
        }

        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            audio.currentTime = Math.max(0, audio.currentTime - SEEK_STEP);
            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            adjustVolume(VOLUME_STEP);
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            adjustVolume(-VOLUME_STEP);
            return;
        }

        if (event.key.toLowerCase() === 'n') {
            nextSong();
            return;
        }

        if (event.key.toLowerCase() === 'p') {
            prevSong();
        }
    }

    function bindEvents() {
        playBtn.addEventListener('click', () => {
            if (songs.length === 0) {
                showStatus('Add songs to start playing');
                return;
            }

            isPlaying ? pauseSong() : playSong();
        });

        prevBtn.addEventListener('click', prevSong);
        nextBtn.addEventListener('click', nextSong);
        repeatBtn.addEventListener('click', toggleRepeat);
        shuffleBtn.addEventListener('click', toggleShuffle);
        clearPlaylistBtn.addEventListener('click', clearPlaylist);
        clearQueueBtn.addEventListener('click', clearQueue);
        favoritesFilterBtn.addEventListener('click', toggleFavoritesFilter);
        searchInput.addEventListener('input', handleSearchInput);
        sortSelect.addEventListener('change', handleSortChange);
        speedSelect.addEventListener('change', handleSpeedChange);
        sleepTimerSelect.addEventListener('change', handleSleepTimerChange);
        lyricsUploadBtn.addEventListener('click', () => {
            if (songs.length === 0) {
                showStatus('Add songs before loading lyrics');
                return;
            }

            lyricsInput.click();
        });
        clearLyricsBtn.addEventListener('click', clearCurrentLyrics);
        lyricsInput.addEventListener('change', handleLyricsInputChange);

        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('loadedmetadata', updateProgress);
        audio.addEventListener('ended', nextSong);
        audio.addEventListener('error', () => {
            updatePlayState(false);
            showStatus('This audio file could not be played');
        });

        progressContainer.addEventListener('click', setProgress);
        progressContainer.addEventListener('pointerdown', startSeek);
        progressContainer.addEventListener('pointermove', moveSeek);
        progressContainer.addEventListener('pointerup', endSeek);
        progressContainer.addEventListener('pointercancel', endSeek);

        volumeSlider.addEventListener('input', (event) => {
            audio.volume = Number(event.target.value);
            saveSettings();
            showStatus(`Volume: ${Math.round(audio.volume * 100)}%`);
        });

        uploadBtn.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', handleFileInputChange);
        document.addEventListener('keydown', handleKeyboardShortcuts);
        window.addEventListener('beforeunload', () => {
            songs.forEach(revokeSongUrl);
        });
    }

    init();
});
