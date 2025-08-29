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
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.setupWindowControls();
        this.setupDownloadHandlers();
        this.loadTrendingVideos();
        // Make instance globally accessible for onclick handlers
        window.liuTube = this;
        console.log('LiuTube initialized');
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
            this.loadTrendingVideos();
            return;
        }

        trendingGrid.innerHTML = '<div class="loading" style="grid-column: 1 / -1; text-align: center; padding: 50px;">Searching...</div>';

        try {
            const results = await window.electronAPI.searchYoutube(query, 'video');
            
            if (results.error) {
                trendingGrid.innerHTML = '<div class="loading" style="grid-column: 1 / -1; text-align: center; padding: 50px;">Search failed. Please try again.</div>';
                return;
            }
            
            this.displayVideosInGrid(results.videos);
        } catch (error) {
            console.error('Search error:', error);
            trendingGrid.innerHTML = '<div class="loading" style="grid-column: 1 / -1; text-align: center; padding: 50px;">Search failed. Please try again.</div>';
        }
    }

    async loadMoreVideos() {
        // For now, just load more trending content
        // In a real app, you'd implement pagination
        this.loadTrendingVideos();
    }


    async playVideo(videoId, videoData = null) {
        const youtubePlayer = document.getElementById('youtubePlayer');
        const videoPlayer = document.getElementById('videoPlayer');
        const videoContainer = document.getElementById('videoContainer');
        const homePage = document.getElementById('homePage');
        const historyPage = document.getElementById('historyPage');

        try {
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
            
            // Try YouTube embedded player first
            const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&rel=0&modestbranding=1`;
            youtubePlayer.src = embedUrl;
            youtubePlayer.style.display = 'block';
            videoPlayer.style.display = 'none';
            
            console.log('Playing video via YouTube embed:', videoId);
            
            // Fallback to direct video if embed fails
            youtubePlayer.onerror = async () => {
                console.log('Embed failed, trying direct video...');
                
                const result = await window.electronAPI.getVideoInfo(videoId);
                
                if (result.error || !result.url) {
                    throw new Error('Failed to get video URL');
                }
                
                youtubePlayer.style.display = 'none';
                videoPlayer.style.display = 'block';
                videoPlayer.src = result.url;
                videoPlayer.play();
                console.log('Playing video directly:', result.title);
            };
            
        } catch (error) {
            console.error('Video playback error:', error);
            this.showHomePage();
        }
    }

    showHomePage() {
        document.getElementById('videoContainer').style.display = 'none';
        document.getElementById('homePage').style.display = 'block';
        const historyPage = document.getElementById('historyPage');
        if (historyPage) historyPage.style.display = 'none';
        document.getElementById('youtubePlayer').src = '';
        document.getElementById('videoPlayer').src = '';
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
        
        try {
            // Search for popular/trending content
            const results = await window.electronAPI.searchYoutube('trending viral popular 2024', 'video');
            
            if (results.error || !results.videos) {
                trendingGrid.innerHTML = '<div class="loading" style="grid-column: 1 / -1; text-align: center; padding: 50px;">Failed to load trending videos</div>';
                return;
            }

            this.displayVideosInGrid(results.videos);
            
        } catch (error) {
            console.error('Trending videos error:', error);
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

            trendingGrid.appendChild(videoCard);
        });
    }

    async downloadVideo(videoId, title) {
        try {
            console.log('Starting download for:', videoId, title);
            
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
            
            console.log('Download info received:', result);
            
            // Create download item in UI
            this.createDownloadItem(downloadId, title, result.filesize);
            
            // Start download
            const downloadsPath = window.electronAPI.getDownloadsPath();
            const filepath = window.electronAPI.joinPath(downloadsPath, result.filename);
            
            console.log('Download path:', filepath);
            console.log('Download URL:', result.downloadUrl);
            
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
                console.log('Simple download failed, trying ytdl-core download...', error);
                try {
                    // Method 2: Try ytdl-core download
                    downloadResult = await window.electronAPI.downloadFileYtdl(videoId, filepath);
                } catch (ytdlError) {
                    console.log('YTDL download failed, trying URL download...', ytdlError);
                    try {
                        // Method 3: Try URL-based download
                        downloadResult = await window.electronAPI.downloadFile(result.downloadUrl, filepath);
                    } catch (urlError) {
                        console.log('URL download failed, trying stream download...', urlError);
                        try {
                            // Method 4: Try stream download
                            downloadResult = await window.electronAPI.downloadFileStream(videoId, filepath);
                        } catch (streamError) {
                            console.error('All download methods failed:', streamError);
                            throw streamError;
                        }
                    }
                }
            }
            
            // Clean up
            window.electronAPI.removeDownloadProgressListener(progressHandler);
            
            if (downloadResult.success) {
                this.updateDownloadStatus(downloadId, 'completed');
                console.log('Download completed successfully:', downloadResult.filepath);
                
                // Auto-remove completed downloads after 10 seconds
                setTimeout(() => {
                    this.removeDownloadItem(downloadId);
                }, 10000);
            } else {
                throw new Error(downloadResult.error || 'Download failed');
            }
            
        } catch (error) {
            console.error('Download failed:', error);
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
        console.log('Download handlers ready');
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