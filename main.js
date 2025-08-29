const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const { Innertube } = require('youtubei.js');
const ytdl = require('@distube/ytdl-core');

// Utility function for safe filename
function sanitizeFilename(filename) {
  return filename
    .replace(/[<>:"/\\|?*#%\[\]]/g, '-')  // Replace forbidden chars
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, '')  // Remove control chars
    .replace(/^\.+/, '')  // Remove leading dots
    .replace(/\.+$/, '')  // Remove trailing dots  
    .replace(/\s+/g, ' ')  // Replace multiple spaces
    .replace(/[-_]+/g, '-')  // Replace multiple dashes/underscores
    .trim()  // Remove leading/trailing spaces
    .substring(0, 200)  // Limit length
    || 'Video_' + Date.now();  // Fallback name
}

let youtube = null;

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: false,
      preload: path.join(__dirname, 'preload.js'),
      // Disable cache to avoid permission errors
      cache: false,
      // Disable hardware acceleration related features that cause cache errors
      disableBlinkFeatures: 'ServiceWorker'
    },
    titleBarStyle: 'hidden',
    backgroundColor: '#000000',
    icon: process.platform === 'darwin' 
      ? path.join(__dirname, 'build', 'icons', 'mac', 'icon.icns')
      : path.join(__dirname, 'build', 'icons', 'win', 'icon.ico'),
    show: false
  });

  mainWindow.loadFile('index.html');
  
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // mainWindow.webContents.openDevTools();
};

// Fix cache permission errors by setting userData path and disabling cache
const os = require('os');
app.setPath('userData', path.join(os.tmpdir(), 'liutube-data'));
app.commandLine.appendSwitch('disable-http-cache');
app.commandLine.appendSwitch('disable-gpu-memory-buffer-compositor-resources');
app.commandLine.appendSwitch('disable-software-rasterizer');

app.whenReady().then(async () => {
  try {
    youtube = await Innertube.create();
    console.log('YouTube.js initialized in main process');
  } catch (error) {
    console.error('Failed to initialize YouTube.js:', error);
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

ipcMain.handle('search-youtube', async (event, query, type) => {
  if (!youtube) return { error: 'YouTube not initialized' };
  
  try {
    const results = await youtube.search(query, { type });
    
    // Serialize results to plain objects
    let serializedResults = {};
    
    if (results.videos && type === 'video') {
      serializedResults.videos = results.videos.map(video => ({
        id: video.id,
        title: video.title?.text || video.title,
        author: video.author?.name || video.author?.text || video.channel?.name || 'Unknown Channel',
        duration: video.duration?.text || '',
        thumbnail: video.thumbnails?.[0]?.url || ''
      }));
    }
    
    if (results.channels && type === 'channel') {
      serializedResults.channels = results.channels.map(channel => ({
        id: channel.id,
        title: channel.title?.text || channel.title,
        subscriber_count: channel.subscriber_count?.text || '',
        thumbnail: channel.thumbnails?.[0]?.url || ''
      }));
    }
    
    if (results.playlists && type === 'playlist') {
      serializedResults.playlists = results.playlists.map(playlist => ({
        id: playlist.id,
        title: playlist.title?.text || playlist.title,
        video_count: playlist.video_count?.text || '',
        thumbnail: playlist.thumbnails?.[0]?.url || ''
      }));
    }
    
    return serializedResults;
  } catch (error) {
    console.error('Search error:', error);
    return { error: error.message };
  }
});

ipcMain.handle('get-video-info', async (event, videoId) => {
  if (!youtube) return { error: 'YouTube not initialized' };
  
  try {
    const info = await youtube.getInfo(videoId);
    const format = info.chooseFormat({ quality: 'best', type: 'video+audio' });
    return { 
      title: info.basic_info.title,
      url: format?.url,
      author: info.basic_info.author
    };
  } catch (error) {
    console.error('Video info error:', error);
    return { error: error.message };
  }
});

ipcMain.handle('get-channel-videos', async (event, channelId) => {
  if (!youtube) return { error: 'YouTube not initialized' };
  
  try {
    const channel = await youtube.getChannel(channelId);
    const videosResult = await channel.getVideos();
    
    const videos = videosResult.videos.map(video => ({
      id: video.id,
      title: video.title?.text || video.title,
      author: video.author?.name || video.author?.text || video.channel?.name || 'Unknown Channel',
      duration: video.duration?.text || '',
      thumbnail: video.thumbnails?.[0]?.url || ''
    }));
    
    return { videos };
  } catch (error) {
    console.error('Channel videos error:', error);
    return { error: error.message };
  }
});

ipcMain.handle('get-playlist-videos', async (event, playlistId) => {
  if (!youtube) return { error: 'YouTube not initialized' };
  
  try {
    const playlist = await youtube.getPlaylist(playlistId);
    
    const videos = playlist.videos.map(video => ({
      id: video.id,
      title: video.title?.text || video.title,
      author: video.author?.name || video.author?.text || video.channel?.name || 'Unknown Channel',
      duration: video.duration?.text || '',
      thumbnail: video.thumbnails?.[0]?.url || ''
    }));
    
    return { videos };
  } catch (error) {
    console.error('Playlist videos error:', error);
    return { error: error.message };
  }
});

ipcMain.on('minimize-window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.minimize();
});

ipcMain.on('close-window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.close();
});

ipcMain.handle('toggle-always-on-top', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    const isOnTop = win.isAlwaysOnTop();
    win.setAlwaysOnTop(!isOnTop);
    return !isOnTop;
  }
  return false;
});

