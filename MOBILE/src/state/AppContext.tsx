import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { ApiError, normalizeServer, request } from "../lib/api";

export type User = {
  userId: string;
  fullName: string;
  email: string;
  role: string;
};
type Session = User & { accessToken: string; refreshToken: string };
type ApiOptions = { method?: string; body?: unknown };
type Context = {
  ready: boolean;
  user: User | null;
  serverUrl: string;
  api: <T = any>(path: string, options?: ApiOptions) => Promise<T>;
  login: (email: string, password: string) => Promise<void>;
  register: (body: any) => Promise<void>;
  logout: () => Promise<void>;
  connect: (url: string) => Promise<void>;
};
const AppContext = createContext<Context | null>(null);
const SESSION = "relief-session-v1";
async function readSession() {
  return Platform.OS === "web"
    ? sessionStorage.getItem(SESSION)
    : SecureStore.getItemAsync(SESSION);
}
async function saveSession(value: Session | null) {
  if (Platform.OS === "web") {
    value
      ? sessionStorage.setItem(SESSION, JSON.stringify(value))
      : sessionStorage.removeItem(SESSION);
    return;
  }
  if (value) await SecureStore.setItemAsync(SESSION, JSON.stringify(value));
  else await SecureStore.deleteItemAsync(SESSION);
}
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [serverUrl, setServerUrl] = useState("");
  const session = useRef<Session | null>(null);
  const server = useRef("");
  const refresh = useRef<Promise<Session> | null>(null);
  const generation = useRef(0);
  async function applySession(value: Session | null) {
    await saveSession(value);
    session.current = value;
    setUser(value);
  }
  useEffect(() => {
    (async () => {
      try {
        server.current = (await AsyncStorage.getItem("relief-server-v1")) || "";
        setServerUrl(server.current);
        const raw = await readSession();
        if (raw && server.current) {
          session.current = JSON.parse(raw);
          setUser(session.current);
        }
      } catch {
        await saveSession(null).catch(() => {});
        session.current = null;
      } finally {
        setReady(true);
      }
    })();
  }, []);
  const api = useCallback(
    async <T,>(path: string, options: ApiOptions = {}): Promise<T> => {
      const epoch = generation.current;
      const base = server.current;
      try {
        return await request<T>(base, path, {
          ...options,
          token: session.current?.accessToken,
        });
      } catch (error) {
        if (
          !(error instanceof ApiError) ||
          error.status !== 401 ||
          !session.current?.refreshToken ||
          [
            "/auth/login",
            "/auth/register",
            "/auth/refresh-token",
            "/auth/logout",
          ].includes(path)
        )
          throw error;
        if (!refresh.current)
          refresh.current = (async () => {
            const previous = session.current!;
            const tokens = await request<Session>(base, "/auth/refresh-token", {
              method: "POST",
              body: { refreshToken: previous.refreshToken },
            });
            const next = { ...previous, ...tokens };
            if (generation.current !== epoch)
              throw new Error("Phiên đăng nhập đã thay đổi.");
            await applySession(next);
            return next;
          })().finally(() => {
            refresh.current = null;
          });
        let next: Session;
        try {
          next = await refresh.current;
        } catch (e) {
          if (
            e instanceof ApiError &&
            e.status === 401 &&
            generation.current === epoch
          )
            await applySession(null);
          throw e;
        }
        return request<T>(base, path, { ...options, token: next.accessToken });
      }
    },
    [],
  );
  useEffect(() => {
    if (!ready || !serverUrl) return;
    let disposed = false;
    async function syncProfile() {
      if (!session.current) return;
      const epoch = generation.current;
      try {
        const me = await api<User>("/auth/me");
        if (!disposed && session.current && epoch === generation.current)
          await applySession({ ...session.current, ...me });
      } catch (error) {
        if (
          !disposed &&
          error instanceof ApiError &&
          error.status === 401 &&
          epoch === generation.current
        )
          await applySession(null);
      }
    }
    syncProfile();
    const listener = AppState.addEventListener("change", (state) => {
      if (state === "active") syncProfile();
    });
    return () => {
      disposed = true;
      listener.remove();
    };
  }, [ready, serverUrl, api]);
  async function logout() {
    const token = session.current?.refreshToken;
    generation.current++;
    await applySession(null);
    if (token)
      request(server.current, "/auth/logout", {
        method: "POST",
        body: { refreshToken: token },
      }).catch(() => {});
  }
  async function connect(url: string) {
    const normalized = normalizeServer(url);
    const health = await request<any>(normalized, "/health");
    if (health?.application !== "ReliefConnect" || health?.status !== "ok")
      throw new Error("Địa chỉ này không trả về trạng thái ReliefConnect.");
    if (server.current !== normalized) await logout();
    await AsyncStorage.setItem("relief-server-v1", normalized);
    server.current = normalized;
    setServerUrl(normalized);
  }
  async function login(email: string, password: string) {
    const result = await request<Session>(server.current, "/auth/login", {
      method: "POST",
      body: { email: email.trim(), password },
    });
    generation.current++;
    await applySession(result);
  }
  async function register(body: any) {
    const result = await request<Session>(server.current, "/auth/register", {
      method: "POST",
      body,
    });
    generation.current++;
    await applySession(result);
  }
  return (
    <AppContext.Provider
      value={{ ready, user, serverUrl, api, login, register, logout, connect }}
    >
      {children}
    </AppContext.Provider>
  );
}
export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error("AppProvider missing");
  return value;
}
