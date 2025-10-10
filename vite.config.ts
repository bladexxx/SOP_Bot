import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vitejs.dev/config/
export default defineConfig({
  // FIX: The `@vitejs/plugin-basic-ssl` plugin handles enabling HTTPS, so the `server.https` property is not needed and causes a type conflict. The `server` config object has been removed.
  plugins: [react(), basicSsl()],
  // This allows the use of 'process.env' in the client-side code,
  // making the environment variable available as defined in the .env file.
  define: {
    'process.env.API_KEY': `"${process.env.VITE_API_KEY}"`,
    'process.env.AI_PROVIDER': `"${process.env.VITE_AI_PROVIDER}"`,
    // FIX: Corrected typo in environment variable name.
    'process.env.AI_GATEWAY_URL': `"${process.env.VITE_AI_GATEWAY_URL}"`,
    'process.env.AI_GATEWAY_API_KEY': `"${process.env.VITE_AI_GATEWAY_API_KEY}"`,
    'process.env.AI_GATEWAY_MODEL': `"${process.env.VITE_AI_GATEWAY_MODEL}"`,
  }
})