ipcMain.handle('download-video', async (event, videoId) => {
  if (!youtube) return { error: 'YouTube not initialized' };
  
  try {
    const info = await youtube.getInfo(videoId);
    console.log('Video info loaded for:', info.basic_info.title);
    
    // Debug available formats
    console.log('Available streaming data formats:', info.streaming_data?.formats?.length || 0);
    console.log('Available adaptive formats:', info.streaming_data?.adaptive_formats?.length || 0);
    
    // Debug format details
    if (info.streaming_data?.formats) {
      console.log('Streaming formats:', info.streaming_data.formats.map(f => ({
        itag: f.itag,
        quality: f.quality_label || f.quality,
        container: f.container,
        hasAudio: f.hasAudio,
        hasVideo: f.hasVideo,
        hasUrl: !!f.url
      })));
    }
    
    if (info.streaming_data?.adaptive_formats) {
      console.log('Adaptive formats:', info.streaming_data.adaptive_formats.slice(0, 3).map(f => ({
        itag: f.itag,
        quality: f.quality_label || f.quality,
        container: f.container,
        hasAudio: f.hasAudio,
        hasVideo: f.hasVideo,
        hasUrl: !!f.url
      })));
    }
    
    let format = null;
    
    // Strategy 1: Try different quality levels with video+audio
    const qualities = ['medium', 'low', 'high', 'highest'];
    for (const quality of qualities) {
      try {
        format = info.chooseFormat({ quality, type: 'video+audio' });
        if (format) {
          console.log(`Found format with quality: ${quality}`);
          break;
        }
      } catch (e) {
        console.log(`No ${quality} quality video+audio format`);
      }
    }
    
    // Strategy 2: Try video formats without audio requirement
    if (!format) {
      for (const quality of qualities) {
        try {
          format = info.chooseFormat({ quality });
          if (format) {
            console.log(`Found video format with quality: ${quality}`);
            break;
          }
        } catch (e) {
          console.log(`No ${quality} quality video format`);
        }
      }
    }
    
    // Strategy 3: Get any available format directly (only with URLs)
    if (!format) {
      const allFormats = [
        ...(info.streaming_data?.formats || []),
        ...(info.streaming_data?.adaptive_formats || [])
      ];
      
      // Only use formats that have URLs
      const usableFormats = allFormats.filter(f => f.url);
      console.log('Formats with URLs:', usableFormats.length, 'out of', allFormats.length);
      
      // Prefer formats with video and audio, then video only
      format = usableFormats.find(f => f.hasVideo && f.hasAudio) || 
               usableFormats.find(f => f.hasVideo) ||
               usableFormats[0]; // Any format as last resort
      
      if (format) {
        console.log('Using direct format:', format.itag, format.quality_label || format.quality);
      }
    }
    
    if (!format || !format.url) {
      console.error('No downloadable format found');
      console.log('Total formats checked:', 
        (info.streaming_data?.formats?.length || 0) + 
        (info.streaming_data?.adaptive_formats?.length || 0)
      );
      return { error: 'No downloadable format available for this video' };
    }
    
    console.log('Selected format:', {
      itag: format.itag,
      quality: format.quality_label || format.quality,
      container: format.container,
      hasVideo: format.hasVideo,
      hasAudio: format.hasAudio
    });

    // Clean filename using utility function and proper extension
    const cleanTitle = sanitizeFilename(info.basic_info.title || 'Unknown Video');
    const extension = format.container === 'webm' ? 'webm' : 'mp4';
    const filename = `${cleanTitle}.${extension}`;
    
    return { 
      title: info.basic_info.title,
      downloadUrl: format.url,
      filename: filename,
      filesize: format.content_length || 0
    };
  } catch (error) {
    console.error('Download error:', error);
    return { error: error.message };
  }
});

