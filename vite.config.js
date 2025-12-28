import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANTE: Assicurati che questo sia il nome ESATTO del tuo repository
  base: '/games-rifugioIncantato/',
})
