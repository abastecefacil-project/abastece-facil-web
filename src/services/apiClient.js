import axios from "axios";
const baseURL = import.meta.env.VITE_API_BASE_URL;

export const apiPublic = axios.create({ 
  baseURL,
  headers: {
    "ngrok-skip-browser-warning": "true", // 👈 evita a tela de aviso do ngrok
  },
});

export const apiPrivate = axios.create({ 
  baseURL,
  headers: {
    "ngrok-skip-browser-warning": "true", // 👈 evita a tela de aviso do ngrok
  },
});

apiPrivate.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token"); 
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default apiPublic