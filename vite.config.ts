import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // This allows the use of 'process.env.API_KEY' in the client-side code,
  // making the environment variable available as defined in the .env file.
  define: {
    'process.env.API_KEY': `"${process.env.VITE_API_KEY}"`
  }
})