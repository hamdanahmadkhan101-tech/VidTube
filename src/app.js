import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import errormiddleware from './middlewares/error.middleware.js';

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

// Routes imports will go here
import userRoutes from './routes/user.routes.js';





// Routes usage will go here
app.use('/api/v1/users', userRoutes);


// Error middleware must be LAST
app.use(errormiddleware);

export default app;
