class HistoryManager {
    constructor() {
        this.storageKey = 'liutube-history';
        this.maxHistoryItems = 100;
    }

    // Create - Add video to history
    addVideo(video) {
        const history = this.getHistory();
        
        // Remove existing entry if exists (to update timestamp)
        const existingIndex = history.findIndex(item => item.id === video.id);
        if (existingIndex > -1) {
            history.splice(existingIndex, 1);
        }

        // Add to beginning with current timestamp
        const historyItem = {
            id: video.id,
            title: video.title,
            author: video.author || 'Unknown Channel',
            thumbnail: video.thumbnail || '',
            duration: video.duration || '',
            watchedAt: new Date().toISOString(),
            watchCount: (history.find(item => item.id === video.id)?.watchCount || 0) + 1
        };

        history.unshift(historyItem);

        // Keep only max items
        if (history.length > this.maxHistoryItems) {
            history.splice(this.maxHistoryItems);
        }

        this.saveHistory(history);
        return historyItem;
    }

    // Read - Get all history
    getHistory() {
        try {
            const history = localStorage.getItem(this.storageKey);
            return history ? JSON.parse(history) : [];
        } catch (error) {
            console.error('Error loading history:', error);
            return [];
        }
    }

    // Read - Get history by search query
    searchHistory(query) {
        const history = this.getHistory();
        if (!query) return history;

        const searchTerm = query.toLowerCase();
        return history.filter(item => 
            item.title.toLowerCase().includes(searchTerm) ||
            item.author.toLowerCase().includes(searchTerm)
        );
    }

    // Read - Get recent history (last N items)
    getRecentHistory(limit = 20) {
        const history = this.getHistory();
        return history.slice(0, limit);
    }

    // Update - Update specific video info
    updateVideo(videoId, updates) {
        const history = this.getHistory();
        const index = history.findIndex(item => item.id === videoId);
        
        if (index > -1) {
            history[index] = { ...history[index], ...updates };
            this.saveHistory(history);
            return history[index];
        }
        return null;
    }

    // Delete - Remove specific video from history
    removeVideo(videoId) {
        const history = this.getHistory();
        const filteredHistory = history.filter(item => item.id !== videoId);
        this.saveHistory(filteredHistory);
        return filteredHistory.length !== history.length;
    }

    // Delete - Clear all history
    clearHistory() {
        localStorage.removeItem(this.storageKey);
        return true;
    }

    // Delete - Remove videos older than X days
    clearOldHistory(days = 30) {
        const history = this.getHistory();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const filteredHistory = history.filter(item => 
            new Date(item.watchedAt) > cutoffDate
        );

        this.saveHistory(filteredHistory);
        return history.length - filteredHistory.length;
    }

    // Helper - Save history to localStorage
    saveHistory(history) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(history));
        } catch (error) {
            console.error('Error saving history:', error);
        }
    }

    // Helper - Get stats
    getStats() {
        const history = this.getHistory();
        return {
            totalVideos: history.length,
            totalWatchTime: history.reduce((total, item) => {
                const duration = this.parseDuration(item.duration);
                return total + (duration * item.watchCount);
            }, 0),
            mostWatchedChannels: this.getMostWatchedChannels(history, 5),
            recentActivity: history.slice(0, 10)
        };
    }

    // Helper - Parse duration string to seconds
    parseDuration(duration) {
        if (!duration) return 0;
        const parts = duration.split(':').reverse();
        let seconds = 0;
        for (let i = 0; i < parts.length; i++) {
            seconds += parseInt(parts[i] || 0) * Math.pow(60, i);
        }
        return seconds;
    }

    // Helper - Get most watched channels
    getMostWatchedChannels(history, limit = 5) {
        const channelStats = {};
        history.forEach(item => {
            if (!channelStats[item.author]) {
                channelStats[item.author] = { name: item.author, count: 0 };
            }
            channelStats[item.author].count += item.watchCount;
        });

        return Object.values(channelStats)
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }
}

class LiuTube {
    constructor() {
        this.currentSearchType = 'video';
        this.searchResults = [];
        this.currentDownload = null;
        this.activeDownloads = new Map();
        this.historyManager = new HistoryManager();
        this.currentVideos = [];
        this.isLoadingMore = false;
        this.hasMoreContent = true;
        this.currentQuery = '';
        this.isSearchMode = false;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.setupWindowControls();
        this.setupDownloadHandlers();
        this.loadTrendingVideos();
        // Make instance globally accessible for onclick handlers
        window.liuTube = this;
    }

