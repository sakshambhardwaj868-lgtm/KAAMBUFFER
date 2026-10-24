import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { geminiServerPlugin, ensureServerEnvLoaded } from './server/vitePlugin.ts'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables from root .env/.env.local for server-side handlers
  const env = loadEnv(mode, process.cwd(), '');
  if (env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY) {
    process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
  }
  if (env.GOOGLE_API_KEY && !process.env.GOOGLE_API_KEY) {
    process.env.GOOGLE_API_KEY = env.GOOGLE_API_KEY;
  }
  ensureServerEnvLoaded();

  return {
    plugins: [
      react(),
      tailwindcss(),
      geminiServerPlugin(),
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules/@supabase')) {
              return 'supabase';
            }
            if (
              id.includes('node_modules/react') ||
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/react-router-dom')
            ) {
              return 'vendor';
            }
          },
        },
      },
    },
  };
})
