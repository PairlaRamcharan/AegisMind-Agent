import axios from 'axios';

const rawUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const API_BASE = rawUrl ? `${rawUrl}/api/v1` : '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercept requests to attach Authorization header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Intercept responses for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  me: () => api.get('/auth/me')
};

export const telemetryApi = {
  getLogs: (params) => api.get('/telemetry/logs', { params }),
  getStats: () => api.get('/telemetry/stats'),
  ingest: (data) => api.post('/telemetry/ingest', data),
  simulateExploit: (attackType) => api.post('/telemetry/simulate-exploit', { attackType })
};

export const quarantineApi = {
  getList: () => api.get('/quarantine'),
  isolate: (data) => api.post('/quarantine/isolate', data),
  release: (id) => api.delete(`/quarantine/release/${id}`)
};

export const remediationApi = {
  getVulnerabilities: () => api.get('/remediation/vulnerabilities'),
  generatePatch: (vulnerabilityId) => api.post('/remediation/generate-patch', { vulnerabilityId }),
  verifyPatch: (vulnerabilityId, patchedCode) => api.post('/remediation/verify-patch', { vulnerabilityId, patchedCode }),
  applyPatch: (patchId) => api.post('/remediation/apply-patch', { patchId })
};

export const settingsApi = {
  getSettings: () => api.get('/settings'),
  updateSettings: (data) => api.post('/settings', data)
};

export default api;
