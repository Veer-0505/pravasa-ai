// Global fetch interceptor to automatically route /api and /uploads to VITE_API_URL if configured
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

if (API_BASE) {
  const originalFetch = window.fetch;
  window.fetch = function (resource, init) {
    if (typeof resource === 'string') {
      if (resource.startsWith('/api/') || resource.startsWith('/uploads/')) {
        resource = `${API_BASE}${resource}`;
      }
    }
    return originalFetch(resource, init);
  };
}
