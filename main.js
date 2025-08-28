const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { Innertube } = require('youtubei.js');

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
      preload: path.join(__dirname, 'preload.js')
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
        author: video.author?.name || 'Unknown',
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
      author: video.author?.name || 'Unknown',
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
      author: video.author?.name || 'Unknown',
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

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
