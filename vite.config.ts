import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const hindsightBaseUrl = env.VITE_HINDSIGHT_BASE_URL || 'https://api.hindsight.vectorize.io';

  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    server: {
      proxy: {
        '/hindsight-proxy': {
          target: hindsightBaseUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/hindsight-proxy/, ''),
        },
      },
    },
  };
});
