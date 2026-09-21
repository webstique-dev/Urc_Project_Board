import axios from "axios";

// Active request listeners for top progress bar / global activity indicators
const listeners = new Set();
let activeRequests = 0;

function notifyListeners() {
  const isLoading = activeRequests > 0;
  listeners.forEach((fn) => fn(isLoading, activeRequests));
}

export function onNetworkActivityChange(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 60000, // 60s timeout to accommodate free-tier cold starts
});

// Attach the JWT to every request once the user is logged in & track active count
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  
  // Track active network requests unless explicitly bypassed with silentRequest
  if (!config.silentRequest) {
    activeRequests++;
    notifyListeners();
  }
  return config;
});

// Friendly error normalization for network timeouts / cold start delays & decrease active count
api.interceptors.response.use(
  (response) => {
    if (!response.config?.silentRequest) {
      activeRequests = Math.max(0, activeRequests - 1);
      notifyListeners();
    }
    return response;
  },
  (error) => {
    if (!error.config?.silentRequest) {
      activeRequests = Math.max(0, activeRequests - 1);
      notifyListeners();
    }
    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      error.isTimeout = true;
      error.customMessage = "The server took too long to respond (it may still be starting up). Please retry in a moment.";
    } else if (!error.response && error.request) {
      error.isNetworkError = true;
      error.customMessage = "Unable to reach the server. Please check your connection or wait for the server to wake up.";
    }
    return Promise.reject(error);
  }
);

export default api;
