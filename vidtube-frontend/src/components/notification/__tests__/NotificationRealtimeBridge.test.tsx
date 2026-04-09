import { act, render, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from "vitest";
import { NotificationRealtimeBridge } from "../NotificationRealtimeBridge";

type EventHandler = (...args: unknown[]) => void;

const connectNotificationSocketMock = vi.fn();
const disconnectNotificationSocketMock = vi.fn();
const getNotificationSocketMock = vi.fn();
const useAuthStoreMock = vi.fn();

vi.mock("../../../services/socketService", () => ({
  connectNotificationSocket: (...args: unknown[]) =>
    connectNotificationSocketMock(...args),
  disconnectNotificationSocket: (...args: unknown[]) =>
    disconnectNotificationSocketMock(...args),
  getNotificationSocket: (...args: unknown[]) =>
    getNotificationSocketMock(...args),
}));

vi.mock("../../../store/authStore", () => ({
  useAuthStore: () => useAuthStoreMock(),
}));

const createBridgeHarness = () => {
  const socketHandlers = new Map<string, EventHandler>();
  const managerHandlers = new Map<string, EventHandler>();

  const socket = {
    on: vi.fn((event: string, handler: EventHandler) => {
      socketHandlers.set(event, handler);
      return socket;
    }),
    off: vi.fn((event: string, handler: EventHandler) => {
      if (socketHandlers.get(event) === handler) {
        socketHandlers.delete(event);
      }
      return socket;
    }),
    io: {
      on: vi.fn((event: string, handler: EventHandler) => {
        managerHandlers.set(event, handler);
      }),
      off: vi.fn((event: string, handler: EventHandler) => {
        if (managerHandlers.get(event) === handler) {
          managerHandlers.delete(event);
        }
      }),
    },
  };

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const invalidateQueriesSpy = vi
    .spyOn(queryClient, "invalidateQueries")
    .mockResolvedValue(undefined);
  const setQueryDataSpy = vi.spyOn(queryClient, "setQueryData");

  connectNotificationSocketMock.mockReturnValue(socket);
  getNotificationSocketMock.mockReturnValue(socket);

  const view = render(
    <QueryClientProvider client={queryClient}>
      <NotificationRealtimeBridge />
    </QueryClientProvider>,
  );

  return {
    ...view,
    socket,
    socketHandlers,
    managerHandlers,
    invalidateQueriesSpy,
    setQueryDataSpy,
  };
};

const countInvalidationsFor = (
  invalidateQueriesSpy: Mock,
  queryKey: string[],
) =>
  invalidateQueriesSpy.mock.calls.filter(
    ([options]) =>
      JSON.stringify(options?.queryKey) === JSON.stringify(queryKey),
  ).length;

describe("NotificationRealtimeBridge", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useAuthStoreMock.mockReturnValue({
      isAuthenticated: true,
      user: { _id: "user-1" },
    });

    localStorage.setItem(
      "auth-storage",
      JSON.stringify({
        state: {
          user: {
            accessToken: "token-123",
          },
        },
      }),
    );
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("dedupes repeated notification:new payloads", async () => {
    const { socketHandlers, invalidateQueriesSpy, setQueryDataSpy, unmount } =
      createBridgeHarness();

    await waitFor(() => {
      expect(connectNotificationSocketMock).toHaveBeenCalledWith("token-123");
    });

    const notificationHandler = socketHandlers.get("notification:new");
    expect(notificationHandler).toBeTypeOf("function");

    const payload = {
      notificationId: "notif-1",
      unreadCount: 7,
      type: "like",
      createdAt: new Date().toISOString(),
    };

    act(() => {
      notificationHandler?.(payload);
      notificationHandler?.(payload);
    });

    expect(setQueryDataSpy).toHaveBeenCalledTimes(1);
    expect(setQueryDataSpy).toHaveBeenCalledWith(["unreadCount"], 7);
    expect(
      countInvalidationsFor(invalidateQueriesSpy as Mock, ["notifications"]),
    ).toBe(1);
    expect(
      countInvalidationsFor(invalidateQueriesSpy as Mock, ["unreadCount"]),
    ).toBe(0);

    unmount();
  });

  it("re-syncs notifications and unread count on reconnect", async () => {
    const { managerHandlers, invalidateQueriesSpy, unmount } =
      createBridgeHarness();

    await waitFor(() => {
      expect(connectNotificationSocketMock).toHaveBeenCalledWith("token-123");
    });

    const reconnectHandler = managerHandlers.get("reconnect");
    expect(reconnectHandler).toBeTypeOf("function");

    act(() => {
      reconnectHandler?.();
    });

    expect(
      countInvalidationsFor(invalidateQueriesSpy as Mock, ["notifications"]),
    ).toBe(1);
    expect(
      countInvalidationsFor(invalidateQueriesSpy as Mock, ["unreadCount"]),
    ).toBe(1);

    unmount();
  });
});
