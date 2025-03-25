import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'capacitor-native-audio-test',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
