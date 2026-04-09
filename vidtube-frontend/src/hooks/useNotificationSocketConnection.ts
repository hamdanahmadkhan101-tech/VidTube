import { useSyncExternalStore } from "react";
import {
  getNotificationSocketConnectionState,
  subscribeNotificationSocketConnection,
} from "../services/socketService";

export const useNotificationSocketConnection = () =>
  useSyncExternalStore(
    subscribeNotificationSocketConnection,
    getNotificationSocketConnectionState,
    () => false,
  );
