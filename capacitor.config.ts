import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.prepai.app',
  appName: 'PrepAI',
  webDir: 'out',
  server: {
    url: 'https://upsc-roan-pi.vercel.app',
    cleartext: true
  },
  plugins: {
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true
    }
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#0B1325'
  }
};

export default config;
