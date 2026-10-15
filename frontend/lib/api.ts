import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";
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
/**
 * File des requêtes 401 arrivées pendant un refresh en cours.
 * Chaque entrée conserve la config d'origine pour REJOUER la requête avec le
 * nouveau jeton (l'ancien code résolvait `null`, ce qui faisait planter tout
 * appelant du type `const { data } = await api.get(...)`).
 */
let failedQueue: Array<{
  config: InternalAxiosRequestConfig;
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, newToken?: string) => {
  failedQueue.forEach(({ config, resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      if (newToken && config.headers) {
        config.headers.Authorization = `Bearer ${newToken}`;
      }
      resolve(api(config));
    }
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
          failedQueue.push({ config: originalRequest, resolve, reject });
        });
      }
      isRefreshing = true;
      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/auth/refresh`,
          { refreshToken },
          // même garde-fou que l'instance principale (réveil backend ~50 s)
          { timeout: 60000 }
        );
        useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        }
        processQueue(null, data.accessToken);
        return api(originalRequest);
      } catch (refreshError) {
        const refreshStatus = (refreshError as AxiosError).response?.status;
        if (refreshStatus === 401 || refreshStatus === 403) {
          // Refresh vraiment révoqué (jeton à usage unique déjà consommé,
          // expiré ou compte bloqué) : déconnexion propre.
          processQueue(refreshError as AxiosError);
          useAuthStore.getState().logout();
          if (typeof window !== "undefined") window.location.href = "/login";
          return Promise.reject(refreshError);
        }
        // Pas de réponse (réveil du backend, coupure réseau) ou erreur serveur
        // (429/5xx) : on CONSERVE la session. La requête échoue normalement,
        // React Query la réessaie, et le prochain 401 relancera le cycle.
        processQueue(refreshError as AxiosError);
        if (!refreshStatus) {
          toast.warning("Le serveur est en cours de réveil (plan gratuit) — nouvelle tentative automatique…");
        }
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
