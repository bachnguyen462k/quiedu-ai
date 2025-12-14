import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Polyfill process.env for the Google GenAI SDK to work in the browser
      'process.env': {
        API_KEY: JSON.stringify(env.API_KEY)
      }
    },
    build: {
      chunkSizeWarningLimit: 1000, // Increase warning limit slightly
      rollupOptions: {
        output: {
          manualChunks: {
            // Split huge libraries into separate chunks
            'vendor-react': ['react', 'react-dom'],
            'vendor-ui': ['lucide-react', 'recharts'],
            'vendor-ai': ['@google/genai']
          }
        }
      }
    }
  };
});