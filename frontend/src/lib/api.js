import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import { useMemo } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const createApiClient = (getToken) => {
  const client = axios.create({
    baseURL: API_BASE_URL,
  });

  client.interceptors.request.use(async (config) => {
    try {
      if (getToken) {
        const token = await getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (err) {
      console.error("Error fetching Clerk token", err);
    }
    return config;
  });

  return client;
};

export const useApi = () => {
  const { getToken } = useAuth();

  const api = useMemo(() => {
    return createApiClient(getToken);
  }, [getToken]);

  return api;
};
