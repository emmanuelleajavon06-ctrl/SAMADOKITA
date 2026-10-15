import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/lib/store";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
  withCredentials: true,
  // 60 s : sur le plan gratuit Render, le premier appel après extinction (spin-down)
  // attend le redemarrage du backend (~50 s). 15 s coupait ce redemarrage.
  timeout: 60000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: unknown) => void; reject: (reason?: unknown) => void }> = [];

const processQueue = (error: AxiosError | null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(null);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;

    if (status === 403) {
      const message = (error.response?.data as { message?: string })?.message;
      if (message?.includes("suspendu")) {
        useAuthStore.getState().logout();
        if (typeof window !== "undefined") window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    if (status === 401 && !originalRequest._retry && !originalRequest.url?.includes("/auth/")) {
      originalRequest._retry = true;
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        });
      }
      isRefreshing = true;
      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/auth/refresh`,
          { refreshToken }
        );
        useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        }
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError);
        useAuthStore.getState().logout();
        if (typeof window !== "undefined") window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;

/**
 * Message utilisateur convivial pour les erreurs d'authentification.
 * - sans réponse serveur : redemarrage du backend (plan gratuit ~50 s) ;
 * - 429 : limitation de débit ;
 * - sinon : le message métier du backend (validation, identifiants, compte bloqué…).
 */
export function authErrorMessage(error: unknown, fallback: string): string {
  const e = error as { response?: { status?: number; data?: { message?: string | string[] } } };
  if (!e?.response) {
    return "Le serveur ne répond pas encore : sur le plan gratuit, le premier appel après inactivité met ~50 s à réveiller le backend. Réessayez dans un instant.";
  }
  const m = e.response.data?.message;
  if (Array.isArray(m)) return m.join(" · ");
  if (typeof m === "string" && m.length > 0) return m;
  if (e.response.status === 429) {
    return "Trop de tentatives rapprochées. Patientez une minute, puis réessayez.";
  }
  return fallback;
}
