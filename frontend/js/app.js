// Etsuko Audio Engine - Application Orchestrator & UI Controller

// Global Toast Notification Helper
window.showToast = function(message) {
  const toast = document.getElementById('app-toast');
  if (!toast) return;
  toast.textContent = message;
  toast.style.display = 'block';
  clearTimeout(window._toastTimeout);
  window._toastTimeout = setTimeout(() => {
    toast.style.display = 'none';
  }, 2200);
};

class EtsukoApp {
  constructor() {
    this.currentView = 'home';
    this.viewHistory = ['home'];
    this.historyIndex = 0;
    this.activeSearchFilter = 'songs';
    this.searchDebounceTimer = null;
    this.searchRequestId = 0;
    this.searchAbortController = null;
    this.lyricsData = null;
    this.syncedLyrics = [];
    this.activePlaylistId = null; // null if Liked Tracks or not in playlist view
    this.trackToAddToPlaylist = null;

    this.initDOM();
    this.bindEvents();
    this.startAppWithSplash().then(() => {
      setTimeout(() => this.checkForUpdates(false), 2500);
    });
  }

  initDOM() {
    this.viewHome = document.getElementById('view-home');
    this.viewSearch = document.getElementById('view-search');
    this.viewPlaylist = document.getElementById('view-playlist');
    this.viewLyrics = document.getElementById('view-lyrics');

    this.navItems = document.querySelectorAll('.nav-item');
    this.navBack = document.getElementById('nav-btn-back');
    this.navForward = document.getElementById('nav-btn-forward');

    this.greetingText = document.getElementById('greeting-text');
    this.greetingSubtext = document.getElementById('greeting-subtext');
    this.btnQuickFlow = document.getElementById('btn-quick-flow');
    this.btnSurpriseMe = document.getElementById('btn-surprise-me');

    // Auto-Update Elements
    this.updateBanner = document.getElementById('update-notification-bar');
    this.updateTitle = document.getElementById('update-banner-title');
    this.updateDesc = document.getElementById('update-banner-desc');
    this.btnUpdateNow = document.getElementById('btn-update-now');
    this.btnUpdateNowText = document.getElementById('btn-update-now-text');
    this.btnUpdateBrowser = document.getElementById('btn-update-browser');
    this.btnUpdateDismiss = document.getElementById('btn-update-dismiss');
    this.btnCheckUpdateManual = document.getElementById('btn-check-update-manual');
    this.latestUpdateData = null;
    this.updatePollTimer = null;
    this.modalUpdateProgress = document.getElementById('modal-update-progress');
    this.updateModalTitle = document.getElementById('update-modal-title');
    this.updateModalStatus = document.getElementById('update-modal-status');
    this.updateProgressFill = document.getElementById('update-progress-fill');
    this.updateStatPercent = document.getElementById('update-stat-percent');
    this.updateStatSize = document.getElementById('update-stat-size');
    this.updateStatSpeed = document.getElementById('update-stat-speed');
    this.btnCancelUpdate = document.getElementById('btn-cancel-update');
    this.quickVibesGrid = document.getElementById('quick-vibes-grid');
    this.artistsCards = document.getElementById('artists-cards');
    this.topbarWavePill = document.getElementById('topbar-wave-pill');
    this.homeTrending = [];

    this.trendingCards = document.getElementById('trending-cards');
    this.genreCards = document.getElementById('genre-cards');

    // Top Search & Main Search
    this.searchInput = document.getElementById('global-search-input');
    this.searchClearBtn = document.getElementById('search-clear-btn');
    this.searchMainInput = document.getElementById('search-main-input');
    this.searchMainClearBtn = document.getElementById('search-main-clear-btn');
    this.quickTagBtns = document.querySelectorAll('.quick-tag-btn');

    this.searchLoading = document.getElementById('search-loading');
    this.searchFilterPills = document.querySelectorAll('.filter-pill');
    this.topResultCol = document.getElementById('top-result-col');
    this.topResultCard = document.getElementById('top-result-card');
    this.searchTracksList = document.getElementById('search-tracks-list');
    this.searchResultsTitle = document.getElementById('search-results-title');

    // Playlist View
    this.playlistTracksList = document.getElementById('playlist-tracks-list');
    this.playlistHeaderTitle = document.getElementById('playlist-header-title');
    this.playlistHeaderDesc = document.getElementById('playlist-header-desc');
    this.playlistHeaderMeta = document.getElementById('playlist-header-meta');
    this.btnPlaylistPlayall = document.getElementById('btn-playlist-playall');
    this.btnClearPlaylist = document.getElementById('btn-clear-playlist');
    this.btnDeletePlaylist = document.getElementById('btn-delete-playlist');
    this.playlistFilterInput = document.getElementById('playlist-filter-input');
    this.currentPlaylistTracks = [];

    // Queue Drawer
    this.queueDrawer = document.getElementById('queue-drawer');
    this.btnQueueToggle = document.getElementById('btn-queue-toggle');
    this.btnCloseQueue = document.getElementById('btn-close-queue');
    this.queueNowPlaying = document.getElementById('queue-now-playing');
    this.queueList = document.getElementById('queue-list');
    this.queueAutoplayList = document.getElementById('queue-autoplay-list');
    this.btnClearQueue = document.getElementById('btn-clear-queue');
    this.queueCountBadge = document.getElementById('queue-count-badge');

    // Lyrics
    this.btnLyricsToggle = document.getElementById('btn-lyrics-toggle');
    this.lyricsTrackTitle = document.getElementById('lyrics-track-title');
    this.lyricsTrackArtist = document.getElementById('lyrics-track-artist');
    this.lyricsLines = document.getElementById('lyrics-lines');
    this.lyricsBackdrop = document.getElementById('lyrics-backdrop');

    // Create Playlist Modal
    this.modalNewPlaylist = document.getElementById('modal-new-playlist');
    this.btnNewPlaylist = document.getElementById('btn-new-playlist');
    this.btnModalCancel = document.getElementById('btn-modal-cancel');
    this.btnModalSave = document.getElementById('btn-modal-save');
    this.inputPlaylistName = document.getElementById('input-playlist-name');
    this.inputPlaylistDesc = document.getElementById('input-playlist-desc');
    this.libraryPlaylists = document.getElementById('library-playlists');
    this.likedCountBadge = document.getElementById('liked-count-badge');

    // Add to Playlist Modal
    this.modalAddToPlaylist = document.getElementById('modal-add-to-playlist');
    this.modalAddTrackTitle = document.getElementById('modal-add-track-title');
    this.modalPlaylistSelectList = document.getElementById('modal-playlist-select-list');
    this.btnModalAddCancel = document.getElementById('btn-modal-add-cancel');

    // User Profile
    this.btnProfileBadge = document.getElementById('btn-profile-badge');
    this.headerUserAvatar = document.getElementById('header-user-avatar');
    this.headerUserName = document.getElementById('header-user-name');
    this.modalProfile = document.getElementById('modal-profile');
    this.profileModalAvatarPreview = document.getElementById('profile-modal-avatar-preview');
    this.btnChoosePfpFile = document.getElementById('btn-choose-pfp-file');
    this.inputProfileFile = document.getElementById('input-profile-file');
    this.btnResetPfpDefault = document.getElementById('btn-reset-pfp-default');
    this.inputProfileName = document.getElementById('input-profile-name');
    this.inputProfileBio = document.getElementById('input-profile-bio');
    this.inputProfileAvatar = document.getElementById('input-profile-avatar');
    this.btnModalProfileCancel = document.getElementById('btn-modal-profile-cancel');
    this.btnModalProfileSave = document.getElementById('btn-modal-profile-save');

    // Splash Screen Elements
    this.splashScreen = document.getElementById('app-splash-screen');
    this.splashProgressFill = document.getElementById('splash-progress-fill');
    this.splashStatusText = document.getElementById('splash-status-text');

    this.updateGreeting();
  }

