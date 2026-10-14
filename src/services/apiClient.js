import axios from "axios";
import { lerTokenValido, limparSessao } from '../utils/sessao'
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
    const tinhaToken = !!localStorage.getItem('token');
    const token = lerTokenValido();
    if (tinhaToken && !token) {
      window.location.replace('/login');
      throw new axios.CanceledError('Sessão expirada');
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

apiPrivate.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401) {
    limparSessao();
    window.location.replace('/login');
  }
  return Promise.reject(error);
});

export default apiPublic
