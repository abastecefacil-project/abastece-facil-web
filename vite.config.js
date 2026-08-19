import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'


// https://vite.dev/config/
export default defineConfig( async ({ mode }) => {

  const env = loadEnv(mode, process.cwd());
  
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
      proxy: {
        "/api": {
        target: env.VITE_API_PROXY_TARGET, // backend real
        changeOrigin: true,
        },
      },
    },
    preview: {
      allowedHosts: ['front-abastece-facil.onrender.com'],
      host: '0.0.0.0',
      port: process.env.PORT || 4173,
    }
  };
});