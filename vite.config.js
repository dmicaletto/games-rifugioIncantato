import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Sostituisci con il nome ESATTO del tuo repository GitHub
  base: '/games-rifugioIncantato/', 
})
