import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.warkop.suduttemu',
  appName: 'Warkop Sudut Temu',
  webDir: 'dist',
  server: {
    url: 'https://sute.web.id',
    cleartext: true,
    androidScheme: 'https'
  }
};

export default config;
