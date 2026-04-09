import 'dotenv/config';
import { createServer } from 'node:http';
import app from './app.js';
import connectDB from './db/dbconnect.js';
import { startCleanupScheduler } from './utils/cleanupTemp.js';
import {
  initializeSocketServer,
  closeSocketServer,
} from './socket/socket.server.js';

connectDB()
  .then(() => {
    // Start temp file cleanup scheduler
    const stopCleanup = startCleanupScheduler();
    console.log('Temp file cleanup scheduler started');

    // Start HTTP + Socket server only after DB connection
    const server = createServer(app);
    initializeSocketServer(server);
    console.log('Socket server initialized');

    server.listen(process.env.PORT || 8080, () => {
      console.log(`Server running on port ${process.env.PORT || 8080}`);
    });

    server.on('error', (error) => {
      console.error('Server error:', error);
      process.exit(1);
    });

    // Graceful shutdown
    const shutdown = () => {
      console.log('Shutting down gracefully...');
      stopCleanup();
      closeSocketServer().finally(() => {
        server.close(() => {
          console.log('Server closed');
          process.exit(0);
        });
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  })
  .catch((error) => {
    console.error('Failed to start application:', error);
  });
