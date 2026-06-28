import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.prepai.app',
  appName: 'PrepAI',
  webDir: 'out',
  server: {
    url: 'https://upsc-roan-pi.vercel.app',
    cleartext: true
  }
};

export default config;