ipcMain.handle('download-file-simple', async (event, videoId, filepath) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('Attempting simple download for:', videoId);
      
      // Use youtubei.js to get the video info but extract URL manually
      if (!youtube) {
        reject({ error: 'YouTube not initialized' });
        return;
      }
      
      const info = await youtube.getInfo(videoId);
      
      // Find the best format with URL
      const allFormats = [
        ...(info.streaming_data?.formats || []),
        ...(info.streaming_data?.adaptive_formats || [])
      ];
      
      // Get formats that have URLs
      const validFormats = allFormats.filter(f => f.url);
      console.log('Valid formats found:', validFormats.length);
      
      if (validFormats.length === 0) {
        reject({ error: 'No downloadable formats available' });
        return;
      }
      
      // Pick the first valid format
      const format = validFormats[0];
      console.log('Using simple format:', format.itag, format.quality_label || format.quality);
      
      // Simple fetch download
      const response = await fetch(format.url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://www.youtube.com/'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const totalBytes = parseInt(response.headers.get('content-length') || 0);
      const file = fs.createWriteStream(filepath);
      let downloadedBytes = 0;
      
      const reader = response.body.getReader();
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        file.write(value);
        downloadedBytes += value.length;
        
        const progress = totalBytes > 0 ? (downloadedBytes / totalBytes) * 100 : 0;
        event.sender.send('download-progress', { progress, downloadedBytes, totalBytes });
      }
      
      file.end();
      console.log('Simple download completed');
      resolve({ success: true, filepath });
      
    } catch (error) {
      console.error('Simple download error:', error);
      reject({ error: error.message });
    }
  });
});

ipcMain.handle('download-file-ytdl', async (event, videoId, filepath) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('Attempting ytdl-core download for:', videoId);
      
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      
      // Check if video is available
      const info = await ytdl.getInfo(videoUrl);
      console.log('YTDL info loaded:', info.videoDetails.title);
      
      const format = ytdl.chooseFormat(info.formats, { 
        quality: 'lowest',
        filter: 'audioandvideo' 
      }) || ytdl.chooseFormat(info.formats, { 
        quality: 'lowest'
      }) || info.formats[0];
      
      if (!format) {
        reject({ error: 'No suitable format found with ytdl-core' });
        return;
      }
      
      console.log('YTDL selected format:', format.itag, format.qualityLabel);
      
      const file = fs.createWriteStream(filepath);
      let downloadedBytes = 0;
      const totalBytes = parseInt(format.contentLength || 0);
      
      const downloadStream = ytdl.downloadFromInfo(info, { format });
      
      downloadStream.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        const progress = totalBytes > 0 ? (downloadedBytes / totalBytes) * 100 : 0;
        event.sender.send('download-progress', { progress, downloadedBytes, totalBytes });
      });
      
      downloadStream.on('error', (err) => {
        console.error('YTDL download error:', err);
        file.close();
        fs.unlink(filepath, () => {});
        reject({ error: err.message });
      });
      
      downloadStream.on('end', () => {
        console.log('YTDL download completed');
        file.close();
        resolve({ success: true, filepath });
      });
      
      downloadStream.pipe(file);
      
    } catch (error) {
      console.error('YTDL setup error:', error);
      reject({ error: error.message });
    }
  });
});

