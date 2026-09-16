import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'


// https://vite.dev/config/
export default defineConfig( async ({ mode }) => {

  const env = loadEnv(mode, process.cwd(), '');
  
  const plugins = [vue()];

  if (mode === 'development') {
    const { default: vueDevTools } = await import('vite-plugin-vue-devtools')
    plugins.push(vueDevTools())
  }


  return { 
    plugins, 
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    server: {
      host: '0.0.0.0',
      watch: {
        usePolling: true,
      },
      proxy: {
        "/api": {
        target: env.VITE_API_PROXY_TARGET || 'http://localhost:8081', // backend real
        changeOrigin: true,
        },
      },
    },
    preview: {
      host: '0.0.0.0',
      port: process.env.PORT || 4173,
    }
  };
});
