class EtsukoPlayer {
  constructor() {
    this.audio = document.getElementById('audio-engine');
    this.currentTrack = null;
    this.queue = [];
    this.queueIndex = -1;
    this.autoplayTracks = [];
    this.isShuffle = false;
    this.repeatMode = 0; // 0: off, 1: all, 2: one
    this.volume = parseFloat(localStorage.getItem('etsuko_volume') || '0.75');
    this.isMuted = false;
    this.isPlaying = false;
    this.audioContext = null;
    this.analyser = null;
    this.dataArray = null;

    this.initElements();
    this.initAudio();
    this.initListeners();
    this.initMediaSession();
  }

  initElements() {
    this.btnPlayPause = document.getElementById('btn-play-pause');
    this.iconPlay = document.getElementById('icon-play');
    this.iconPause = document.getElementById('icon-pause');
    this.btnPrev = document.getElementById('btn-prev');
    this.btnNext = document.getElementById('btn-next');
    this.btnShuffle = document.getElementById('btn-shuffle');
    this.shuffleDot = document.getElementById('shuffle-dot');
    this.btnRepeat = document.getElementById('btn-repeat');
    this.repeatDot = document.getElementById('repeat-dot');
    this.repeatBadge = document.getElementById('repeat-badge');
    this.coverSpinner = document.getElementById('cover-spinner');

    this.currentTimeLabel = document.getElementById('current-time');
    this.totalDurationLabel = document.getElementById('total-duration');
    this.scrubberBar = document.getElementById('timeline-scrubber');
    this.scrubberProgress = document.getElementById('timeline-progress');
    this.scrubberBuffered = document.getElementById('timeline-buffered');

    this.playerCover = document.getElementById('player-cover');
    this.playerTitle = document.getElementById('player-title');
    this.playerArtist = document.getElementById('player-artist');
    this.playerLikeBtn = document.getElementById('player-like-btn');
    this.playerAddPlaylistBtn = document.getElementById('player-add-playlist-btn');

    this.volumeScrubber = document.getElementById('volume-scrubber');
    this.volumeProgress = document.getElementById('volume-progress');
    this.btnVolumeIcon = document.getElementById('btn-volume-icon');
    this.iconVolHigh = document.getElementById('icon-vol-high');
    this.iconVolMute = document.getElementById('icon-vol-mute');

    this.canvasVisualizer = document.getElementById('audio-visualizer');
    this.canvasCtx = this.canvasVisualizer.getContext('2d');
  }

  initAudio() {
    this.audio.volume = this.volume;
    this.updateVolumeUI(this.volume);

    this.audio.addEventListener('timeupdate', () => this.onTimeUpdate());
    this.audio.addEventListener('progress', () => this.onProgress());
    this.audio.addEventListener('ended', () => this.onEnded());
    this.audio.addEventListener('play', () => this.onPlayStateChange(true));
    this.audio.addEventListener('pause', () => this.onPlayStateChange(false));
    this.audio.addEventListener('waiting', () => this.showSpinner(true));
    this.consecutiveFailures = 0;
    this.failureSkipTimer = null;

    this.audio.addEventListener('playing', () => {
      this.showSpinner(false);
      this.consecutiveFailures = 0;
      if (this.failureSkipTimer) {
        clearTimeout(this.failureSkipTimer);
        this.failureSkipTimer = null;
      }
      this.initVisualizer();
    });
    this.audio.addEventListener('error', (e) => {
      console.warn('[Etsuko] Audio element error event:', e);
      this.showSpinner(false);
      this.handlePlaybackFailure();
    });

    window.addEventListener('etsuko:track-like-changed', (e) => {
      const { videoId, isLiked } = e.detail || {};
      if (this.currentTrack && this.currentTrack.videoId === videoId) {
        this.currentTrack.isLiked = isLiked;
        if (this.playerLikeBtn) {
          this.playerLikeBtn.classList.toggle('liked', !!isLiked);
          const svg = this.playerLikeBtn.querySelector('svg');
          if (svg) svg.setAttribute('fill', isLiked ? '#ec4899' : 'none');
        }
      }
    });
  }

