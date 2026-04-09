const createMockIoInstance = () => {
  const emitMock = jest.fn();

  return {
    use: jest.fn(),
    on: jest.fn(),
    to: jest.fn(() => ({ emit: emitMock })),
    sockets: {
      adapter: {
        rooms: new Map(),
      },
    },
    close: jest.fn((callback) => callback()),
    emitMock,
  };
};

const loadSocketModule = async () => {
  jest.resetModules();

  const ioMock = createMockIoInstance();
  const serverConstructorMock = jest.fn(() => ioMock);

  jest.doMock('socket.io', () => ({
    Server: serverConstructorMock,
  }));

  const socketModule = await import('../../socket/socket.server.js');

  return {
    ...socketModule,
    ioMock,
    serverConstructorMock,
  };
};

describe('socket.server diagnostics', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('tracks connection lifecycle and active user rooms', async () => {
    const {
      initializeSocketServer,
      getSocketDiagnostics,
      closeSocketServer,
      ioMock,
    } = await loadSocketModule();

    initializeSocketServer({});

    const connectionCall = ioMock.on.mock.calls.find(
      ([eventName]) => eventName === 'connection'
    );
    expect(connectionCall).toBeDefined();

    const connectionHandler = connectionCall[1];
    let disconnectHandler = null;

    const socket = {
      data: { userId: 'user-1' },
      join: jest.fn((roomName) => {
        ioMock.sockets.adapter.rooms.set(roomName, new Set(['socket-1']));
      }),
      emit: jest.fn(),
      on: jest.fn((eventName, handler) => {
        if (eventName === 'disconnect') {
          disconnectHandler = handler;
        }
      }),
    };

    connectionHandler(socket);

    const afterConnect = getSocketDiagnostics();
    expect(afterConnect.totalConnections).toBe(1);
    expect(afterConnect.activeConnections).toBe(1);
    expect(afterConnect.activeUserRooms).toBe(1);
    expect(afterConnect.lastConnectionAt).toBeTruthy();
    expect(socket.join).toHaveBeenCalledWith('user:user-1');
    expect(socket.emit).toHaveBeenCalledWith('socket:connected', {
      userId: 'user-1',
    });

    expect(disconnectHandler).toEqual(expect.any(Function));
    disconnectHandler();

    const afterDisconnect = getSocketDiagnostics();
    expect(afterDisconnect.activeConnections).toBe(0);
    expect(afterDisconnect.disconnectedConnections).toBe(1);
    expect(afterDisconnect.lastDisconnectAt).toBeTruthy();

    await closeSocketServer();
  });

  test('increments authFailures for unauthorized socket handshake', async () => {
    const {
      initializeSocketServer,
      getSocketDiagnostics,
      closeSocketServer,
      ioMock,
    } = await loadSocketModule();

    initializeSocketServer({});

    const authMiddleware = ioMock.use.mock.calls[0][0];
    const next = jest.fn();

    await authMiddleware(
      {
        handshake: {},
        data: {},
      },
      next
    );

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].message).toBe('Unauthorized');
    expect(getSocketDiagnostics().authFailures).toBe(1);

    await closeSocketServer();
  });

  test('tracks emit counts and missing subscribers', async () => {
    const {
      initializeSocketServer,
      emitToUser,
      getSocketDiagnostics,
      closeSocketServer,
      ioMock,
    } = await loadSocketModule();

    initializeSocketServer({});

    const emittedWithoutSubscribers = emitToUser('user-9', 'notification:new', {
      id: 'n1',
    });

    expect(emittedWithoutSubscribers).toBe(false);
    expect(ioMock.to).toHaveBeenCalledWith('user:user-9');
    expect(ioMock.emitMock).toHaveBeenCalledWith('notification:new', {
      id: 'n1',
    });

    const afterFirstEmit = getSocketDiagnostics();
    expect(afterFirstEmit.emittedEvents).toBe(1);
    expect(afterFirstEmit.emittedWithoutSubscribers).toBe(1);
    expect(afterFirstEmit.lastEmitAt).toBeTruthy();

    ioMock.sockets.adapter.rooms.set('user:user-9', new Set(['socket-1']));

    const emittedWithSubscribers = emitToUser('user-9', 'notification:new', {
      id: 'n2',
    });
    expect(emittedWithSubscribers).toBe(true);

    const afterSecondEmit = getSocketDiagnostics();
    expect(afterSecondEmit.emittedEvents).toBe(2);
    expect(afterSecondEmit.emittedWithoutSubscribers).toBe(1);

    await closeSocketServer();
  });
});
