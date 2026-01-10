import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { useAuth } from "@clerk/clerk-expo";
import { useMemo } from "react";
import { AXIOS_BEARER } from "@/constants/hook-constants";

export const useAxiosWithClerk = () => {
  const { getToken } = useAuth();

  return useMemo(() => {
    const axiosInstance = axios.create({
      baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
    });

    attachAxiosInterceptor(axiosInstance, getToken);
    return axiosInstance;
  }, [getToken]);
};

const attachAxiosInterceptor = (
  axiosInstance: AxiosInstance,
  getToken: () => Promise<string | null>,
) => {
  return axiosInstance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const token = await getToken();

      if (token) {
        config.headers.Authorization = `${AXIOS_BEARER} ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error),
  );
};

const API = "api";

enum VERSIONING {
  v1 = "v1",
}

enum SERVICE {
  USER = "user",
  TEAMS = "teams",
}

const buildUserRoute = (version: string, service: string, path?: string) => {
  const base = `${API}/${version}/${service}`;
  return path ? `${base}/${path}` : base;
};

export const GO_USER_SERVICE_ROUTES = {
  TEST: buildUserRoute(VERSIONING.v1, SERVICE.USER, "test"),
  CREATE: buildUserRoute(VERSIONING.v1, SERVICE.USER, "create"),
};

export const GO_TEAM_SERVICE_ROUTES = {
  ALL: buildUserRoute(VERSIONING.v1, SERVICE.TEAMS),
  CREATE: buildUserRoute(VERSIONING.v1, SERVICE.TEAMS, "create"),
};
