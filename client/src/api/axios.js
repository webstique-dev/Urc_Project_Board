import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 60000, // 60s timeout to accommodate free-tier cold starts
});

// Attach the JWT to every request once the user is logged in
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Friendly error normalization for network timeouts / cold start delays
api.interceptors.response.use(
  (response) => response,
  (error) => {
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
