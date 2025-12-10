
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  // FIX: Use '.' instead of process.cwd() to resolve "Property 'cwd' does not exist on type 'Process'" error
  const env = loadEnv(mode, '.', '');
  
  // Use the system PORT if available (Cloud Run), otherwise default to 8080
  const port = parseInt(process.env.PORT || '8080');

  return {
    plugins: [react()],
    define: {
      // This ensures your code using `process.env.API_KEY` works in the browser
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY),
    },
    server: {
      host: '0.0.0.0', // Critical: Expose to network for Docker/Cloud Run
      port: port,
    },
    preview: {
      host: '0.0.0.0', // Critical: Expose to network for Docker/Cloud Run
      port: port,
      allowedHosts: true, // Allow the random Cloud Run URLs
    },
  };
});
