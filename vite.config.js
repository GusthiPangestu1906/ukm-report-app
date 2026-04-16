import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Tambahkan baris ini. GANTI 'ukm-report-app' DENGAN NAMA REPOSITORY-MU
  base: '/ukm-report-app/', 
})