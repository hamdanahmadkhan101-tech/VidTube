import 'dotenv/config';
import app from './app.js';
import connectDB from './db/dbconnect.js';

connectDB()
  .then(() => {
    // Start server only after DB connection
    const server = app.listen(process.env.PORT || 8080, () => {
      console.log(`Server running on port ${process.env.PORT || 8080}`);
    });

    server.on('error', (error) => {
      console.error('Server error:', error);
      process.exit(1);
    });
  })
  .catch((error) => {
    console.error('Failed to start application:', error);
  });