  async startAppWithSplash() {
    const fill = this.splashProgressFill;
    const status = this.splashStatusText;

    const setStatus = (txt) => {
      if (status) status.textContent = txt;
    };

    // Parallel background loading
    const loadPromise = Promise.all([
      this.loadProfile(),
      this.loadLibrary(),
      this.loadHomeFeed()
    ]);

    // Butter-smooth ~1.6s timeline driven by high-res timestamp
    const duration = 1600;
    const startTime = performance.now();
    let animFrame = null;

    return new Promise((resolve) => {
      const step = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);

        // easeOutCubic curve for natural, luxurious deceleration
        const ease = 1 - Math.pow(1 - progress, 3);
        const pct = ease * 100;

        if (fill) fill.style.width = `${pct.toFixed(1)}%`;

        if (progress < 0.35) {
          setStatus('INITIALIZING AUDIO MATRIX...');
        } else if (progress < 0.70) {
          setStatus('INDEXING AUDIO VAULT...');
        } else if (progress < 0.95) {
          setStatus('CALIBRATING FREQUENCIES...');
        } else {
          setStatus('SYSTEM READY');
        }

        if (progress < 1) {
          animFrame = requestAnimationFrame(step);
        } else {
          // Timeline complete (1.6s elapsed): ensure background data ready then fade out
          loadPromise.finally(() => {
            if (fill) fill.style.width = '100%';
            setStatus('SYSTEM READY');
            setTimeout(() => {
              if (this.splashScreen) {
                this.splashScreen.classList.add('fade-out');
                setTimeout(() => {
                  this.splashScreen.style.display = 'none';
                  resolve();
                }, 450);
              } else {
                resolve();
              }
            }, 180);
          });
        }
      };

      animFrame = requestAnimationFrame(step);
    });
  }

  updateGreeting() {
    const hour = new Date().getHours();
    if (this.greetingText) {
      if (hour >= 5 && hour < 12) {
        this.greetingText.textContent = 'Good morning';
        if (this.greetingSubtext) this.greetingSubtext.textContent = 'Start your day with clean soundscapes and global charts.';
      } else if (hour >= 12 && hour < 18) {
        this.greetingText.textContent = 'Good afternoon';
        if (this.greetingSubtext) this.greetingSubtext.textContent = 'Uninterrupted music flow tailored for focus and energy.';
      } else if (hour >= 18 && hour < 22) {
        this.greetingText.textContent = 'Good evening';
        if (this.greetingSubtext) this.greetingSubtext.textContent = 'Wind down with curated favorites and chill selections.';
      } else {
        this.greetingText.textContent = 'After Hours';
        if (this.greetingSubtext) this.greetingSubtext.textContent = 'Late night chill, synthwave drives, and deep basslines.';
      }
    }
  }

  bindEvents() {
    // Navigation
    this.navItems.forEach(item => {
      item.addEventListener('click', () => {
        const view = item.getAttribute('data-view');
        this.navigateTo(view);
      });
    });

    if (this.navBack) this.navBack.addEventListener('click', () => this.goBack());
    if (this.navForward) this.navForward.addEventListener('click', () => this.goForward());

    // Top Search Input Events
    this.searchInput.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      this.searchClearBtn.style.display = q ? 'block' : 'none';
      if (this.searchMainInput) {
        this.searchMainInput.value = e.target.value;
        if (this.searchMainClearBtn) this.searchMainClearBtn.style.display = q ? 'block' : 'none';
      }
      if (this.currentView !== 'search') {
        this.navigateTo('search', false);
      }
      clearTimeout(this.searchDebounceTimer);
      if (q.length >= 2) {
        this.searchDebounceTimer = setTimeout(() => this.performSearch(q), 400);
      }
    });

    this.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        clearTimeout(this.searchDebounceTimer);
        const q = this.searchInput.value.trim();
        if (this.currentView !== 'search') this.navigateTo('search', false);
        if (q) this.performSearch(q);
      }
    });

    this.searchClearBtn.addEventListener('click', () => {
      this.searchInput.value = '';
      if (this.searchMainInput) this.searchMainInput.value = '';
      this.searchClearBtn.style.display = 'none';
      if (this.searchMainClearBtn) this.searchMainClearBtn.style.display = 'none';
      clearTimeout(this.searchDebounceTimer);
      this.performSearch('Top 50 Global Hits');
    });

    // In-Page Main Search Input Events
    if (this.searchMainInput) {
      this.searchMainInput.addEventListener('input', (e) => {
        const q = e.target.value.trim();
        if (this.searchMainClearBtn) this.searchMainClearBtn.style.display = q ? 'block' : 'none';
        this.searchInput.value = e.target.value;
        this.searchClearBtn.style.display = q ? 'block' : 'none';
        clearTimeout(this.searchDebounceTimer);
        if (q.length >= 2) {
          this.searchDebounceTimer = setTimeout(() => this.performSearch(q), 400);
        }
      });

      this.searchMainInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          clearTimeout(this.searchDebounceTimer);
          const q = this.searchMainInput.value.trim();
          if (q) this.performSearch(q);
        }
      });
    }

    if (this.searchMainClearBtn) {
      this.searchMainClearBtn.addEventListener('click', () => {
        this.searchMainInput.value = '';
        this.searchInput.value = '';
        this.searchMainClearBtn.style.display = 'none';
        this.searchClearBtn.style.display = 'none';
        clearTimeout(this.searchDebounceTimer);
        this.performSearch('Top 50 Global Hits');
      });
    }

    // Quick Search Tag Pills
    this.quickTagBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const q = btn.getAttribute('data-query');
        this.searchInput.value = q;
        if (this.searchMainInput) this.searchMainInput.value = q;
        this.searchClearBtn.style.display = 'block';
        if (this.searchMainClearBtn) this.searchMainClearBtn.style.display = 'block';
        this.navigateTo('search');
        this.performSearch(q);
      });
    });

    // Search filter pills (Tracks, Albums, Artists)
    this.searchFilterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        this.searchFilterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.activeSearchFilter = pill.getAttribute('data-filter');
        const q = (this.searchMainInput ? this.searchMainInput.value : this.searchInput.value).trim() || 'Top 50 Global Hits';
        this.performSearch(q);
      });
    });

    // Queue drawer
    this.btnQueueToggle.addEventListener('click', () => {
      this.queueDrawer.classList.toggle('open');
      this.renderQueue();
    });
    this.btnCloseQueue.addEventListener('click', () => {
      this.queueDrawer.classList.remove('open');
    });
    this.btnClearQueue.addEventListener('click', () => {
      window.player.queue = window.player.currentTrack ? [window.player.currentTrack] : [];
      window.player.queueIndex = 0;
      this.renderQueue();
    });

    // Lyrics toggle
    this.btnLyricsToggle.addEventListener('click', () => {
      if (this.currentView === 'lyrics') {
        this.goBack();
      } else {
        this.navigateTo('lyrics');
        this.loadLyricsForCurrentTrack();
      }
    });

    // Playlist Creation Modal
    this.btnNewPlaylist.addEventListener('click', () => {
      this.modalNewPlaylist.style.display = 'flex';
      this.inputPlaylistName.focus();
    });
    this.btnModalCancel.addEventListener('click', () => {
      this.modalNewPlaylist.style.display = 'none';
    });
    this.btnModalSave.addEventListener('click', () => this.handleCreatePlaylist());

    // Playlist Deletion
    if (this.btnDeletePlaylist) {
      this.btnDeletePlaylist.addEventListener('click', () => this.handleDeleteActivePlaylist());
    }

    // Add To Playlist Modal Cancel
    if (this.btnModalAddCancel) {
      this.btnModalAddCancel.addEventListener('click', () => {
        this.modalAddToPlaylist.style.display = 'none';
      });
    }

    // Profile Modal
    if (this.btnProfileBadge) {
      this.btnProfileBadge.addEventListener('click', () => {
        this.modalProfile.style.display = 'flex';
        this.inputProfileName.focus();
      });
    }
    if (this.btnModalProfileCancel) {
      this.btnModalProfileCancel.addEventListener('click', () => {
        this.modalProfile.style.display = 'none';
      });
    }
    if (this.btnModalProfileSave) {
      this.btnModalProfileSave.addEventListener('click', () => this.handleSaveProfile());
    }

    // File Picker for Profile Avatar
    if (this.btnChoosePfpFile && this.inputProfileFile) {
      this.btnChoosePfpFile.addEventListener('click', () => {
        this.inputProfileFile.click();
      });

      this.inputProfileFile.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
          const rawUrl = evt.target.result;
          const img = new Image();
          img.onload = () => {
            // Downsample and center-crop to a clean 320x320 square avatar
            const canvas = document.createElement('canvas');
            const targetDim = 320;
            canvas.width = targetDim;
            canvas.height = targetDim;
            const ctx = canvas.getContext('2d');
            const minSide = Math.min(img.width, img.height);
            const sx = (img.width - minSide) / 2;
            const sy = (img.height - minSide) / 2;
            ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, targetDim, targetDim);
            const optimized = canvas.toDataURL('image/jpeg', 0.88);
            if (this.profileModalAvatarPreview) this.profileModalAvatarPreview.src = optimized;
            if (this.inputProfileAvatar) this.inputProfileAvatar.value = optimized;
            window.showToast?.('Image chosen from files!');
          };
          img.onerror = () => {
            if (this.profileModalAvatarPreview) this.profileModalAvatarPreview.src = rawUrl;
            if (this.inputProfileAvatar) this.inputProfileAvatar.value = rawUrl;
          };
          img.src = rawUrl;
        };
        reader.readAsDataURL(file);
      });
    }

    // Reset to Default Avatar Button
    if (this.btnResetPfpDefault) {
      this.btnResetPfpDefault.addEventListener('click', () => {
        const defaultAvatar = 'assets/default_user.png';
        if (this.profileModalAvatarPreview) this.profileModalAvatarPreview.src = defaultAvatar;
        if (this.inputProfileAvatar) this.inputProfileAvatar.value = '';
        if (this.inputProfileFile) this.inputProfileFile.value = '';
        window.showToast?.('Reset to default avatar');
      });
    }

    // Custom URL/path input
    if (this.inputProfileAvatar) {
      this.inputProfileAvatar.addEventListener('input', (e) => {
        const url = e.target.value.trim();
        if (url && this.profileModalAvatarPreview) {
          this.profileModalAvatarPreview.src = url;
        }
      });
    }

    // Hero Quick Actions
    if (this.btnQuickFlow) {
      this.btnQuickFlow.addEventListener('click', () => {
        if (this.homeTrending && this.homeTrending.length > 0) {
          window.player.playTrack(this.homeTrending[0], this.homeTrending);
          window.showToast?.(`Streaming #1 Hit: ${this.homeTrending[0].title}`);
        } else {
          this.performSearch('Top 50 Global Hits');
        }
      });
    }

    if (this.btnSurpriseMe) {
      this.btnSurpriseMe.addEventListener('click', () => {
        if (this.homeTrending && this.homeTrending.length > 0) {
          const randIdx = Math.floor(Math.random() * this.homeTrending.length);
          const track = this.homeTrending[randIdx];
          window.player.playTrack(track, this.homeTrending);
          window.showToast?.(`Surprise Banger: ${track.title}`);
        } else {
          this.performSearch('Phonk Cyberpunk Banger');
        }
      });
    }

    // Custom App Events
    window.addEventListener('etsuko:track-started', () => {
      this.renderQueue();
      if (this.topbarWavePill) this.topbarWavePill.classList.add('playing');
      if (this.currentView === 'lyrics') {
        this.loadLyricsForCurrentTrack();
      }
    });

    window.addEventListener('etsuko:queue-updated', () => this.renderQueue());
    window.addEventListener('etsuko:library-updated', () => this.loadLibrary());
    window.addEventListener('etsuko:track-like-changed', (e) => {
      const { videoId, isLiked } = e.detail || {};
      if (!videoId) return;

      const rows = document.querySelectorAll(`.track-row[data-videoid="${videoId}"]`);
      rows.forEach(r => {
        const likeBtn = r.querySelector('.btn-like');
        if (likeBtn) {
          likeBtn.classList.toggle('liked', !!isLiked);
          likeBtn.title = isLiked ? 'Remove from Liked Songs' : 'Save to Liked Songs';
          const svg = likeBtn.querySelector('svg');
          if (svg) svg.setAttribute('fill', isLiked ? '#ec4899' : 'none');
        }
      });

      if (this.queueNowPlaying) {
        const queueLike = this.queueNowPlaying.querySelector('.queue-now-like');
        if (queueLike && window.player.currentTrack && window.player.currentTrack.videoId === videoId) {
          queueLike.classList.toggle('liked', !!isLiked);
          const svg = queueLike.querySelector('svg');
          if (svg) svg.setAttribute('fill', isLiked ? '#ec4899' : 'none');
        }
      }

      this.loadLibrary();
    });

    window.addEventListener('etsuko:time-update', (e) => {
      if (this.currentView === 'lyrics' && this.syncedLyrics.length > 0) {
        this.updateSyncedLyricsProgress(e.detail.currentTime);
      }
    });

    // Auto-Update Events
    if (this.btnUpdateDismiss) {
      this.btnUpdateDismiss.addEventListener('click', () => {
        if (this.updateBanner) this.updateBanner.style.display = 'none';
      });
    }

    if (this.btnUpdateNow) {
      this.btnUpdateNow.addEventListener('click', () => this.installUpdate());
    }

    if (this.btnUpdateBrowser) {
      this.btnUpdateBrowser.addEventListener('click', () => {
        const url = this.latestUpdateData?.downloadUrl || 'https://github.com/khalilmalik0808/etsuko-music/releases';
        window.open(url, '_blank');
      });
    }

    if (this.btnCheckUpdateManual) {
      this.btnCheckUpdateManual.addEventListener('click', () => this.checkForUpdates(true));
    }

    if (this.btnCancelUpdate) {
      this.btnCancelUpdate.addEventListener('click', async () => {
        try {
          await fetch('/api/update/cancel', { method: 'POST' });
        } catch (e) {}
        clearInterval(this.updatePollTimer);
        if (this.modalUpdateProgress) this.modalUpdateProgress.style.display = 'none';
        if (this.btnUpdateNow) this.btnUpdateNow.disabled = false;
        if (this.btnUpdateNowText) this.btnUpdateNowText.textContent = 'Auto Update';
      });
    }
  }

  // --- Auto-Update Engine ---
  async checkForUpdates(manual = false) {
    try {
      if (manual && window.showToast) window.showToast('Checking for updates...');
      const res = await fetch('/api/update/check');
      const data = await res.json();

      const verLabel = document.getElementById('profile-version-label');
      if (verLabel && data.currentVersion) {
        verLabel.textContent = `Etsuko Studio v${data.currentVersion}`;
      }

      if (data.error) {
        if (manual && window.showToast) window.showToast(`Update check note: ${data.error}`);
        return;
      }

      if (data.updateAvailable) {
        this.latestUpdateData = data;
        if (this.updateBanner) {
          if (this.updateTitle) this.updateTitle.textContent = `UPDATE DETECTED // v${data.latestVersion}`;
          if (this.updateDesc) this.updateDesc.textContent = data.changelog || `Version ${data.latestVersion} is ready to install!`;
          this.updateBanner.style.display = 'flex';
        }
        if (manual && window.showToast) window.showToast(`Update v${data.latestVersion} available!`);
      } else if (manual) {
        if (window.showToast) window.showToast(`You're running the latest version! (v${data.currentVersion || '69.2'})`);
      }
    } catch (e) {
      if (manual && window.showToast) window.showToast('Could not reach update server');
    }
  }

  async installUpdate() {
    if (!this.latestUpdateData || !this.latestUpdateData.downloadUrl) return;

    // Close any other open modals so update progress has total focus
    const modalProfile = document.getElementById('modal-profile');
    if (modalProfile) modalProfile.style.display = 'none';

    // Open Progress Modal
    if (this.modalUpdateProgress) {
      this.modalUpdateProgress.style.display = 'flex';
      if (this.updateModalTitle) this.updateModalTitle.textContent = `DOWNLOADING UPDATE // v${this.latestUpdateData.latestVersion || '69.4'}`;
      if (this.updateModalStatus) this.updateModalStatus.textContent = 'Connecting to download cluster...';
      if (this.updateProgressFill) this.updateProgressFill.style.width = '0%';
      if (this.updateStatPercent) this.updateStatPercent.textContent = '0.0%';
      if (this.updateStatSize) this.updateStatSize.textContent = '0.0 / 24.2 MB';
      if (this.updateStatSpeed) this.updateStatSpeed.textContent = '0.0 MB/s';
      if (this.btnCancelUpdate) this.btnCancelUpdate.style.display = 'inline-block';
    }

    if (this.btnUpdateNow) this.btnUpdateNow.disabled = true;

    try {
      const res = await fetch('/api/update/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ downloadUrl: this.latestUpdateData.downloadUrl })
      });
      const data = await res.json();
      if (!data.success) {
        if (window.showToast) window.showToast('Update start failed: ' + (data.error || 'Unknown error'));
        if (this.modalUpdateProgress) this.modalUpdateProgress.style.display = 'none';
        if (this.btnUpdateNow) this.btnUpdateNow.disabled = false;
        return;
      }

      // Poll progress every 200ms
      clearInterval(this.updatePollTimer);
      this.updatePollTimer = setInterval(async () => {
        try {
          const sRes = await fetch('/api/update/status');
          const status = await sRes.json();
          
          if (status.status === 'downloading') {
            const pct = Math.min(100, Math.max(0, status.percent || 0));
            const dlMb = ((status.downloaded_bytes || 0) / (1024 * 1024)).toFixed(1);
            const totMb = status.total_bytes > 0 ? (status.total_bytes / (1024 * 1024)).toFixed(1) : '24.2';
            const speed = (status.speed_mbps || 0).toFixed(1);

            if (this.updateProgressFill) this.updateProgressFill.style.width = `${pct}%`;
            if (this.updateStatPercent) this.updateStatPercent.textContent = `${pct.toFixed(1)}%`;
            if (this.updateStatSize) this.updateStatSize.textContent = `${dlMb} / ${totMb} MB`;
            if (this.updateStatSpeed) this.updateStatSpeed.textContent = `${speed} MB/s`;
            if (this.updateModalStatus) this.updateModalStatus.textContent = `Streaming payload chunks (${pct.toFixed(0)}%)...`;
          } else if (status.status === 'installing') {
            clearInterval(this.updatePollTimer);
            if (this.updateProgressFill) this.updateProgressFill.style.width = '100%';
            if (this.updateStatPercent) this.updateStatPercent.textContent = '100%';
            if (this.updateModalStatus) this.updateModalStatus.textContent = 'LAUNCHING INSTALLER & RESTARTING ETSUKO NOW...';
            if (this.btnCancelUpdate) this.btnCancelUpdate.style.display = 'none';
          } else if (status.status === 'error') {
            clearInterval(this.updatePollTimer);
            if (window.showToast) window.showToast('Update error: ' + (status.error || 'Failed'));
            if (this.modalUpdateProgress) this.modalUpdateProgress.style.display = 'none';
            if (this.btnUpdateNow) this.btnUpdateNow.disabled = false;
          }
        } catch (err) {
          // If server connection is severed, the app is shutting down to boot the installer
          if (this.updateModalStatus) this.updateModalStatus.textContent = 'INSTALLING UPDATE & REBOOTING...';
        }
      }, 200);

    } catch (e) {
      if (window.showToast) window.showToast('Update failed: ' + e.message);
      if (this.modalUpdateProgress) this.modalUpdateProgress.style.display = 'none';
      if (this.btnUpdateNow) this.btnUpdateNow.disabled = false;
    }
  }

  // --- Profile Management ---
  async loadProfile() {
    try {
      const res = await fetch('/api/profile');
      const data = await res.json();
      if (data.profile) {
        const p = data.profile;
        const name = p.name ? p.name.trim() : '';
        const avatar = (p.avatar && p.avatar !== 'assets/logo.png') ? p.avatar : 'assets/default_user.png';
        if (this.headerUserName) {
          this.headerUserName.textContent = name;
          this.headerUserName.style.display = name ? 'inline' : 'none';
        }
        if (this.headerUserAvatar) this.headerUserAvatar.src = avatar;
        if (this.inputProfileName) this.inputProfileName.value = name;
        if (this.inputProfileBio) this.inputProfileBio.value = p.bio || '';
        if (this.inputProfileAvatar) this.inputProfileAvatar.value = (avatar === 'assets/default_user.png' ? '' : avatar);
        if (this.profileModalAvatarPreview) this.profileModalAvatarPreview.src = avatar;
      }
    } catch (e) {
      console.warn('[Etsuko] Failed to load user profile:', e);
    }
  }

  async handleSaveProfile() {
    const name = this.inputProfileName.value.trim();
    const bio = this.inputProfileBio.value.trim();
    let avatar = this.inputProfileAvatar.value.trim();
    if (!avatar || avatar === 'assets/logo.png') {
      avatar = 'assets/default_user.png';
    }

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, bio, avatar })
      });
      const data = await res.json();
      if (data.success) {
        if (this.headerUserName) {
          this.headerUserName.textContent = name;
          this.headerUserName.style.display = name ? 'inline' : 'none';
        }
        if (this.headerUserAvatar) this.headerUserAvatar.src = avatar;
        this.modalProfile.style.display = 'none';
        window.showToast?.('Profile updated!');
      } else {
        window.showToast?.('Error saving profile');
      }
    } catch (e) {
      console.error('[Etsuko] Failed to save profile:', e);
      window.showToast?.('Error saving profile');
    }
  }

  // --- Navigation ---
  navigateTo(view, addToHistory = true) {
    this.currentView = view;

    document.querySelectorAll('.page-view').forEach(v => {
      v.classList.remove('active');
      v.style.display = 'none';
    });
    this.navItems.forEach(n => n.classList.remove('active'));

    const navMatch = document.querySelector(`.nav-item[data-view="${view}"]`);
    if (navMatch) navMatch.classList.add('active');

    const target = document.getElementById(`view-${view}`);
    if (target) {
      target.classList.add('active');
      target.style.display = 'block';
    }

    if (view === 'search') {
      const q = (this.searchMainInput ? this.searchMainInput.value : this.searchInput.value).trim();
      if (!q && this.searchTracksList.children.length === 0) {
        this.performSearch('Top 50 Global Hits');
      }
    }

    if (addToHistory) {
      this.viewHistory = this.viewHistory.slice(0, this.historyIndex + 1);
      this.viewHistory.push(view);
      this.historyIndex = this.viewHistory.length - 1;
    }
  }

  goBack() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.navigateTo(this.viewHistory[this.historyIndex], false);
    }
  }

  goForward() {
    if (this.historyIndex < this.viewHistory.length - 1) {
      this.historyIndex++;
      this.navigateTo(this.viewHistory[this.historyIndex], false);
    }
  }

  // --- Home Feed ---
  async loadHomeFeed() {
    try {
      const res = await fetch('/api/home');
      const data = await res.json();

      this.homeTrending = data.trending || [];

      // Render Quick Vibes Matrix
      this.renderQuickVibes();

      // Render Trending Cards with Chart Rank Badges
      this.trendingCards.innerHTML = '';
      this.homeTrending.forEach((track, idx) => {
        const rank = idx + 1;
        let rankClass = 'rank-default';
        if (rank === 1) rankClass = 'rank-1';
        else if (rank === 2) rankClass = 'rank-2';
        else if (rank === 3) rankClass = 'rank-3';

        const isYt = track.thumbnail && (track.thumbnail.includes('i.ytimg.com') || track.thumbnail.includes('hqdefault'));
        const card = document.createElement('div');
        card.className = 'music-card';
        card.innerHTML = `
          <div class="card-img-wrapper">
            <span class="card-rank-badge ${rankClass}">#${rank}</span>
            <img src="${track.thumbnail}" alt="${track.title}" class="${isYt ? 'yt-video-thumb' : ''}" onerror="this.onerror=null; this.src='assets/default_cover.png';" onload="if(this.naturalWidth<=120&&this.naturalHeight<=90){this.src='assets/default_cover.png';}" loading="lazy">
            <button class="card-play-btn" title="Play">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>
            </button>
          </div>
          <div class="card-title">${track.title}</div>
          <div class="card-desc">${track.artist}</div>
        `;
        card.addEventListener('click', () => {
          window.player.playTrack(track, this.homeTrending);
        });
        this.trendingCards.appendChild(card);
      });

      // Render Featured Top Artists Section
      this.renderTopArtists();

      // Render Category Tiles (Spotify / Apple Music Browse Architecture)
      this.genreCards.innerHTML = '';
      (data.categories || []).forEach(cat => {
        const card = document.createElement('div');
        card.className = 'genre-card';
        const colorStart = cat.color || '#8b5cf6';
        const colorEnd = cat.colorEnd || '#2a0845';
        card.style.background = `linear-gradient(135deg, ${colorStart} 0%, ${colorEnd} 100%)`;
        
        const imgSrc = cat.image || `assets/genres/${cat.id}.jpg`;
        const subText = cat.sub || 'Curated Sound';

        card.innerHTML = `
          <div class="genre-card-content">
            <span class="genre-name">${cat.name}</span>
            <span class="genre-sub">${subText}</span>
          </div>
          <div class="genre-cover-wrap">
            <img src="${imgSrc}" alt="${cat.name}" class="genre-cover-img" onerror="this.onerror=null; this.src='assets/default_cover.png';" loading="lazy">
          </div>
        `;
        card.addEventListener('click', () => {
          this.searchInput.value = cat.query;
          if (this.searchMainInput) this.searchMainInput.value = cat.query;
          this.searchClearBtn.style.display = 'block';
          if (this.searchMainClearBtn) this.searchMainClearBtn.style.display = 'block';
          this.navigateTo('search');
          this.performSearch(cat.query);
        });
        this.genreCards.appendChild(card);
      });
    } catch (e) {
      console.error('[Etsuko] Failed to load home feed:', e);
    }
  }

  // --- Quick Vibes Grid ---
  renderQuickVibes() {
    if (!this.quickVibesGrid) return;
    const vibes = [
      {
        id: 'phonk',
        title: 'Phonk & Drift',
        tag: 'NIGHT BASS',
        query: 'Drift Phonk Heavy Bass',
        bg: '#8b5cf6',
        svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`
      },
      {
        id: 'night',
        title: 'Late Night Drive',
        tag: 'SYNTH & RETRO',
        query: 'Late Night Synthwave Drive',
        bg: '#00f0ff',
        svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 3c-.1.2-.1.4-.1.6v4.5c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><path d="M9 17h6"></path><circle cx="17" cy="17" r="2"></circle></svg>`
      },
      {
        id: 'anime',
        title: 'Lo-Fi Beats',
        tag: 'CHILL & STUDY',
        query: 'Anime Lo-Fi Chill Beats',
        bg: '#ec4899',
        svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="3"></rect><circle cx="8" cy="12" r="3"></circle><circle cx="16" cy="12" r="3"></circle><path d="M8 12h8"></path><path d="M6 18h12"></path></svg>`
      },
      {
        id: 'top50',
        title: "Today's Top 50",
        tag: 'GLOBAL HITS',
        query: 'Top 50 Global Hits',
        bg: '#f59e0b',
        svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"></path><path d="M5 20h14"></path></svg>`
      },
      {
        id: 'coding',
        title: 'Deep Focus',
        tag: 'FLOW & AMBIENT',
        query: 'Coding Synthwave Cyberpunk Beats',
        bg: '#10b981',
        svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>`
      },
      {
        id: 'rock',
        title: 'Rock & Metal',
        tag: 'HEAVY RIFFS',
        query: 'Hard Rock Metal Classics',
        bg: '#ef4444',
        svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 5 2 2-7.5 7.5c-.8.8-2 .9-2.9.2l-.8.8c.2.9.1 2.1-.7 2.9l-2.5 2.5a2.8 2.8 0 0 1-4-4l2.5-2.5c.8-.8 2-.9 2.9-.1l.8-.8c-.7-.9-.6-2.1.2-2.9L16.5 3"></path><circle cx="6.5" cy="17.5" r="1"></circle></svg>`
      }
    ];

    this.quickVibesGrid.innerHTML = '';
    vibes.forEach(v => {
      const tile = document.createElement('div');
      tile.className = 'vibe-tile';
      tile.style.setProperty('--tile-accent', v.bg);
      tile.style.setProperty('--tile-glow', `${v.bg}33`);
      tile.innerHTML = `
        <div class="vibe-tile-icon" style="background: ${v.bg}18; color: ${v.bg}; border: 1px solid ${v.bg}44; box-shadow: 0 0 12px ${v.bg}22;">
          ${v.svg}
        </div>
        <div class="vibe-tile-info">
          <div class="vibe-tile-title">${v.title}</div>
          <div class="vibe-tile-sub">${v.tag}</div>
        </div>
        <button class="vibe-tile-play" title="Play ${v.title}">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>
        </button>
      `;
      tile.addEventListener('click', () => {
        this.searchInput.value = v.query;
        if (this.searchMainInput) this.searchMainInput.value = v.query;
        this.searchClearBtn.style.display = 'block';
        if (this.searchMainClearBtn) this.searchMainClearBtn.style.display = 'block';
        this.navigateTo('search');
        this.performSearch(v.query);
      });
      this.quickVibesGrid.appendChild(tile);
    });
  }

  // --- Top Artists Spotlight ---
  renderTopArtists() {
    if (!this.artistsCards) return;
    const artists = [
      { name: 'The Weeknd', role: 'R&B / Synthwave', img: 'https://yt3.googleusercontent.com/dcxXIIlest09vnvKznWM9VWQXu1EL7lKxBzXGzwgmVjmMNBm1dEWT_0qn1xrEZYyKF_qRE1TLq8P_JY_mQ=w544-h544-l90-rj' },
      { name: 'Eminem', role: 'Hip-Hop Legend', img: 'https://yt3.googleusercontent.com/Xx3dX1EJDirqwpfQL05uAgmKGYpzTcFDXjjHqjNpIhgY5MWTJRLSlOjaYVtup2Ku6gBYEqXoxw5aGKC3=w544-h544-l90-rj' },
      { name: 'Billie Eilish', role: 'Alternative Pop', img: 'https://yt3.googleusercontent.com/mXJjWX4E6Gpr03CUYl18PdVXlczmoL2Tm-LEBGafIr_8smlHnl8AHniJu0_7Y80e-aeloJxcryQQx0ZJ=w544-h544-l90-rj' },
      { name: 'Sabrina Carpenter', role: 'Pop Sensation', img: 'https://yt3.googleusercontent.com/bTWlZSenrOAYgH4r6NAzyDraWQR_wLl3OuRexJ_8h3NZUVHEilRSzUmKNa9YMOFSVcF0YtOuzKdXrt2UHg=w544-h544-l90-rj' },
      { name: 'Kendrick Lamar', role: 'West Coast Rap', img: 'https://yt3.googleusercontent.com/8qk3C_zpd2FXHVN8BpMBFL6h9J5BlKlbcKOlvDMvIgBWBsAblDoTjU98RGbFH9DxtnN1X5zRzc9sSvWr=w544-h544-l90-rj' },
      { name: 'SZA', role: 'Contemporary R&B', img: 'https://yt3.googleusercontent.com/tw5VGXEsehs9OpwnpbubqGp_3Pq9so7QShdyJSlCpXeI2mLRvqRqLNbA7EC4zcNWrFE0_lj9HxpZ23v6=w544-h544-l90-rj' },
      { name: 'Drake', role: 'OVO Sound', img: 'https://yt3.googleusercontent.com/9Oe4acEXgmAlCKgcgI6JlSXi2Tj30u6anzvfGBrunGO-fLhBTgzy-ei1ugPJpZDD5ArKFod9H4RTA5g0=w544-h544-l90-rj' },
      { name: 'Travis Scott', role: 'Psychedelic Trap', img: 'https://yt3.googleusercontent.com/eBvJuWpjg0Mx8DBa5WIhCzEopXyMnxkjWSU895BDGjTpNeqrliLrv3zGqNNuCUoXL1EkEAr5VQ3cx2pW=w544-h544-l90-rj' }
    ];

    this.artistsCards.innerHTML = '';
    artists.forEach(a => {
      const card = document.createElement('div');
      card.className = 'artist-circle-card';
      card.innerHTML = `
        <div class="artist-avatar-box">
          <img src="${a.img}" alt="${a.name}" onerror="this.src='assets/default_cover.png';" loading="lazy">
        </div>
        <div class="artist-card-name">${a.name}</div>
        <div class="artist-card-role">${a.role}</div>
      `;
      card.addEventListener('click', () => {
        this.searchInput.value = a.name;
        if (this.searchMainInput) this.searchMainInput.value = a.name;
        this.searchClearBtn.style.display = 'block';
        if (this.searchMainClearBtn) this.searchMainClearBtn.style.display = 'block';
        this.navigateTo('search');
        this.performSearch(a.name);
      });
      this.artistsCards.appendChild(card);
    });
  }

  // --- Search Engine ---
  async performSearch(query) {
    if (!query) return;

    // Abort previous pending search if any
    if (this.searchAbortController) {
      this.searchAbortController.abort();
    }
    this.searchAbortController = new AbortController();
    const { signal } = this.searchAbortController;

    const currentReqId = ++this.searchRequestId;

    this.searchLoading.style.display = 'flex';
    this.searchTracksList.innerHTML = '';
    this.topResultCol.style.display = 'none';
    if (this.searchResultsTitle) {
      const typeLabel = this.activeSearchFilter === 'albums' ? 'Albums' : (this.activeSearchFilter === 'artists' ? 'Artists' : 'Tracks');
      this.searchResultsTitle.textContent = `${typeLabel} for "${query}"`;
    }

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&filter=${this.activeSearchFilter}`, { signal });
      const data = await res.json();

      // Guard: Discard stale response if a newer search was initiated
      if (currentReqId !== this.searchRequestId) {
        return;
      }

      this.searchLoading.style.display = 'none';

      const results = data.results || [];
      if (results.length === 0) {
        this.searchTracksList.innerHTML = `
          <div style="color:var(--text-sub); padding: 32px 16px; text-align:center;">
            <p style="font-size:16px; font-weight:600; color:#fff; margin-bottom:6px;">No ${this.activeSearchFilter} found for "${query}"</p>
            <p style="font-size:13px;">Try switching tabs (Tracks / Albums / Artists) or searching for a different name.</p>
          </div>
        `;
        return;
      }

      // 1. ALBUMS TAB
      if (this.activeSearchFilter === 'albums') {
        this.topResultCol.style.display = 'none';
        const grid = document.createElement('div');
        grid.className = 'albums-grid';
        results.forEach(album => {
          const card = document.createElement('div');
          card.className = 'album-search-card';
          card.innerHTML = `
            <div class="album-card-cover-wrapper">
              <img class="album-card-cover" src="${album.thumbnail}" alt="${album.title}" onerror="this.onerror=null; this.src='assets/default_cover.png';" loading="lazy">
              <button class="album-card-play-overlay" title="Play Album">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><polygon points="7 4 19 12 7 20 7 4"></polygon></svg>
              </button>
            </div>
            <div class="album-card-info">
              <div class="album-card-title" title="${album.title}">${album.title}</div>
              <div class="album-card-artist" title="${album.artist}">${album.artist}</div>
              <div class="album-card-meta">
                <span>Album</span>
                ${album.year ? `<span>•</span><span>${album.year}</span>` : ''}
              </div>
            </div>
          `;

          // Quick Play overlay
          const playBtn = card.querySelector('.album-card-play-overlay');
          if (playBtn) {
            playBtn.addEventListener('click', async (e) => {
              e.stopPropagation();
              try {
                window.showToast(`Loading album "${album.title}"...`);
                const aRes = await fetch(`/api/album/${encodeURIComponent(album.browseId)}`);
                const aData = await aRes.json();
                if (aData.tracks && aData.tracks.length > 0) {
                  window.player.playTrack(aData.tracks[0], aData.tracks);
                } else {
                  window.showToast('No playable tracks found in album');
                }
              } catch (err) {
                console.error('Play album error:', err);
                window.showToast('Unable to stream album tracks');
              }
            });
          }

          // Card Click: Open Full Album in Playlist View
          card.addEventListener('click', async () => {
            try {
              window.showToast(`Loading "${album.title}"...`);
              const aRes = await fetch(`/api/album/${encodeURIComponent(album.browseId)}`);
              const aData = await aRes.json();
              if (aData.tracks) {
                this.openPlaylistView(null, aData.title, aData.artist, aData.tracks, aData.thumbnail, 'ALBUM');
              }
            } catch (err) {
              console.error('Open album error:', err);
              window.showToast('Unable to open album');
            }
          });

          grid.appendChild(card);
        });
        this.searchTracksList.appendChild(grid);
        return;
      }

      // 2. ARTISTS TAB
      if (this.activeSearchFilter === 'artists') {
        this.topResultCol.style.display = 'none';
        const grid = document.createElement('div');
        grid.className = 'artists-carousel';
        grid.style.flexWrap = 'wrap';
        grid.style.justifyContent = 'flex-start';
        results.forEach(a => {
          const card = document.createElement('div');
          card.className = 'artist-spotlight-card';
          card.innerHTML = `
            <img class="artist-spotlight-img" src="${a.thumbnail}" alt="${a.name}" onerror="this.onerror=null; this.src='assets/default_cover.png';" loading="lazy">
            <div class="artist-spotlight-name" title="${a.name}">${a.name}</div>
            <div class="artist-spotlight-role">Artist</div>
          `;
          card.addEventListener('click', () => {
            this.searchInput.value = a.name;
            if (this.searchMainInput) this.searchMainInput.value = a.name;
            this.activeSearchFilter = 'songs';
            this.searchFilterPills.forEach(p => p.classList.toggle('active', p.getAttribute('data-filter') === 'songs'));
            this.performSearch(a.name);
          });
          grid.appendChild(card);
        });
        this.searchTracksList.appendChild(grid);
        return;
      }

      // 3. TRACKS TAB (Default songs result)
      const top = results[0];
      this.topResultCol.style.display = 'block';
      this.topResultCard.innerHTML = `
        <img src="${top.thumbnail}" alt="${top.title}" onerror="this.onerror=null; this.src='assets/default_cover.png';" onload="if(this.naturalWidth<=120&&this.naturalHeight<=90){this.src='assets/default_cover.png';}">
        <div class="top-result-title">${top.title}</div>
        <div class="top-result-meta">${top.artist} • ${top.album || 'Track'}</div>
        <div class="top-result-type">Track</div>
      `;
      this.topResultCard.onclick = () => window.player.playTrack(top, results);

      results.forEach((track, idx) => {
        const row = this.createTrackRow(track, idx + 1, results, false, null);
        this.searchTracksList.appendChild(row);
      });
    } catch (e) {
      if (e.name === 'AbortError') return;
      if (currentReqId !== this.searchRequestId) return;
      this.searchLoading.style.display = 'none';
      console.error('[Etsuko] Search error:', e);
      this.searchTracksList.innerHTML = `
        <div style="color:var(--text-sub); padding: 32px 16px; text-align:center;">
          <p style="font-size:15px; color:#fff;">Connection error while searching. Please try again.</p>
        </div>
      `;
    }
  }

  // --- Track Row Component ---
  createTrackRow(track, index, listContext, isPlaylistView = false, playlistId = null) {
    const row = document.createElement('div');
    row.className = 'track-row';
    row.setAttribute('data-videoid', track.videoId);
    if (window.player.currentTrack && window.player.currentTrack.videoId === track.videoId) {
      row.classList.add('playing');
    }

    const isLiked = !!track.isLiked;

    row.innerHTML = `
      <div class="track-row-num">
        <span class="row-index">${index}</span>
        <svg class="row-play-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>
      </div>
      <div class="track-row-main">
        <img class="track-row-img" src="${track.thumbnail}" alt="${track.title}" onerror="this.onerror=null; this.src='assets/default_cover.png';" onload="if(this.naturalWidth<=120&&this.naturalHeight<=90){this.src='assets/default_cover.png';}" loading="lazy">
        <div class="track-row-text">
          <div class="track-row-title">${track.title}</div>
          <div class="track-row-artist">${track.artist}</div>
        </div>
      </div>
      <div class="track-row-album">${track.album || ''}</div>
      <div class="track-row-actions">
        <button class="btn-like ${isLiked ? 'liked' : ''}" title="${isLiked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="${isLiked ? '#ec4899' : 'none'}" stroke="currentColor" stroke-width="2">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>
        <button class="btn-track-action btn-add-playlist btn-add-crate" title="Add to Playlist">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </button>
        ${(isPlaylistView && playlistId) ? `
          <button class="btn-track-action btn-delete-row" title="Remove from Playlist">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        ` : ''}
      </div>
      <div class="track-row-dur">${track.duration || '3:30'}</div>
    `;

    // Click handler for entire row or action buttons
    row.addEventListener('click', async (e) => {
      // 1. Add to Playlist
      if (e.target.closest('.btn-add-playlist, .btn-add-crate')) {
        e.stopPropagation();
        this.openAddToPlaylistModal(track);
        return;
      }

      // 2. Remove from Custom Playlist
      if (e.target.closest('.btn-delete-row')) {
        e.stopPropagation();
        if (playlistId) {
          try {
            await fetch(`/api/library/playlist/${playlistId}/track/${track.videoId}`, { method: 'DELETE' });
            row.remove();
            window.showToast('Removed from Playlist');
            const remaining = this.playlistTracksList.querySelectorAll('.track-row').length;
            this.playlistHeaderMeta.textContent = `${remaining} tracks`;
            this.loadLibrary();
          } catch (err) {
            console.error('Failed to remove track:', err);
          }
        }
        return;
      }

      // 3. Like / Unlike Button
      if (e.target.closest('.btn-like')) {
        e.stopPropagation();
        await this.toggleTrackLike(track, row, isPlaylistView && !playlistId);
        return;
      }

      // 4. Default: Play Track
      window.player.playTrack(track, listContext);
    });

    return row;
  }

  async toggleTrackLike(track, row, isLikedView = false) {
    const likeBtn = row.querySelector('.btn-like');
    const currentlyLiked = likeBtn.classList.contains('liked') || !!track.isLiked;

    if (currentlyLiked) {
      // UNLIKE
      try {
        await fetch('/api/library/unlike', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoId: track.videoId })
        });
        track.isLiked = false;
        likeBtn.classList.remove('liked');
        likeBtn.title = 'Save to Liked Songs';
        likeBtn.querySelector('svg').setAttribute('fill', 'none');
        window.showToast('Removed from Liked Songs');

        if (window.player.currentTrack && window.player.currentTrack.videoId === track.videoId) {
          window.player.playerLikeBtn.classList.remove('liked');
          window.player.currentTrack.isLiked = false;
        }

        window.dispatchEvent(new CustomEvent('etsuko:track-like-changed', {
          detail: { videoId: track.videoId, isLiked: false }
        }));

        if (isLikedView) {
          row.remove();
          const remaining = this.playlistTracksList.querySelectorAll('.track-row').length;
          this.playlistHeaderMeta.textContent = `${remaining} tracks`;
          if (this.likedCountBadge) this.likedCountBadge.textContent = `${remaining} tracks saved`;
        }
        this.loadLibrary();
      } catch (e) {
        console.error('Unlike failed:', e);
      }
    } else {
      // LIKE
      try {
        const res = await fetch('/api/library/like', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(track)
        });
        const data = await res.json();
        track.isLiked = true;
        likeBtn.classList.add('liked');
        likeBtn.title = 'Remove from Liked Songs';
        likeBtn.querySelector('svg').setAttribute('fill', '#ec4899');
        window.showToast('Added to Liked Songs');

        if (window.player.currentTrack && window.player.currentTrack.videoId === track.videoId) {
          window.player.playerLikeBtn.classList.add('liked');
          window.player.currentTrack.isLiked = true;
        }

        window.dispatchEvent(new CustomEvent('etsuko:track-like-changed', {
          detail: { videoId: track.videoId, isLiked: true }
        }));

        this.loadLibrary();
      } catch (e) {
        console.error('Like failed:', e);
      }
    }
  }

  // --- Add To Playlist Modal ---
  async openAddToPlaylistModal(track) {
    this.trackToAddToPlaylist = track;
    this.modalAddTrackTitle.textContent = track.title || 'Track';
    this.modalPlaylistSelectList.innerHTML = '<p style="color:var(--text-sub); font-size:13px;">Loading playlists...</p>';
    this.modalAddToPlaylist.style.display = 'flex';

    try {
      const res = await fetch('/api/library/playlists');
      const data = await res.json();
      const playlists = data.playlists || [];

      if (playlists.length === 0) {
        this.modalPlaylistSelectList.innerHTML = `
          <div style="padding:16px; text-align:center; color:var(--text-sub); font-size:13px;">
            <p>No playlists found.</p>
            <p style="margin-top:6px; color:var(--accent-cyan);">Create a playlist first using "+ New Playlist" in sidebar!</p>
          </div>
        `;
        return;
      }

      this.modalPlaylistSelectList.innerHTML = '';
      playlists.forEach(pl => {
        const item = document.createElement('div');
        item.className = 'playlist-select-item';
        item.innerHTML = `
          <div>
            <div style="font-weight:700; color:#fff; font-size:14px;">${pl.name}</div>
            <div style="font-size:12px; color:var(--text-sub);">${pl.trackCount} tracks</div>
          </div>
          <span style="font-size:12px; font-weight:700; color:var(--accent-cyan);">+ Add</span>
        `;
        item.onclick = async () => {
          try {
            await fetch(`/api/library/playlist/${pl.id}/add`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(this.trackToAddToPlaylist)
            });
            window.showToast(`Added to "${pl.name}"`);
            this.modalAddToPlaylist.style.display = 'none';
            this.loadLibrary();
          } catch (e) {
            console.error('Failed to add track to playlist:', e);
            window.showToast('Error adding track to playlist');
          }
        };
        this.modalPlaylistSelectList.appendChild(item);
      });
    } catch (e) {
      console.error('Failed to fetch playlists for modal:', e);
    }
  }

  // --- Library & Playlists ---
  async loadLibrary() {
    try {
      const likesRes = await fetch('/api/library/likes');
      const likesData = await likesRes.json();
      const count = (likesData.tracks || []).length;
      if (this.likedCountBadge) {
        this.likedCountBadge.textContent = `${count} tracks saved`;
      }

      // Liked shortcut card
      const likedCard = document.querySelector('.library-card[data-playlist="liked"]');
      if (likedCard) {
        likedCard.onclick = () => {
          this.openPlaylistView(null, 'Liked Tracks', 'Your personal music vault', likesData.tracks || []);
        };
      }

      // User Playlists
      const plRes = await fetch('/api/library/playlists');
      const plData = await plRes.json();
      
      const customElements = this.libraryPlaylists.querySelectorAll('.library-card:not([data-playlist="liked"])');
      customElements.forEach(el => el.remove());

      (plData.playlists || []).forEach(pl => {
        const item = document.createElement('div');
        item.className = 'library-card';
        item.innerHTML = `
          <div class="playlist-cover-mini">♫</div>
          <div class="library-card-info">
            <div class="library-card-title">${pl.name}</div>
            <div class="library-card-sub">Playlist • ${pl.trackCount} tracks</div>
          </div>
        `;
        item.addEventListener('click', async () => {
          const detailRes = await fetch(`/api/library/playlist/${pl.id}`);
          const detailData = await detailRes.json();
          this.openPlaylistView(pl.id, pl.name, pl.description || 'Custom Playlist', detailData.tracks || []);
        });
        this.libraryPlaylists.appendChild(item);
      });
    } catch (e) {
      console.error('[Etsuko] Failed to load library:', e);
    }
  }

  openPlaylistView(playlistId, title, desc, tracks, coverUrl = null, typeLabel = null) {
    this.activePlaylistId = playlistId;
    this.currentPlaylistTracks = tracks || [];
    this.playlistHeaderTitle.textContent = title;
    this.playlistHeaderDesc.textContent = desc;
    this.playlistHeaderMeta.textContent = `${this.currentPlaylistTracks.length} tracks`;
    this.playlistTracksList.innerHTML = '';

    const typeEl = document.getElementById('playlist-header-type');
    if (typeEl) {
      typeEl.textContent = typeLabel || (playlistId ? 'CUSTOM PLAYLIST' : (coverUrl ? 'ALBUM' : 'COLLECTION'));
    }

    const coverEl = document.getElementById('playlist-header-cover');
    if (coverEl) {
      if (coverUrl) {
        coverEl.innerHTML = `<img src="${coverUrl}" alt="${title}" style="width:100%; height:100%; border-radius:12px; object-fit:cover;" onerror="this.src='assets/default_cover.png';">`;
      } else if (!playlistId) {
        coverEl.innerHTML = `
          <svg viewBox="0 0 24 24" width="60" height="60" fill="white">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>`;
      } else {
        coverEl.innerHTML = `
          <svg viewBox="0 0 24 24" width="50" height="50" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18V5l12-2v13"></path>
            <circle cx="6" cy="18" r="3"></circle>
            <circle cx="18" cy="16" r="3"></circle>
          </svg>`;
      }
    }

    if (this.playlistFilterInput) {
      this.playlistFilterInput.value = '';
    }

    // Show delete button only for custom playlists
    if (this.btnDeletePlaylist) {
      this.btnDeletePlaylist.style.display = playlistId ? 'inline-flex' : 'none';
    }

    // Show clear all button if playlist has tracks
    if (this.btnClearPlaylist) {
      this.btnClearPlaylist.style.display = this.currentPlaylistTracks.length > 0 ? 'inline-flex' : 'none';
    }

    const renderFiltered = (list) => {
      this.playlistTracksList.innerHTML = '';
      if (list.length === 0) {
        this.playlistTracksList.innerHTML = `
          <div style="padding: 40px 16px; text-align: center; color: var(--text-sub);">
            <p style="font-size: 15px; color: #fff; margin-bottom: 6px;">${this.currentPlaylistTracks.length === 0 ? 'This collection is empty.' : 'No matching tracks found.'}</p>
            <p style="font-size: 13px;">${this.currentPlaylistTracks.length === 0 ? 'Add songs by clicking the heart or "+" button!' : 'Try a different search query.'}</p>
          </div>
        `;
      } else {
        list.forEach((track, idx) => {
          const row = this.createTrackRow(track, idx + 1, list, true, playlistId);
          this.playlistTracksList.appendChild(row);
        });
      }
    };

    renderFiltered(this.currentPlaylistTracks);

    if (this.playlistFilterInput) {
      this.playlistFilterInput.oninput = (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (!query) {
          renderFiltered(this.currentPlaylistTracks);
          return;
        }
        const filtered = this.currentPlaylistTracks.filter(t => 
          (t.title && t.title.toLowerCase().includes(query)) ||
          (t.artist && t.artist.toLowerCase().includes(query)) ||
          (t.album && t.album.toLowerCase().includes(query))
        );
        renderFiltered(filtered);
      };
    }

    if (this.btnClearPlaylist) {
      this.btnClearPlaylist.onclick = async () => {
        if (this.currentPlaylistTracks.length === 0) return;
        if (!confirm('Clear all tracks from this collection?')) return;
        try {
          if (playlistId) {
            await fetch(`/api/library/playlist/${playlistId}/clear`, { method: 'POST' });
          } else {
            await fetch('/api/library/likes/clear', { method: 'POST' });
            if (this.likedCountBadge) this.likedCountBadge.textContent = '0 tracks saved';
          }
          this.currentPlaylistTracks = [];
          this.playlistHeaderMeta.textContent = '0 tracks';
          if (this.btnClearPlaylist) this.btnClearPlaylist.style.display = 'none';
          renderFiltered([]);
          this.loadLibrary();
          window.showToast('All tracks cleared');
        } catch (e) {
          console.error('Failed to clear tracks:', e);
        }
      };
    }

    this.btnPlaylistPlayall.onclick = () => {
      if (this.currentPlaylistTracks.length > 0) {
        window.player.playTrack(this.currentPlaylistTracks[0], this.currentPlaylistTracks);
      }
    };

    this.navigateTo('playlist');
  }

  async handleDeleteActivePlaylist() {
    if (!this.activePlaylistId) return;
    try {
      await fetch(`/api/library/playlist/${this.activePlaylistId}`, { method: 'DELETE' });
      window.showToast('Playlist deleted');
      this.activePlaylistId = null;
      this.loadLibrary();
      this.navigateTo('home');
    } catch (e) {
      console.error('Failed to delete playlist:', e);
      window.showToast('Error deleting playlist');
    }
  }

  async handleCreatePlaylist() {
    const name = this.inputPlaylistName.value.trim();
    const desc = this.inputPlaylistDesc.value.trim();
    if (!name) return;

    try {
      await fetch('/api/library/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description: desc })
      });

      this.modalNewPlaylist.style.display = 'none';
      this.inputPlaylistName.value = '';
      this.inputPlaylistDesc.value = '';
      window.showToast(`Playlist "${name}" created!`);
      this.loadLibrary();
    } catch (e) {
      console.error('Create playlist failed:', e);
    }
  }

  // --- Queue Drawer ---
  renderQueue() {
    const current = window.player.currentTrack;
    if (current) {
      const isLiked = !!current.isLiked;
      this.queueNowPlaying.innerHTML = `
        <div class="queue-now-card">
          <div class="queue-now-card-img-wrap">
            <img src="${current.thumbnail}" alt="${current.title}" onerror="this.onerror=null; this.src='assets/default_cover.png';" loading="lazy">
          </div>
          <div class="queue-now-card-info">
            <div class="queue-now-title" title="${current.title}">${current.title}</div>
            <div class="queue-now-artist" title="${current.artist}">${current.artist}</div>
          </div>
          <button class="btn-like ${isLiked ? 'liked' : ''} queue-now-like" title="${isLiked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="${isLiked ? '#ec4899' : 'none'}" stroke="currentColor" stroke-width="2">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </button>
        </div>
      `;
      const likeBtn = this.queueNowPlaying.querySelector('.queue-now-like');
      if (likeBtn) {
        likeBtn.onclick = (e) => {
          e.stopPropagation();
          if (window.player && window.player.playerLikeBtn) {
            window.player.playerLikeBtn.click();
          }
        };
      }
    } else {
      this.queueNowPlaying.innerHTML = `
        <div class="queue-empty-box">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M9 18V5l12-2v13"></path>
            <circle cx="6" cy="18" r="3"></circle>
            <circle cx="18" cy="16" r="3"></circle>
          </svg>
          <div class="queue-empty-title">Nothing playing right now</div>
          <div class="queue-empty-sub">Choose any track or album to start</div>
        </div>
      `;
    }

    // Upcoming queue list
    this.queueList.innerHTML = '';
    const upcoming = window.player.queue.slice(window.player.queueIndex + 1);
    if (this.queueCountBadge) {
      this.queueCountBadge.textContent = `${upcoming.length} tracks`;
    }

    if (upcoming.length === 0) {
      this.queueList.innerHTML = `
        <div class="queue-empty-box">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8">
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
          <div class="queue-empty-title">Queue is empty</div>
          <div class="queue-empty-sub">Add tracks from albums or playlists</div>
        </div>
      `;
    } else {
      upcoming.forEach((t, i) => {
        const item = document.createElement('div');
        item.className = 'queue-track-item';
        item.innerHTML = `
          <span class="queue-item-idx">${i + 1}</span>
          <img src="${t.thumbnail}" alt="${t.title}" onerror="this.onerror=null; this.src='assets/default_cover.png';" loading="lazy">
          <div class="queue-track-info">
            <div class="queue-track-title" title="${t.title}">${t.title}</div>
            <div class="queue-track-artist" title="${t.artist}">${t.artist}</div>
          </div>
          <div class="queue-item-actions">
            <button class="btn-queue-action btn-queue-remove" title="Remove from queue">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        `;

        item.onclick = (e) => {
          if (e.target.closest('.btn-queue-remove')) return;
          window.player.queueIndex = window.player.queueIndex + 1 + i;
          window.player.playTrack(t);
        };

        const removeBtn = item.querySelector('.btn-queue-remove');
        if (removeBtn) {
          removeBtn.onclick = (e) => {
            e.stopPropagation();
            const realIndex = window.player.queueIndex + 1 + i;
            window.player.queue.splice(realIndex, 1);
            this.renderQueue();
            window.showToast(`Removed from queue`);
          };
        }

        this.queueList.appendChild(item);
      });
    }

    // Autoplay recommendations
    this.queueAutoplayList.innerHTML = '';
    const autoplayList = (window.player.autoplayTracks || []).slice(0, 8);
    if (autoplayList.length === 0) {
      this.queueAutoplayList.innerHTML = `
        <div style="color:var(--text-muted); font-size:12px; padding: 12px 6px; text-align:center;">
          Recommendations appear when audio streams
        </div>
      `;
    } else {
      autoplayList.forEach(t => {
        const item = document.createElement('div');
        item.className = 'queue-track-item';
        item.innerHTML = `
          <img src="${t.thumbnail}" alt="${t.title}" onerror="this.onerror=null; this.src='assets/default_cover.png';" loading="lazy">
          <div class="queue-track-info">
            <div class="queue-track-title" title="${t.title}">${t.title}</div>
            <div class="queue-track-artist" title="${t.artist}">${t.artist}</div>
          </div>
          <div class="queue-item-actions">
            <button class="btn-queue-action btn-queue-add" title="Add to Queue">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
          </div>
        `;

        item.onclick = (e) => {
          if (e.target.closest('.btn-queue-add')) return;
          window.player.playTrack(t);
        };

        const addBtn = item.querySelector('.btn-queue-add');
        if (addBtn) {
          addBtn.onclick = (e) => {
            e.stopPropagation();
            window.player.queue.push(t);
            this.renderQueue();
            window.showToast(`Added to queue`);
          };
        }

        this.queueAutoplayList.appendChild(item);
      });
    }
  }

  // --- Lyrics Subsystem ---
  async loadLyricsForCurrentTrack() {
    const track = window.player.currentTrack;
    if (!track) return;

    this.lyricsTrackTitle.textContent = track.title;
    this.lyricsTrackArtist.textContent = track.artist;
    this.lyricsBackdrop.style.backgroundImage = `url(${track.thumbnail || 'assets/default_cover.png'})`;
    this.lyricsLines.innerHTML = '<p class="lyrics-loading">Fetching studio lyrics...</p>';

    try {
      const res = await fetch(`/api/lyrics/${track.videoId}?title=${encodeURIComponent(track.title)}&artist=${encodeURIComponent(track.artist)}`);
      const data = await res.json();
      this.lyricsData = data;
      this.syncedLyrics = [];

      if (data.synced) {
        this.parseSyncedLyrics(data.synced);
      } else if (data.plain) {
        this.renderPlainLyrics(data.plain);
      } else {
        this.lyricsLines.innerHTML = '<p>No lyrics found for this track.</p>';
      }
    } catch (e) {
      this.lyricsLines.innerHTML = '<p>Unable to load lyrics.</p>';
    }
  }

  parseSyncedLyrics(lrcText) {
    const lines = lrcText.split('\n');
    const timeRegex = /\[(\d{2}):(\d{2}\.\d{2})\]/;
    this.syncedLyrics = [];
    this.lyricsLines.innerHTML = '';

    lines.forEach(line => {
      const match = timeRegex.exec(line);
      if (match) {
        const minutes = parseFloat(match[1]);
        const seconds = parseFloat(match[2]);
        const time = minutes * 60 + seconds;
        const text = line.replace(timeRegex, '').trim();
        if (text) {
          const el = document.createElement('div');
          el.className = 'lyrics-line';
          el.textContent = text;
          el.setAttribute('data-time', time);
          el.onclick = () => {
            window.player.audio.currentTime = time;
          };
          this.lyricsLines.appendChild(el);
          this.syncedLyrics.push({ time, element: el });
        }
      }
    });

    if (this.syncedLyrics.length === 0 && this.lyricsData.plain) {
      this.renderPlainLyrics(this.lyricsData.plain);
    }
  }

  renderPlainLyrics(plainText) {
    this.lyricsLines.innerHTML = '';
    const lines = plainText.split('\n');
    lines.forEach(l => {
      const p = document.createElement('p');
      p.className = 'lyrics-line';
      p.textContent = l || ' ';
      this.lyricsLines.appendChild(p);
    });
  }

  updateSyncedLyricsProgress(currentTime) {
    let activeIndex = -1;
    for (let i = 0; i < this.syncedLyrics.length; i++) {
      if (currentTime >= this.syncedLyrics[i].time) {
        activeIndex = i;
      } else {
        break;
      }
    }

    this.syncedLyrics.forEach((item, idx) => {
      if (idx === activeIndex) {
        item.element.classList.add('active');
        item.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        item.element.classList.remove('active');
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new EtsukoApp();
});
