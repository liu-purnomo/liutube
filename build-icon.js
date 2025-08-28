// Simple script to run electron-icon-maker CLI
const { exec } = require('child_process');

console.log('🔨 Generating Electron icons...');

exec('npx electron-icon-maker --input=./assets/logo.png --output=./build/', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error generating icons:', error);
    return;
  }
  
  console.log(stdout);
  console.log('✅ Icons generated successfully!');
  console.log('📁 Icons created in ./build/ folder');
  console.log('🎯 Icons for Windows: ./build/icons/win/icon.ico');
  console.log('🎯 Icons for macOS: ./build/icons/mac/icon.icns');
  console.log('🎯 PNG icons: ./build/icons/png/');
});