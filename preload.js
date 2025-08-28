const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  searchYoutube: (query, type) => ipcRenderer.invoke('search-youtube', query, type),
  getVideoInfo: (videoId) => ipcRenderer.invoke('get-video-info', videoId),
  getChannelVideos: (channelId) => ipcRenderer.invoke('get-channel-videos', channelId),
  getPlaylistVideos: (playlistId) => ipcRenderer.invoke('get-playlist-videos', playlistId),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  toggleAlwaysOnTop: () => ipcRenderer.invoke('toggle-always-on-top')
});