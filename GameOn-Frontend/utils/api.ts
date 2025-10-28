import axios from 'axios';
import { ENV } from '@/constants/env';

const apiClient = axios.create({
  baseURL: ENV.GATEWAY_URL,
  headers: { 'Content-Type': 'application/json' },
});


export const api = {
  postJSON: async <T>(path: string, body: any, token?: string): Promise<T> => {
    const res = await apiClient.post<T>(path, body, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return res.data;
  },


  tokenWithPassword: async (email: string, password: string) => {
    const url = `${ENV.KEYCLOAK_URL}/realms/${ENV.KEYCLOAK_REALM}/protocol/openid-connect/token`;

    const form = new URLSearchParams();
    form.append('grant_type', 'password');
    form.append('client_id', ENV.KEYCLOAK_CLIENT_ID);
    form.append('username', email);
    form.append('password', password);

    const res = await axios.post(url, form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    return {
      accessToken: res.data.access_token as string,
      refreshToken: res.data.refresh_token as string,
      expiresIn: res.data.expires_in as number,
      tokenType: res.data.token_type as string,
    };
  },
};
