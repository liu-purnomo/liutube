class LiuTube {
    constructor() {
        this.currentSearchType = 'video';
        this.searchResults = [];
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.setupWindowControls();
        this.loadTrendingVideos();
        console.log('LiuTube initialized');
    }

    setupEventListeners() {
        const searchIconBtn = document.getElementById('searchIconBtn');
        const homeBtn = document.getElementById('homeBtn');
        const searchModal = document.getElementById('searchModal');
        const searchInput = document.getElementById('searchInput');
        const searchTabs = document.querySelectorAll('.search-tab');
        const titleBar = document.getElementById('titleBar');

        // Title bar is always visible now for easy dragging

        // Home button
        homeBtn.addEventListener('click', () => {
            this.showHomePage();
        });

        // Open search modal
        searchIconBtn.addEventListener('click', () => {
            searchModal.classList.add('show');
            searchInput.focus();
        });

        // Close search modal when clicking outside
        searchModal.addEventListener('click', (e) => {
            if (e.target === searchModal) {
                searchModal.classList.remove('show');
            }
        });

        // Search functionality
        searchInput.addEventListener('input', this.debounce(() => {
            if (searchInput.value.trim()) {
                this.handleSearch();
            } else {
                document.getElementById('searchResults').innerHTML = '';
            }
        }, 500));

        searchTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                searchTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentSearchType = tab.dataset.type;
                
                if (searchInput.value.trim()) {
                    this.handleSearch();
                }
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                searchModal.classList.remove('show');
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

    async handleSearch() {
        const query = document.getElementById('searchInput').value.trim();
        const resultsContainer = document.getElementById('searchResults');

        if (!query) {
            resultsContainer.innerHTML = '';
            return;
        }

        resultsContainer.innerHTML = '<div class="loading">Searching...</div>';

        try {
            const results = await window.electronAPI.searchYoutube(query, this.currentSearchType);
            
            if (results.error) {
                resultsContainer.innerHTML = '<div class="loading">Search failed. Please try again.</div>';
                return;
            }
            
            switch (this.currentSearchType) {
                case 'video':
                    this.displayVideoResults(results.videos);
                    break;
                case 'channel':
                    this.displayChannelResults(results.channels);
                    break;
                case 'playlist':
                    this.displayPlaylistResults(results.playlists);
                    break;
            }
        } catch (error) {
            console.error('Search error:', error);
            resultsContainer.innerHTML = '<div class="loading">Search failed. Please try again.</div>';
        }
    }

    displayVideoResults(videos) {
        const resultsContainer = document.getElementById('searchResults');
        
        if (!videos || videos.length === 0) {
            resultsContainer.innerHTML = '<div class="loading">No videos found</div>';
            return;
        }

        resultsContainer.innerHTML = '';
        
        videos.slice(0, 10).forEach(video => {
            if (!video.id || !video.title) return;

            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            resultItem.innerHTML = `
                <div class="result-title">${this.escapeHtml(video.title.text || video.title)}</div>
                <div class="result-channel">${this.escapeHtml(video.author?.name || 'Unknown Channel')}</div>
            `;

            resultItem.addEventListener('click', () => {
                this.playVideo(video.id);
                document.getElementById('searchModal').classList.remove('show');
            });

            resultsContainer.appendChild(resultItem);
        });
    }

    displayChannelResults(channels) {
        const resultsContainer = document.getElementById('searchResults');
        
        if (!channels || channels.length === 0) {
            resultsContainer.innerHTML = '<div class="loading">No channels found</div>';
            return;
        }

        resultsContainer.innerHTML = '';
        
        channels.slice(0, 10).forEach(channel => {
            if (!channel.id || !channel.title) return;

            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            resultItem.innerHTML = `
                <div class="result-title">${this.escapeHtml(channel.title.text || channel.title)}</div>
                <div class="result-channel">${channel.subscriber_count?.text || 'Channel'}</div>
            `;

            resultItem.addEventListener('click', async () => {
                await this.loadChannelVideos(channel.id);
            });

            resultsContainer.appendChild(resultItem);
        });
    }

    displayPlaylistResults(playlists) {
        const resultsContainer = document.getElementById('searchResults');
        
        if (!playlists || playlists.length === 0) {
            resultsContainer.innerHTML = '<div class="loading">No playlists found</div>';
            return;
        }

        resultsContainer.innerHTML = '';
        
        playlists.slice(0, 10).forEach(playlist => {
            if (!playlist.id || !playlist.title) return;

            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            resultItem.innerHTML = `
                <div class="result-title">${this.escapeHtml(playlist.title.text || playlist.title)}</div>
                <div class="result-channel">${playlist.video_count?.text || 'Playlist'}</div>
            `;

            resultItem.addEventListener('click', async () => {
                await this.loadPlaylistVideos(playlist.id);
            });

            resultsContainer.appendChild(resultItem);
        });
    }

    async loadChannelVideos(channelId) {
        const resultsContainer = document.getElementById('searchResults');
        resultsContainer.innerHTML = '<div class="loading">Loading channel videos...</div>';

        try {
            const result = await window.electronAPI.getChannelVideos(channelId);
            if (result.error) {
                resultsContainer.innerHTML = '<div class="loading">Failed to load channel videos</div>';
                return;
            }
            this.displayVideoResults(result.videos);
        } catch (error) {
            console.error('Channel loading error:', error);
            resultsContainer.innerHTML = '<div class="loading">Failed to load channel videos</div>';
        }
    }

    async loadPlaylistVideos(playlistId) {
        const resultsContainer = document.getElementById('searchResults');
        resultsContainer.innerHTML = '<div class="loading">Loading playlist videos...</div>';

        try {
            const result = await window.electronAPI.getPlaylistVideos(playlistId);
            if (result.error) {
                resultsContainer.innerHTML = '<div class="loading">Failed to load playlist videos</div>';
                return;
            }
            this.displayVideoResults(result.videos);
        } catch (error) {
            console.error('Playlist loading error:', error);
            resultsContainer.innerHTML = '<div class="loading">Failed to load playlist videos</div>';
        }
    }

    async playVideo(videoId) {
        const youtubePlayer = document.getElementById('youtubePlayer');
        const videoPlayer = document.getElementById('videoPlayer');
        const videoContainer = document.getElementById('videoContainer');
        const homePage = document.getElementById('homePage');

        try {
            // Show video container and hide home page
            homePage.style.display = 'none';
            videoContainer.style.display = 'flex';
            
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
        document.getElementById('youtubePlayer').src = '';
        document.getElementById('videoPlayer').src = '';
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

            trendingGrid.innerHTML = '';
            
            results.videos.slice(0, 12).forEach(video => {
                if (!video.id || !video.title) return;

                const videoCard = document.createElement('div');
                videoCard.className = 'video-card';
                videoCard.innerHTML = `
                    ${video.thumbnail ? `<img src="${video.thumbnail}" alt="${this.escapeHtml(video.title)}" class="video-thumbnail">` : ''}
                    <div class="video-info">
                        <div class="video-title">${this.escapeHtml(video.title)}</div>
                        <div class="video-channel">${this.escapeHtml(video.author || 'Unknown Channel')}</div>
                        <div class="video-stats">${video.duration || ''}</div>
                    </div>
                `;

                videoCard.addEventListener('click', () => {
                    this.playVideo(video.id);
                });

                trendingGrid.appendChild(videoCard);
            });
            
        } catch (error) {
            console.error('Trending videos error:', error);
            trendingGrid.innerHTML = '<div class="loading" style="grid-column: 1 / -1; text-align: center; padding: 50px;">Failed to load trending videos</div>';
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new LiuTube();
});