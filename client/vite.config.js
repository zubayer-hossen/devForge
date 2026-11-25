import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  // Keep this in sync with the backend's local default PORT.
  const apiTarget = env.VITE_DEV_API_PROXY_TARGET || 'http://localhost:5001';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': { target: apiTarget, changeOrigin: true },
        '/socket.io': { target: apiTarget, changeOrigin: true, ws: true },
      },
    },
    build: {
      sourcemap: false,
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (/[\\/]node_modules[\\/](recharts|d3-[^\\/]+)[\\/]/.test(id)) return 'charts-vendor';
            if (/[\\/]node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/.test(id)) return 'motion-vendor';
            if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'react-vendor';
          },
        },
      },
    },
  };
});
