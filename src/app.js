import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import errorMiddleware from './middlewares/error.middleware.js';
import userRoutes from './routes/user.routes.js';
import videoRoutes from './routes/video.routes.js';

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '16kb' }));
app.use(express.static('public'));
app.use(cookieParser());

// ============================================
// ROUTES
// ============================================

app.use('/api/v1/users', userRoutes);
app.use('/api/v1/videos', videoRoutes);

// Error middleware must be LAST
app.use(errorMiddleware);

export default app;