  initVisualizer() {
    if (this.audioContext) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
      const source = this.audioContext.createMediaElementSource(this.audio);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      source.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);

      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
      this.drawVisualizer();
    } catch (e) {
      console.log('[Etsuko] Web Audio API visualizer skipped:', e);
    }
  }

  drawVisualizer() {
    requestAnimationFrame(() => this.drawVisualizer());
    if (!this.analyser || !this.isPlaying) {
      this.canvasCtx.clearRect(0, 0, this.canvasVisualizer.width, this.canvasVisualizer.height);
      return;
    }
    this.analyser.getByteFrequencyData(this.dataArray);
    this.canvasCtx.clearRect(0, 0, this.canvasVisualizer.width, this.canvasVisualizer.height);

    const barWidth = 3;
    const gap = 2;
    let x = 0;
    const barCount = 14;

    for (let i = 0; i < barCount; i++) {
      const value = this.dataArray[i * 2] || 0;
      const percent = value / 255;
      const barHeight = Math.max(2, percent * this.canvasVisualizer.height);
      const y = this.canvasVisualizer.height - barHeight;

      const grad = this.canvasCtx.createLinearGradient(0, y, 0, this.canvasVisualizer.height);
      grad.addColorStop(0, '#00f0ff');
      grad.addColorStop(1, '#8b5cf6');
      this.canvasCtx.fillStyle = grad;
      this.canvasCtx.fillRect(x, y, barWidth, barHeight);
      x += barWidth + gap;

    }
  }

  initMediaSession() {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => this.togglePlay());
      navigator.mediaSession.setActionHandler('pause', () => this.togglePlay());
      navigator.mediaSession.setActionHandler('previoustrack', () => this.prev());
      navigator.mediaSession.setActionHandler('nexttrack', () => this.next());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime && this.audio.duration) {
          this.audio.currentTime = details.seekTime;
        }
      });
    }
  }

  initListeners() {
    this.btnPlayPause.addEventListener('click', () => this.togglePlay());
    this.btnPrev.addEventListener('click', () => this.prev());
    this.btnNext.addEventListener('click', () => this.next());

    this.btnShuffle.addEventListener('click', () => {
      this.isShuffle = !this.isShuffle;
      this.btnShuffle.classList.toggle('active', this.isShuffle);
      this.btnShuffle.title = this.isShuffle ? 'Shuffle: On' : 'Shuffle: Off';
      if (window.showToast) {
        window.showToast(this.isShuffle ? '🔀 Shuffle On' : '➡️ Shuffle Off');
      }
    });

    this.btnRepeat.addEventListener('click', () => {
      this.repeatMode = (this.repeatMode + 1) % 3;
      if (this.repeatMode === 0) {
        this.btnRepeat.classList.remove('active');
        if (this.repeatBadge) this.repeatBadge.style.display = 'none';
        this.btnRepeat.title = 'Repeat: Off';
        if (window.showToast) window.showToast('➡️ Repeat Off');
      } else if (this.repeatMode === 1) {
        this.btnRepeat.classList.add('active');
        if (this.repeatBadge) this.repeatBadge.style.display = 'none';
        this.btnRepeat.title = 'Repeat: All';
        if (window.showToast) window.showToast('🔁 Repeat All');
      } else if (this.repeatMode === 2) {
        this.btnRepeat.classList.add('active');
        if (this.repeatBadge) this.repeatBadge.style.display = 'flex';
        this.btnRepeat.title = 'Repeat: One';
        if (window.showToast) window.showToast('🔂 Repeat One');
      }
    });

    // Timeline Scrubbing
    let isDraggingTimeline = false;
    const seek = (e) => {
      const rect = this.scrubberBar.getBoundingClientRect();
      const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const percentage = clickX / rect.width;
      if (this.audio.duration) {
        this.audio.currentTime = percentage * this.audio.duration;
      }
    };

    this.scrubberBar.addEventListener('mousedown', (e) => {
      isDraggingTimeline = true;
      seek(e);
    });
    window.addEventListener('mousemove', (e) => {
      if (isDraggingTimeline) seek(e);
    });
    window.addEventListener('mouseup', () => {
      isDraggingTimeline = false;
    });

    // Volume Scrubbing
    let isDraggingVol = false;
    const changeVolume = (e) => {
      const rect = this.volumeScrubber.getBoundingClientRect();
      const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const vol = Math.max(0, Math.min(1, clickX / rect.width));
      this.setVolume(vol);
    };

    this.volumeScrubber.addEventListener('mousedown', (e) => {
      isDraggingVol = true;
      changeVolume(e);
    });
    window.addEventListener('mousemove', (e) => {
      if (isDraggingVol) changeVolume(e);
    });
    window.addEventListener('mouseup', () => {
      isDraggingVol = false;
    });

    this.btnVolumeIcon.addEventListener('click', () => {
      if (this.isMuted) {
        this.isMuted = false;
        this.audio.volume = this.volume;
        this.updateVolumeUI(this.volume);
      } else {
        this.isMuted = true;
        this.audio.volume = 0;
        this.updateVolumeUI(0);
      }
    });

    // Like button toggle
    this.playerLikeBtn.addEventListener('click', async () => {
      if (!this.currentTrack) return;
      const isLiked = this.playerLikeBtn.classList.contains('liked') || !!this.currentTrack.isLiked;
      if (isLiked) {
        try {
          await fetch('/api/library/unlike', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoId: this.currentTrack.videoId })
          });
          this.currentTrack.isLiked = false;
          this.playerLikeBtn.classList.remove('liked');
          const svg = this.playerLikeBtn.querySelector('svg');
          if (svg) svg.setAttribute('fill', 'none');
          if (window.showToast) window.showToast('Removed from Liked Songs');
          window.dispatchEvent(new CustomEvent('etsuko:library-updated'));
          window.dispatchEvent(new CustomEvent('etsuko:track-like-changed', {
            detail: { videoId: this.currentTrack.videoId, isLiked: false }
          }));
        } catch (e) {
          console.error('Unlike failed:', e);
        }
      } else {
        try {
          const res = await fetch('/api/library/like', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.currentTrack)
          });
          const data = await res.json();
          this.currentTrack.isLiked = true;
          this.playerLikeBtn.classList.add('liked');
          const svg = this.playerLikeBtn.querySelector('svg');
          if (svg) svg.setAttribute('fill', '#ec4899');
          if (window.showToast) window.showToast('Added to Liked Songs');
          window.dispatchEvent(new CustomEvent('etsuko:library-updated'));
          window.dispatchEvent(new CustomEvent('etsuko:track-like-changed', {
            detail: { videoId: this.currentTrack.videoId, isLiked: true }
          }));
        } catch (e) {
          console.error('Like failed:', e);
        }
      }
    });

    // Player Add to Playlist button
    if (this.playerAddPlaylistBtn) {
      this.playerAddPlaylistBtn.addEventListener('click', () => {
        if (this.currentTrack && window.app && window.app.openAddToPlaylistModal) {
          window.app.openAddToPlaylistModal(this.currentTrack);
        }
      });
    }

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        this.togglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        this.audio.currentTime = Math.min(this.audio.duration || 0, this.audio.currentTime + 5);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        this.audio.currentTime = Math.max(0, this.audio.currentTime - 5);
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        this.setVolume(Math.min(1, this.volume + 0.05));
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        this.setVolume(Math.max(0, this.volume - 0.05));
      } else if (e.code === 'KeyM') {
        this.btnVolumeIcon.click();
      }
    });
  }

  setVolume(val) {
    this.volume = val;
    this.isMuted = false;
    this.audio.volume = val;
    localStorage.setItem('etsuko_volume', val);
    this.updateVolumeUI(val);
  }

  updateVolumeUI(val) {
    this.volumeProgress.style.width = `${val * 100}%`;
    if (val === 0 || this.isMuted) {
      this.iconVolHigh.style.display = 'none';
      this.iconVolMute.style.display = 'block';
    } else {
      this.iconVolHigh.style.display = 'block';
      this.iconVolMute.style.display = 'none';
    }
  }

  showSpinner(show) {
    this.coverSpinner.style.display = show ? 'block' : 'none';
  }

  async playTrack(track, queueList = null) {
    if (queueList) {
      this.queue = [...queueList];
      this.queueIndex = this.queue.findIndex(t => t.videoId === track.videoId);
      if (this.queueIndex === -1) {
        this.queue.unshift(track);
        this.queueIndex = 0;
      }
    } else if (this.queueIndex === -1 || (this.queue[this.queueIndex] && this.queue[this.queueIndex].videoId !== track.videoId)) {
      this.queue = [track];
      this.queueIndex = 0;
    }

    this.currentTrack = track;
    this.playerCover.src = track.thumbnail || 'assets/default_cover.png';
    this.playerCover.onerror = () => { this.playerCover.src = 'assets/default_cover.png'; };
    this.playerTitle.textContent = track.title || 'Unknown Title';
    this.playerArtist.textContent = track.artist || 'Unknown Artist';
    this.playerLikeBtn.classList.toggle('liked', !!track.isLiked);

    this.showSpinner(true);
    this.updateActiveTrackHighlight();

    // Update MediaSession
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: track.album || 'Etsuko Music',
        artwork: [
          { src: track.thumbnail, sizes: '512x512', type: 'image/jpeg' }
        ]
      });
    }

    // Record History
    fetch('/api/library/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(track)
    }).catch(() => {});

    // Stream audio via proxy stream (prevents 403 CDN & CORS errors)
    try {
      this.audio.src = `/api/proxy_stream/${encodeURIComponent(track.videoId)}`;
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      await this.audio.play();
      this.consecutiveFailures = 0;
      this.fetchAutoplayRadio(track.videoId);
      window.dispatchEvent(new CustomEvent('etsuko:track-started', { detail: track }));
    } catch (e) {
      console.warn('[Etsuko] Play interrupted or delayed, retrying...', e);
      try {
        await new Promise(r => setTimeout(r, 500));
        await this.audio.play();
        this.consecutiveFailures = 0;
        this.fetchAutoplayRadio(track.videoId);
        window.dispatchEvent(new CustomEvent('etsuko:track-started', { detail: track }));
      } catch (err2) {
        console.error('[Etsuko] Play failed completely:', err2);
        this.handlePlaybackFailure();
      }
    }
  }

  handlePlaybackFailure() {
    this.showSpinner(false);
    if (this.failureSkipTimer) {
      clearTimeout(this.failureSkipTimer);
      this.failureSkipTimer = null;
    }
    this.consecutiveFailures = (this.consecutiveFailures || 0) + 1;
    const title = this.currentTrack ? this.currentTrack.title : 'this track';

    if (this.consecutiveFailures >= 3) {
      if (window.showToast) {
        window.showToast('Multiple tracks failed to stream. Playback paused.');
      }
      this.consecutiveFailures = 0;
      this.isPlaying = false;
      this.updatePlayPauseUI(false);
      return;
    }

    if (window.showToast) {
      window.showToast(`Unable to stream "${title}". Skipping to next song...`);
    }
    this.failureSkipTimer = setTimeout(() => {
      if (this.queue && this.queue.length > 1) {
        this.next();
      }
    }, 1800);
  }

  async fetchAutoplayRadio(videoId) {
    try {
      const res = await fetch(`/api/radio/${videoId}`);
      const data = await res.json();
      if (data.tracks && data.tracks.length > 0) {
        this.autoplayTracks = data.tracks;
        window.dispatchEvent(new CustomEvent('etsuko:queue-updated'));
      }
    } catch (e) {
      console.log('[Etsuko] Autoplay radio error:', e);
    }
  }

  togglePlay() {
    if (!this.audio.src || !this.currentTrack) {
      if (this.queue.length > 0) {
        this.playTrack(this.queue[0]);
      }
      return;
    }
    if (this.audio.paused) {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      this.audio.play();
    } else {
      this.audio.pause();
    }
  }

  onPlayStateChange(playing) {
    this.isPlaying = playing;
    this.iconPlay.style.display = playing ? 'none' : 'block';
    this.iconPause.style.display = playing ? 'block' : 'none';
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
    }
  }

  next() {
    if (this.queue.length === 0) return;
    if (this.isShuffle) {
      const nextIdx = Math.floor(Math.random() * this.queue.length);
      this.queueIndex = nextIdx;
      this.playTrack(this.queue[this.queueIndex]);
      return;
    }

    if (this.queueIndex < this.queue.length - 1) {
      this.queueIndex++;
      this.playTrack(this.queue[this.queueIndex]);
    } else if (this.autoplayTracks.length > 0) {
      // Pull next track from autoplay radio
      const nextTrack = this.autoplayTracks.shift();
      this.queue.push(nextTrack);
      this.queueIndex = this.queue.length - 1;
      this.playTrack(nextTrack);
      window.dispatchEvent(new CustomEvent('etsuko:queue-updated'));
    } else if (this.repeatMode === 1) {
      this.queueIndex = 0;
      this.playTrack(this.queue[0]);
    }
  }

  prev() {
    if (this.audio.currentTime > 3) {
      this.audio.currentTime = 0;
      return;
    }
    if (this.queueIndex > 0) {
      this.queueIndex--;
      this.playTrack(this.queue[this.queueIndex]);
    } else {
      this.audio.currentTime = 0;
    }
  }

  onEnded() {
    if (this.repeatMode === 2) {
      this.audio.currentTime = 0;
      this.audio.play();
    } else {
      this.next();
    }
  }

  onTimeUpdate() {
    if (!this.audio.duration) return;
    const current = this.audio.currentTime;
    const duration = this.audio.duration;
    const percent = (current / duration) * 100;
    this.scrubberProgress.style.width = `${percent}%`;
    this.currentTimeLabel.textContent = this.formatTime(current);
    this.totalDurationLabel.textContent = this.formatTime(duration);

    window.dispatchEvent(new CustomEvent('etsuko:time-update', {
      detail: { currentTime: current, duration: duration }
    }));
  }

  onProgress() {
    if (this.audio.buffered.length > 0 && this.audio.duration) {
      const bufferedEnd = this.audio.buffered.end(this.audio.buffered.length - 1);
      const percent = (bufferedEnd / this.audio.duration) * 100;
      this.scrubberBuffered.style.width = `${percent}%`;
    }
  }

  formatTime(secs) {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  updateActiveTrackHighlight() {
    document.querySelectorAll('.track-row').forEach(row => {
      const vid = row.getAttribute('data-videoid');
      if (vid === this.currentTrack.videoId) {
        row.classList.add('playing');
      } else {
        row.classList.remove('playing');
      }
    });
  }
}

window.player = new EtsukoPlayer();
