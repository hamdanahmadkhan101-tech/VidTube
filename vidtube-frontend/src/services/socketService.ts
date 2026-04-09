import { io, type Socket } from "socket.io-client";

const rawApiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:8080/api/v1";

const normalizedApiBaseUrl = rawApiBaseUrl.replace(/\/+$/, "");

const getSocketBaseUrl = (apiBaseUrl: string) =>
  apiBaseUrl.replace(/\/api\/v1\/?$/, "");

const SOCKET_BASE_URL = getSocketBaseUrl(normalizedApiBaseUrl);

export interface RealtimeNotificationPayload {
  notificationId: string;
  unreadCount?: number;
  type: string;
  title?: string;
  message?: string;
  createdAt: string;
}

let notificationSocket: Socket | null = null;
let activeToken: string | null = null;
let isNotificationSocketConnected = false;
const connectionStateListeners = new Set<() => void>();

const notifyConnectionStateListeners = () => {
  connectionStateListeners.forEach((listener) => listener());
};

const setSocketConnectionState = (connected: boolean) => {
  if (isNotificationSocketConnected === connected) {
    return;
  }

  isNotificationSocketConnected = connected;
  notifyConnectionStateListeners();
};

const attachSocketLifecycleListeners = (socket: Socket) => {
  socket.on("connect", () => {
    setSocketConnectionState(true);
  });

  socket.on("disconnect", () => {
    setSocketConnectionState(false);
  });

  socket.on("connect_error", () => {
    setSocketConnectionState(false);
  });
};

export const connectNotificationSocket = (token: string) => {
  if (!token) {
    return null;
  }

  if (!notificationSocket) {
    notificationSocket = io(SOCKET_BASE_URL, {
      autoConnect: false,
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10_000,
    });

    attachSocketLifecycleListeners(notificationSocket);
  }

  if (activeToken !== token) {
    activeToken = token;
    notificationSocket.auth = { token };

    if (notificationSocket.connected) {
      notificationSocket.disconnect();
    }
  }

  if (!notificationSocket.connected) {
    notificationSocket.connect();
  }

  return notificationSocket;
};

export const disconnectNotificationSocket = () => {
  if (!notificationSocket) {
    return;
  }

  notificationSocket.disconnect();
  activeToken = null;
  setSocketConnectionState(false);
};

export const getNotificationSocket = () => notificationSocket;

export const getNotificationSocketConnectionState = () =>
  isNotificationSocketConnected;

export const subscribeNotificationSocketConnection = (listener: () => void) => {
  connectionStateListeners.add(listener);
  return () => {
    connectionStateListeners.delete(listener);
  };
};
