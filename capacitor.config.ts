import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pgbuddy.app',
  appName: 'PG Buddy',
  webDir: 'dist',
  server: {
    // In production, the app loads from the bundled web assets (no URL needed).
    // For dev, uncomment the line below and set your local IP:
    // url: 'http://192.168.x.x:8080',
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#7c3aed',       // Purple brand color
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#7c3aed',
    },
  },
  android: {
    allowMixedContent: true,             // Allow HTTP content in WebView if needed
    backgroundColor: '#ffffff',
  },
};

export default config;
