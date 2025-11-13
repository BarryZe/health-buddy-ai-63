import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.99f0637579164ad7862e82f9b42ec1fb',
  appName: 'PeakForm',
  webDir: 'dist',
  server: {
    url: 'https://99f06375-7916-4ad7-862e-82f9b42ec1fb.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    CapacitorHealthKit: {
      enableBackgroundDelivery: true,
    }
  }
};

export default config;