ipcMain.handle('download-file-stream', async (event, videoId, filepath) => {
  if (!youtube) return { error: 'YouTube not initialized' };
  
  return new Promise(async (resolve, reject) => {
    try {
      console.log('Attempting stream download for:', videoId);
      const info = await youtube.getInfo(videoId);
      
      // Find format with URL
      const allFormats = [
        ...(info.streaming_data?.formats || []),
        ...(info.streaming_data?.adaptive_formats || [])
      ];
      
      const format = allFormats.find(f => f.url && f.hasVideo);
      if (!format) {
        reject({ error: 'No streamable format with URL found' });
        return;
      }
      
      console.log('Using format for streaming:', format.itag, format.quality_label || format.quality);
      
      // Use the format URL directly with proper streaming
      const file = fs.createWriteStream(filepath);
      let downloadedBytes = 0;
      const totalBytes = parseInt(format.content_length || 0);
      
      // Create download stream using info.download() method
      const downloadStream = info.download({ format });
      
      downloadStream.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        const progress = totalBytes > 0 ? (downloadedBytes / totalBytes) * 100 : 0;
        event.sender.send('download-progress', { progress, downloadedBytes, totalBytes });
      });
      
      downloadStream.on('error', (err) => {
        console.error('Stream download error:', err);
        file.close();
        fs.unlink(filepath, () => {});
        reject({ error: err.message });
      });
      
      downloadStream.on('end', () => {
        console.log('Stream download completed');
        file.close();
        resolve({ success: true, filepath });
      });
      
      downloadStream.pipe(file);
      
    } catch (error) {
      console.error('Stream setup error:', error);
      reject({ error: error.message });
    }
  });
});

ipcMain.handle('download-file', async (event, url, filepath) => {
  return new Promise((resolve, reject) => {
    console.log('Downloading to:', filepath);
    console.log('Download URL:', url);
    
    // Ensure directory exists
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const protocol = url.startsWith('https') ? https : http;
    const urlObj = new URL(url);
    
    // Add proper headers for YouTube downloads
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'video',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'cross-site',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Referer': 'https://www.youtube.com/',
        'Origin': 'https://www.youtube.com'
      }
    };
    
    const file = fs.createWriteStream(filepath);
    let downloadedBytes = 0;
    
    const request = protocol.request(options, (response) => {
      // Handle redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        console.log('Redirecting to:', response.headers.location);
        // Close current stream and retry with new URL
        file.close();
        fs.unlink(filepath, () => {});
        
        // Retry with redirect URL
        const newUrl = new URL(response.headers.location);
        const newProtocol = response.headers.location.startsWith('https') ? https : http;
        const newOptions = {
          ...options,
          hostname: newUrl.hostname,
          port: newUrl.port,
          path: newUrl.pathname + newUrl.search
        };
        const newRequest = newProtocol.request(newOptions, handleResponse);
        newRequest.on('error', (err) => reject({ error: err.message }));
        newRequest.end();
        return;
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(filepath, () => {});
        reject({ error: `HTTP ${response.statusCode}: ${response.statusMessage}` });
        return;
      }
      
      handleResponse(response);
    });
    
    function handleResponse(response) {
      const totalBytes = parseInt(response.headers['content-length'] || '0');
      console.log('Download size:', totalBytes, 'bytes');
      
      response.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        const progress = totalBytes > 0 ? (downloadedBytes / totalBytes) * 100 : 0;
        event.sender.send('download-progress', { progress, downloadedBytes, totalBytes });
      });
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close((err) => {
          if (err) {
            reject({ error: err.message });
          } else {
            console.log('Download completed:', filepath);
            resolve({ success: true, filepath });
          }
        });
      });
      
      file.on('error', (err) => {
        console.error('File write error:', err);
        fs.unlink(filepath, () => {});
        reject({ error: err.message });
      });
    }
    
    request.on('error', (err) => {
      console.error('Download request error:', err);
      reject({ error: err.message });
    });
    
    request.setTimeout(30000, () => {
      request.abort();
      file.close();
      fs.unlink(filepath, () => {});
      reject({ error: 'Download timeout' });
    });
    
    request.end();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
