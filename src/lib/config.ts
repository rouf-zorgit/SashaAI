// Environment Configuration Library
// Centralizes environment detection and configuration

export const ENV = {
  name: import.meta.env.VITE_ENVIRONMENT || 'local',
  isLocal: import.meta.env.VITE_ENVIRONMENT === 'local',
  isStaging: import.meta.env.VITE_ENVIRONMENT === 'staging',
  isProduction: import.meta.env.VITE_ENVIRONMENT === 'production',

  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },

  openai: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  },

  api: {
    url: import.meta.env.VITE_API_URL,
  },
};

// Enable debug logging only in non-production
export const DEBUG = !ENV.isProduction;

// Log environment on startup (non-production only)
if (DEBUG) {
  console.log('🌍 Environment:', ENV.name);
  console.log('📍 API URL:', ENV.api.url);
}
