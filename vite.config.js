import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import packageJson from './package.json'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANTE: Assicurati che questo sia il nome ESATTO del tuo repository
  base: '/games-rifugioIncantato/',
  define: {
    // Rendiamo la versione accessibile globalmente nell'app
    'import.meta.env.PACKAGE_VERSION': JSON.stringify(packageJson.version)
  }
})
