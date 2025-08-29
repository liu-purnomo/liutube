const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');
const os = require('os');

contextBridge.exposeInMainWorld('electronAPI', {
  searchYoutube: (query, type) => ipcRenderer.invoke('search-youtube', query, type),
  getVideoInfo: (videoId) => ipcRenderer.invoke('get-video-info', videoId),
  getChannelVideos: (channelId) => ipcRenderer.invoke('get-channel-videos', channelId),
  getPlaylistVideos: (playlistId) => ipcRenderer.invoke('get-playlist-videos', playlistId),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  toggleAlwaysOnTop: () => ipcRenderer.invoke('toggle-always-on-top'),
  downloadVideo: (videoId) => ipcRenderer.invoke('download-video', videoId),
  downloadFile: (url, filepath) => ipcRenderer.invoke('download-file', url, filepath),
  downloadFileStream: (videoId, filepath) => ipcRenderer.invoke('download-file-stream', videoId, filepath),
  downloadFileYtdl: (videoId, filepath) => ipcRenderer.invoke('download-file-ytdl', videoId, filepath),
  downloadFileSimple: (videoId, filepath) => ipcRenderer.invoke('download-file-simple', videoId, filepath),
  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', callback),
  removeDownloadProgressListener: (callback) => ipcRenderer.removeListener('download-progress', callback),
  getDownloadsPath: () => path.join(os.homedir(), 'Downloads'),
  joinPath: (...paths) => path.join(...paths)
});