    setupEventListeners() {
        const homeBtn = document.getElementById('homeBtn');
        const homeSearchInput = document.getElementById('homeSearchInput');
        const homeSearchBtn = document.getElementById('homeSearchBtn');
        const loadMoreBtn = document.getElementById('loadMoreBtn');

        // Home button
        homeBtn.addEventListener('click', () => {
            this.showHomePage();
        });

        // Home search functionality
        homeSearchInput.addEventListener('input', this.debounce(() => {
            if (homeSearchInput.value.trim()) {
                this.handleHomeSearch();
            } else {
                this.loadTrendingVideos();
            }
        }, 500));

        homeSearchBtn.addEventListener('click', () => {
            this.handleHomeSearch();
        });

        homeSearchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.handleHomeSearch();
            }
        });

        loadMoreBtn.addEventListener('click', () => {
            this.loadMoreVideos();
        });

        // History navigation
        const historyBtn = document.getElementById('historyBtn');
        if (historyBtn) {
            historyBtn.addEventListener('click', () => {
                this.showHistoryPage();
            });
        }

        // History search
        const historySearchInput = document.getElementById('historySearchInput');
        if (historySearchInput) {
            historySearchInput.addEventListener('input', this.debounce(() => {
                this.searchHistory();
            }, 300));
        }

        // Clear history
        const clearHistoryBtn = document.getElementById('clearHistoryBtn');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear all history?')) {
                    this.historyManager.clearHistory();
                    this.displayHistory();
                }
            });
        }

        // Download manager controls
        const minimizeDownloads = document.getElementById('minimizeDownloads');
        if (minimizeDownloads) {
            minimizeDownloads.addEventListener('click', () => {
                const downloadManager = document.getElementById('downloadManager');
                downloadManager.classList.toggle('minimized');
                minimizeDownloads.textContent = downloadManager.classList.contains('minimized') ? '+' : '_';
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.showHomePage();
            }
        });
    }

    setupWindowControls() {
        const minimizeBtn = document.getElementById('minimizeBtn');
        const closeBtn = document.getElementById('closeBtn');
        const pinBtn = document.getElementById('pinBtn');

        minimizeBtn.addEventListener('click', () => {
            window.electronAPI.minimizeWindow();
        });

        closeBtn.addEventListener('click', () => {
            window.electronAPI.closeWindow();
        });

        pinBtn.addEventListener('click', async () => {
            const isOnTop = await window.electronAPI.toggleAlwaysOnTop();
            pinBtn.classList.toggle('active', isOnTop);
        });
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    async handleHomeSearch() {
        const query = document.getElementById('homeSearchInput').value.trim();
        const trendingGrid = document.getElementById('trendingGrid');

        if (!query) {
            this.isSearchMode = false;
            this.currentQuery = '';
            this.loadTrendingVideos();
            return;
        }

        this.isSearchMode = true;
        this.currentQuery = query;
        this.currentVideos = [];
        this.hasMoreContent = true;

        trendingGrid.innerHTML = '<div class="loading" style="grid-column: 1 / -1; text-align: center; padding: 50px;">Searching...</div>';

        try {
            const results = await window.electronAPI.searchYoutube(query, 'video');
            
            if (results.error) {
                trendingGrid.innerHTML = '<div class="loading" style="grid-column: 1 / -1; text-align: center; padding: 50px;">Search failed. Please try again.</div>';
                return;
            }
            
            this.currentVideos = results.videos || [];
            this.displayVideosInGrid(this.currentVideos);
        } catch (error) {
            trendingGrid.innerHTML = '<div class="loading" style="grid-column: 1 / -1; text-align: center; padding: 50px;">Search failed. Please try again.</div>';
        }
    }

    async loadMoreVideos() {
        if (this.isLoadingMore || !this.hasMoreContent) {
            return;
        }

        this.isLoadingMore = true;
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        const originalText = loadMoreBtn.textContent;
        loadMoreBtn.textContent = 'Loading...';
        loadMoreBtn.disabled = true;

        try {
            let newVideos = [];
            
            if (this.isSearchMode && this.currentQuery) {
                const results = await window.electronAPI.searchYoutube(this.currentQuery, 'video');
                if (results && results.videos) {
                    newVideos = results.videos.filter(video => 
                        !this.currentVideos.some(existing => existing.id === video.id)
                    );
                }
            } else {
                const results = await window.electronAPI.getTrendingVideos();
                if (results && results.videos) {
                    newVideos = results.videos.filter(video => 
                        !this.currentVideos.some(existing => existing.id === video.id)
                    );
                }
                
                if (!newVideos.length) {
                    const fallbackQueries = [
                        'popular videos today',
                        'most viewed this week', 
                        'trending now',
                        'hot videos right now',
                        'viral videos',
                        'top videos'
                    ];
                    
                    const randomQuery = fallbackQueries[Math.floor(Math.random() * fallbackQueries.length)];
                    const searchResults = await window.electronAPI.searchYoutube(randomQuery, 'video');
                    
                    if (searchResults && searchResults.videos) {
                        newVideos = searchResults.videos.filter(video => 
                            !this.currentVideos.some(existing => existing.id === video.id)
                        );
                    }
                }
            }

            if (newVideos.length > 0) {
                this.currentVideos = [...this.currentVideos, ...newVideos];
                this.appendVideosToGrid(newVideos);
            } else {
                this.hasMoreContent = false;
                loadMoreBtn.textContent = 'No more videos';
                setTimeout(() => {
                    loadMoreBtn.style.display = 'none';
                }, 2000);
            }
        } catch (error) {
            loadMoreBtn.textContent = 'Failed to load more';
            setTimeout(() => {
                loadMoreBtn.textContent = originalText;
                loadMoreBtn.disabled = false;
            }, 2000);
        } finally {
            this.isLoadingMore = false;
            if (this.hasMoreContent) {
                loadMoreBtn.textContent = originalText;
                loadMoreBtn.disabled = false;
            }
        }
    }


    async playVideo(videoId, videoData = null) {
        const youtubePlayer = document.getElementById('youtubePlayer');
        const videoPlayer = document.getElementById('videoPlayer');
        const videoContainer = document.getElementById('videoContainer');
        const homePage = document.getElementById('homePage');
        const historyPage = document.getElementById('historyPage');

        try {
            // Clean up any existing video elements first
            this.cleanupVideoElements();
            
            // Hide all pages and show video container
            homePage.style.display = 'none';
            if (historyPage) historyPage.style.display = 'none';
            videoContainer.style.display = 'flex';
            
            // Add to history
            if (videoData) {
                this.historyManager.addVideo({
                    id: videoId,
                    title: videoData.title,
                    author: videoData.author,
                    thumbnail: videoData.thumbnail,
                    duration: videoData.duration
                });
            }
            
            // Show loading state
            this.showVideoLoading(videoData);
            
            // Always try YouTube embedded player first
            const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&rel=0&modestbranding=1&enablejsapi=1`;
            youtubePlayer.src = embedUrl;
            youtubePlayer.style.display = 'block';
            videoPlayer.style.display = 'none';
            
            
            let fallbackTriggered = false;
            let loadingHidden = false;
            let videoLoadedSuccessfully = false;
            
            // Wait for iframe to load
            youtubePlayer.onload = () => {
                if (!loadingHidden) {
                    setTimeout(() => {
                        this.hideVideoLoading();
                        loadingHidden = true;
                        videoLoadedSuccessfully = true;
                    }, 1500);
                }
            };
            
            // Shorter timeout for better UX
            setTimeout(() => {
                if (!fallbackTriggered && !loadingHidden) {
                    this.hideVideoLoading();
                    loadingHidden = true;
                }
            }, 3000);
            
            // Only fallback to direct if embed explicitly fails
            youtubePlayer.onerror = async () => {
                if (fallbackTriggered) return;
                fallbackTriggered = true;
                await this.tryDirectVideoPlayback(videoId, videoData);
            };
            
            // Always show floating direct play option for all videos
            this.showFloatingDirectPlayButton(videoId, videoData);
            
        } catch (error) {
            this.showHomePage();
        }
    }

    async tryDirectVideoPlayback(videoId, videoData) {
        const youtubePlayer = document.getElementById('youtubePlayer');
        const videoPlayer = document.getElementById('videoPlayer');
        
        // Hide loading overlay when starting direct playback attempt
        this.hideVideoLoading();
        
        try {
            const result = await window.electronAPI.getVideoInfo(videoId);
            
            if (result.error) {
                // Show specific error messages for music/restricted content
                let errorMsg = result.error;
                if (result.error.includes('age-restricted')) {
                    errorMsg = 'This video is age-restricted and cannot be played directly. Try downloading instead.';
                } else if (result.error.includes('unplayable')) {
                    errorMsg = 'This video cannot be played (possibly region-restricted or music). Try downloading instead.';
                } else if (result.error.includes('restricted')) {
                    errorMsg = 'This video has playback restrictions. You can still download it.';
                }
                
                this.showVideoError(errorMsg, videoId, videoData);
                return;
            }
            
            if (!result.url) {
                this.showVideoError('Video URL not available. This often happens with music videos due to copyright restrictions. Try downloading instead.', videoId, videoData);
                return;
            }
            
            // Switch to direct video player
            youtubePlayer.style.display = 'none';
            videoPlayer.style.display = 'block';
            
            // Clear any existing error handlers
            videoPlayer.onerror = null;
            
            // Set up new error handler before setting src
            videoPlayer.onerror = () => {
                this.showVideoError('Video failed to load. This is common with music videos due to copyright restrictions. Try downloading instead.', videoId, videoData);
            };
            
            videoPlayer.src = result.url;
            videoPlayer.play().catch(error => {
                this.showVideoError('Video failed to load. This is common with music videos due to copyright restrictions. Try downloading instead.', videoId, videoData);
            });
            
            
        } catch (error) {
            this.showVideoError('Unable to play this video. It may be restricted or unavailable. Try downloading instead.', videoId, videoData);
        }
    }

    showVideoLoading(videoData) {
        const videoContainer = document.getElementById('videoContainer');
        
        // Remove any existing loading overlay
        const existingLoading = document.getElementById('videoLoadingOverlay');
        if (existingLoading) {
            existingLoading.remove();
        }
        
        // Create loading overlay
        const loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'videoLoadingOverlay';
        loadingOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: rgba(26, 26, 26, 0.95);
            color: white;
            z-index: 5;
            backdrop-filter: blur(5px);
        `;
        
        loadingOverlay.innerHTML = `
            <div style="text-align: center; max-width: 400px; padding: 20px;">
                <div style="width: 60px; height: 60px; border: 4px solid #333; border-top: 4px solid #ff0000; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 25px;"></div>
                <h3 style="margin-bottom: 15px; font-size: 1.2em;">Loading Video...</h3>
                ${videoData ? `
                    <p style="color: #ccc; margin: 10px 0; line-height: 1.4; font-size: 1em;">${this.escapeHtml(videoData.title || 'Unknown Title')}</p>
                    <p style="color: #999; font-size: 0.9em; margin-bottom: 15px;">${this.escapeHtml(videoData.author || 'Unknown Channel')}</p>
                ` : ''}
                <p style="color: #666; font-size: 0.8em;">Please wait while the video loads...</p>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        
        videoContainer.appendChild(loadingOverlay);
    }

    hideVideoLoading() {
        const loadingOverlay = document.getElementById('videoLoadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.remove();
        }
    }

    showFloatingDirectPlayButton(videoId, videoData) {
        const videoContainer = document.getElementById('videoContainer');
        
        // Check if button already exists
        if (document.getElementById('floatingDirectPlay')) return;
        
        // Create floating direct play button
        const floatingButton = document.createElement('div');
        floatingButton.id = 'floatingDirectPlay';
        floatingButton.style.cssText = `
            position: absolute;
            top: 45px;
            left: 15px;
            z-index: 2100;
            opacity: 0.3;
            transition: all 0.3s ease;
        `;
        
        floatingButton.innerHTML = `
            <button onclick="window.liuTube.tryDirectVideoPlayback('${videoId}', ${JSON.stringify(videoData).replace(/"/g, '&quot;')})" 
                    style="
                        padding: 8px 12px; 
                        background: rgba(0, 0, 0, 0.5); 
                        color: white; 
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        border-radius: 20px; 
                        cursor: pointer; 
                        font-size: 12px;
                        font-weight: 500;
                        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
                        transition: all 0.3s ease;
                        backdrop-filter: blur(10px);
                        display: flex;
                        align-items: center;
                        gap: 6px;
                    "
                    onmouseover="this.parentElement.style.opacity='1'; this.style.background='rgba(255, 0, 0, 0.9)'; this.style.borderColor='rgba(255, 0, 0, 0.7)';"
                    onmouseout="this.parentElement.style.opacity='0.3'; this.style.background='rgba(0, 0, 0, 0.5)'; this.style.borderColor='rgba(255, 255, 255, 0.2)';">
                <span style="font-size: 10px;">🎬</span>
                <span>Direct</span>
            </button>
        `;
        
        videoContainer.appendChild(floatingButton);
        
    }

    showVideoError(message, videoId, videoData) {
        const videoContainer = document.getElementById('videoContainer');
        const youtubePlayer = document.getElementById('youtubePlayer');
        const videoPlayer = document.getElementById('videoPlayer');
        
        // Clear video sources and stop playback
        youtubePlayer.src = '';
        videoPlayer.src = '';
        videoPlayer.pause();
        
        // Hide video elements but keep them in DOM
        youtubePlayer.style.display = 'none';
        videoPlayer.style.display = 'none';
        
        // Create or update error overlay (don't replace the container)
        let errorOverlay = document.getElementById('videoErrorOverlay');
        if (!errorOverlay) {
            errorOverlay = document.createElement('div');
            errorOverlay.id = 'videoErrorOverlay';
            videoContainer.appendChild(errorOverlay);
        }
        
        errorOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
            text-align: center;
            color: white;
            background: #1a1a1a;
            z-index: 10;
        `;
        
        errorOverlay.innerHTML = `
            <div style="max-width: 500px;">
                <h3 style="color: #ff6b6b; margin-bottom: 15px;">Video Unavailable</h3>
                <p style="margin-bottom: 20px; line-height: 1.5;">${message}</p>
                ${videoData ? `
                    <div style="background: #2a2a2a; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <h4>${this.escapeHtml(videoData.title || 'Unknown Title')}</h4>
                        <p style="color: #aaa; margin: 5px 0;">${this.escapeHtml(videoData.author || 'Unknown Channel')}</p>
                    </div>
                ` : ''}
                <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                    <button onclick="window.liuTube.downloadVideo('${videoId}', '${this.escapeHtml(videoData?.title || 'Video')}')" 
                            style="padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        Try Download Instead
                    </button>
                    <button onclick="window.liuTube.showHomePage()" 
                            style="padding: 10px 20px; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        Back to Home
                    </button>
                </div>
            </div>
        `;
        
        videoContainer.style.display = 'block';
    }

    showHomePage() {
        // Hide video container and show home page
        const videoContainer = document.getElementById('videoContainer');
        const homePage = document.getElementById('homePage');
        const historyPage = document.getElementById('historyPage');
        
        videoContainer.style.display = 'none';
        homePage.style.display = 'block';
        if (historyPage) historyPage.style.display = 'none';
        
        // Clean up video elements properly
        this.cleanupVideoElements();
        
    }

    cleanupVideoElements() {
        const youtubePlayer = document.getElementById('youtubePlayer');
        const videoPlayer = document.getElementById('videoPlayer');
        const videoContainer = document.getElementById('videoContainer');
        
        if (youtubePlayer) {
            youtubePlayer.src = '';
            youtubePlayer.style.display = 'none';
            youtubePlayer.onload = null;
            youtubePlayer.onerror = null;
        }
        
        if (videoPlayer) {
            videoPlayer.src = '';
            videoPlayer.pause();
            videoPlayer.style.display = 'none';
            videoPlayer.onerror = null;
        }
        
        // Remove all overlays and UI elements
        const elementsToRemove = [
            'videoErrorOverlay',
            'videoLoadingOverlay', 
            'fallbackButton'
        ];
        
        elementsToRemove.forEach(elementId => {
            const element = document.getElementById(elementId);
            if (element) {
                element.remove();
            }
        });
        
        // Ensure video container has correct structure
        if (!youtubePlayer || !videoPlayer) {
            videoContainer.innerHTML = `
                <iframe id="youtubePlayer" frameborder="0" allowfullscreen style="width: 100%; height: 100%; border: none;"></iframe>
                <video id="videoPlayer" controls style="display: none; width: 100%; height: 100%; background: black;"></video>
            `;
        }
    }

    showHistoryPage() {
        document.getElementById('videoContainer').style.display = 'none';
        document.getElementById('homePage').style.display = 'none';
        document.getElementById('historyPage').style.display = 'block';
        this.displayHistory();
    }

    searchHistory() {
        const query = document.getElementById('historySearchInput').value.trim();
        this.displayHistory(query);
    }

    displayHistory(searchQuery = '') {
        const historyList = document.getElementById('historyList');
        const totalVideosCount = document.getElementById('totalVideosCount');
        const totalChannelsCount = document.getElementById('totalChannelsCount');
        
        const history = searchQuery 
            ? this.historyManager.searchHistory(searchQuery)
            : this.historyManager.getHistory();

        // Update stats
        const stats = this.historyManager.getStats();
        totalVideosCount.textContent = stats.totalVideos;
        totalChannelsCount.textContent = stats.mostWatchedChannels.length;

        if (history.length === 0) {
            historyList.innerHTML = '<div class="loading" style="text-align: center; padding: 50px;">No history found</div>';
            return;
        }

        historyList.innerHTML = '';
        
        history.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            const watchedDate = new Date(item.watchedAt);
            const formattedDate = this.formatDate(watchedDate);
            
            historyItem.innerHTML = `
                ${item.thumbnail ? `<img src="${item.thumbnail}" alt="${this.escapeHtml(item.title)}" class="history-thumbnail">` : '<div class="history-thumbnail"></div>'}
                <div class="history-info">
                    <div class="history-title">${this.escapeHtml(item.title)}</div>
                    <div class="history-meta">
                        <div class="history-channel">${this.escapeHtml(item.author)}</div>
                        <div class="history-date">${formattedDate} ${item.watchCount > 1 ? `• Watched ${item.watchCount} times` : ''}</div>
                    </div>
                </div>
                <div class="history-actions">
                    <button class="history-action-btn download" onclick="event.stopPropagation(); window.liuTube.downloadVideo('${item.id}', '${this.escapeHtml(item.title)}')">Download</button>
                    <button class="history-action-btn delete" onclick="event.stopPropagation(); window.liuTube.removeFromHistory('${item.id}')">Remove</button>
                </div>
            `;

            historyItem.addEventListener('click', () => {
                this.playVideo(item.id, item);
            });

            historyList.appendChild(historyItem);
        });
    }

    removeFromHistory(videoId) {
        this.historyManager.removeVideo(videoId);
        this.displayHistory();
    }

    formatDate(date) {
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        const diffMinutes = Math.floor(diffTime / (1000 * 60));

        if (diffMinutes < 60) {
            return `${diffMinutes} minutes ago`;
        } else if (diffHours < 24) {
            return `${diffHours} hours ago`;
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    async loadTrendingVideos() {
        const trendingGrid = document.getElementById('trendingGrid');
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        
        this.isSearchMode = false;
        this.currentQuery = '';
        this.currentVideos = [];
        this.hasMoreContent = true;
        
        // Reset and show load more button
        loadMoreBtn.style.display = 'block';
        loadMoreBtn.textContent = 'Load More';
        loadMoreBtn.disabled = false;
        
        try {
            // Search for popular/trending content
            const results = await window.electronAPI.getTrendingVideos();
            
            if (results.error || !results.videos) {
                
                // Fallback to curated search terms for better results
                const fallbackQueries = [
                    'popular videos today',
                    'most viewed this week', 
                    'trending now',
                    'hot videos right now'
                ];
                
                const randomQuery = fallbackQueries[Math.floor(Math.random() * fallbackQueries.length)];
                const searchResults = await window.electronAPI.searchYoutube(randomQuery, 'video');
                
                if (searchResults.error || !searchResults.videos) {
                    trendingGrid.innerHTML = '<div class="loading" style="grid-column: 1 / -1; text-align: center; padding: 50px;">Failed to load trending videos</div>';
                    return;
                }
                
                this.currentVideos = searchResults.videos || [];
                this.displayVideosInGrid(this.currentVideos);
                return;
            }
            

            this.currentVideos = results.videos || [];
            this.displayVideosInGrid(this.currentVideos);
            
        } catch (error) {
            trendingGrid.innerHTML = '<div class="loading" style="grid-column: 1 / -1; text-align: center; padding: 50px;">Failed to load trending videos</div>';
        }
    }

    displayVideosInGrid(videos) {
        const trendingGrid = document.getElementById('trendingGrid');
        
        if (!videos || videos.length === 0) {
            trendingGrid.innerHTML = '<div class="loading" style="grid-column: 1 / -1; text-align: center; padding: 50px;">No videos found</div>';
            return;
        }

        trendingGrid.innerHTML = '';
        
        videos.slice(0, 12).forEach(video => {
            this.createVideoCard(video, trendingGrid);
        });
    }

    appendVideosToGrid(videos) {
        const trendingGrid = document.getElementById('trendingGrid');
        
        videos.slice(0, 12).forEach(video => {
            this.createVideoCard(video, trendingGrid);
        });
    }

    createVideoCard(video, container) {
        if (!video.id || !video.title) return;

        const videoCard = document.createElement('div');
        videoCard.className = 'video-card';
        videoCard.innerHTML = `
            <div class="thumbnail-container">
                ${video.thumbnail ? `<img src="${video.thumbnail}" alt="${this.escapeHtml(video.title)}" class="thumbnail-placeholder">` : '<div class="thumbnail-placeholder"></div>'}
                <div class="thumbnail-overlay">
                    <button class="icon-btn" title="Play">
                        <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>
                    </button>
                    <button class="icon-btn" title="Download" onclick="event.stopPropagation(); window.liuTube.downloadVideo('${video.id}', '${this.escapeHtml(video.title)}')">
                        <svg viewBox="0 0 24 24">
                            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="card-info">
                <h4 class="card-title">${this.escapeHtml(video.title)}</h4>
                <p class="card-channel">${this.escapeHtml(video.author || 'Unknown Channel')}</p>
            </div>
        `;

        videoCard.addEventListener('click', () => {
            this.playVideo(video.id, {
                title: video.title,
                author: video.author || 'Unknown Channel',
                thumbnail: video.thumbnail,
                duration: video.duration
            });
        });

        container.appendChild(videoCard);
    }

    async downloadVideo(videoId, title) {
        try {
            
            // Generate unique download ID
            const downloadId = `${videoId}-${Date.now()}`;
            
            // Show download manager
            const downloadManager = document.getElementById('downloadManager');
            downloadManager.classList.add('show');
            
            // Get download info
            const result = await window.electronAPI.downloadVideo(videoId);
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            
            // Create download item in UI
            this.createDownloadItem(downloadId, title, result.filesize);
            
            // Start download
            const downloadsPath = window.electronAPI.getDownloadsPath();
            const filepath = window.electronAPI.joinPath(downloadsPath, result.filename);
            
            
            // Store download info
            this.activeDownloads.set(downloadId, {
                title,
                filepath,
                status: 'downloading'
            });
            
            // Listen for progress updates
            const progressHandler = (event, data) => {
                const { progress, downloadedBytes, totalBytes } = data;
                this.updateDownloadProgress(downloadId, progress, downloadedBytes, totalBytes);
            };
            
            window.electronAPI.onDownloadProgress(progressHandler);
            
            let downloadResult;
            
            try {
                // Method 1: Try simple fetch download first
                downloadResult = await window.electronAPI.downloadFileSimple(videoId, filepath);
            } catch (error) {
                try {
                    // Method 2: Try ytdl-core download
                    downloadResult = await window.electronAPI.downloadFileYtdl(videoId, filepath);
                } catch (ytdlError) {
                    try {
                        // Method 3: Try URL-based download
                        downloadResult = await window.electronAPI.downloadFile(result.downloadUrl, filepath);
                    } catch (urlError) {
                        try {
                            // Method 4: Try stream download
                            downloadResult = await window.electronAPI.downloadFileStream(videoId, filepath);
                        } catch (streamError) {
                            throw streamError;
                        }
                    }
                }
            }
            
            // Clean up
            window.electronAPI.removeDownloadProgressListener(progressHandler);
            
            if (downloadResult.success) {
                this.updateDownloadStatus(downloadId, 'completed');
                
                // Auto-remove completed downloads after 10 seconds
                setTimeout(() => {
                    this.removeDownloadItem(downloadId);
                }, 10000);
            } else {
                throw new Error(downloadResult.error || 'Download failed');
            }
            
        } catch (error) {
            this.updateDownloadStatus(downloadId, 'failed', error.message);
            
            // Auto-remove failed downloads after 5 seconds
            setTimeout(() => {
                this.removeDownloadItem(downloadId);
            }, 5000);
        }
    }

    createDownloadItem(downloadId, title, filesize) {
        const downloadList = document.getElementById('downloadList');
        
        const downloadItem = document.createElement('div');
        downloadItem.className = 'download-item';
        downloadItem.id = `download-${downloadId}`;
        
        const filesizeMB = filesize > 0 ? (filesize / 1024 / 1024).toFixed(1) : '?';
        
        downloadItem.innerHTML = `
            <div class="download-item-header">
                <div class="download-title" title="${this.escapeHtml(title)}">${this.escapeHtml(title)}</div>
                <div class="download-status">Starting...</div>
            </div>
            <div class="download-progress-bar">
                <div class="download-progress-fill"></div>
            </div>
            <div class="download-info">
                <span class="download-size">0 MB / ${filesizeMB} MB</span>
                <span class="download-percent">0%</span>
            </div>
            <div class="download-actions">
                <button class="download-action-btn cancel" onclick="window.liuTube.cancelDownload('${downloadId}')">Cancel</button>
            </div>
        `;
        
        downloadList.appendChild(downloadItem);
    }

    updateDownloadProgress(downloadId, progress, downloadedBytes, totalBytes) {
        const downloadItem = document.getElementById(`download-${downloadId}`);
        if (!downloadItem) return;
        
        const progressFill = downloadItem.querySelector('.download-progress-fill');
        const downloadSize = downloadItem.querySelector('.download-size');
        const downloadPercent = downloadItem.querySelector('.download-percent');
        const downloadStatus = downloadItem.querySelector('.download-status');
        
        progressFill.style.width = `${progress}%`;
        downloadPercent.textContent = `${Math.round(progress)}%`;
        downloadStatus.textContent = 'Downloading...';
        
        const downloadedMB = (downloadedBytes / 1024 / 1024).toFixed(1);
        const totalMB = (totalBytes / 1024 / 1024).toFixed(1);
        downloadSize.textContent = `${downloadedMB} MB / ${totalMB} MB`;
    }

    updateDownloadStatus(downloadId, status, errorMessage = '') {
        const downloadItem = document.getElementById(`download-${downloadId}`);
        if (!downloadItem) return;
        
        const downloadStatus = downloadItem.querySelector('.download-status');
        const downloadActions = downloadItem.querySelector('.download-actions');
        
        if (status === 'completed') {
            downloadStatus.textContent = 'Completed';
            downloadStatus.className = 'download-status download-completed';
            downloadActions.innerHTML = '<button class="download-action-btn" onclick="window.liuTube.removeDownloadItem(\'' + downloadId + '\')">Remove</button>';
        } else if (status === 'failed') {
            downloadStatus.textContent = `Failed: ${errorMessage}`;
            downloadStatus.className = 'download-status download-failed';
            downloadActions.innerHTML = '<button class="download-action-btn" onclick="window.liuTube.removeDownloadItem(\'' + downloadId + '\')">Remove</button>';
        }
        
        // Update stored download info
        if (this.activeDownloads.has(downloadId)) {
            const downloadInfo = this.activeDownloads.get(downloadId);
            downloadInfo.status = status;
            this.activeDownloads.set(downloadId, downloadInfo);
        }
    }

    cancelDownload(downloadId) {
        // Note: Actual cancellation would need to be implemented in main process
        this.updateDownloadStatus(downloadId, 'cancelled');
        setTimeout(() => {
            this.removeDownloadItem(downloadId);
        }, 1000);
    }

    removeDownloadItem(downloadId) {
        const downloadItem = document.getElementById(`download-${downloadId}`);
        if (downloadItem) {
            downloadItem.remove();
        }
        
        this.activeDownloads.delete(downloadId);
        
        // Hide download manager if no active downloads
        const downloadList = document.getElementById('downloadList');
        if (downloadList.children.length === 0) {
            const downloadManager = document.getElementById('downloadManager');
            downloadManager.classList.remove('show');
        }
    }

    setupDownloadHandlers() {
        // Download progress handlers are set up per download in downloadVideo method
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new LiuTube();
});