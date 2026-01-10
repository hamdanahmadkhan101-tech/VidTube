# VidTube Backend API

Express 5 backend API for VidTube video sharing platform.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
# Copy .env.example to .env and fill in values
cp .env.example .env  # Or create .env manually

# Start development server
npm run dev

# Start production server
npm start
```

## Environment Variables

Create a `.env` file in the `vidtube-backend` directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/vidtube
JWT_SECRET=your-secret-key-minimum-32-characters-long
JWT_REFRESH_SECRET=your-refresh-secret-key-different-from-jwt-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

See [.env.example](../.env.example) for a template.

## API Documentation

See [../API_DOCUMENTATION.md](../API_DOCUMENTATION.md) for complete API reference.

## Architecture

- **Controllers**: Handle HTTP requests/responses
- **Services**: Business logic layer
- **Models**: MongoDB schemas with Mongoose
- **Routes**: API endpoint definitions
- **Middlewares**: Auth, validation, error handling, logging, security
- **Validators**: Zod schemas for input validation

## Project Structure

```
src/
├── controllers/      # Request handlers
├── services/         # Business logic
├── models/           # Database models
├── routes/           # API routes
├── middlewares/      # Express middlewares
│   ├── auth.middleware.js
│   ├── error.middleware.js
│   ├── logger.middleware.js
│   ├── rateLimit.middleware.js
│   ├── security.middleware.js
│   └── validate.middleware.js
├── validators/       # Zod validation schemas
├── errors/           # Custom error classes
└── utils/            # Utility functions
```

## Available Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Key Features

- ✅ JWT Authentication with refresh tokens
- ✅ Video upload to Cloudinary
- ✅ Input validation with Zod (type-safe)
- ✅ Rate limiting (general, auth, upload)
- ✅ Security headers (Helmet)
- ✅ Request logging (Winston)
- ✅ Centralized error handling
- ✅ Database indexing for performance (50-80% improvement)
- ✅ Request ID tracking
- ✅ Health check endpoint

## Security

See [../SECURITY.md](../SECURITY.md) for comprehensive security documentation.

Key security features:
- JWT-based authentication
- Rate limiting
- Input validation & sanitization
- Security headers (Helmet)
- CORS configuration
- Password hashing (bcrypt)

## Dependencies

### Main Dependencies
- `express@5` - Web framework
- `mongoose` - MongoDB ODM
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing
- `cloudinary` - Video/image hosting
- `zod` - Schema validation
- `winston` - Logging
- `helmet` - Security headers
- `express-rate-limit` - Rate limiting
- `multer` - File upload handling
- `mongoose-aggregate-paginate-v2` - Pagination

## API Endpoints

### Health Check
- `GET /health` - Health check endpoint

### User Endpoints
- `POST /api/v1/users/register` - Register user
- `POST /api/v1/users/login` - Login
- `GET /api/v1/users/current` - Get current user
- `PATCH /api/v1/users/profile` - Update profile
- `POST /api/v1/users/change-password` - Change password

### Video Endpoints
- `GET /api/v1/videos` - Get all videos (paginated)
- `GET /api/v1/videos/:videoId` - Get video by ID
- `GET /api/v1/videos/search` - Search videos
- `POST /api/v1/videos/upload` - Upload video
- `PATCH /api/v1/videos/:videoId` - Update video
- `DELETE /api/v1/videos/:videoId` - Delete video
- `GET /api/v1/videos/user/:userId` - Get user's videos

### Like Endpoints
- `POST /api/v1/likes/video/:videoId` - Like/unlike video
- `GET /api/v1/likes/user` - Get user's liked videos

### Comment Endpoints
- `GET /api/v1/comments/video/:videoId` - Get video comments
- `POST /api/v1/comments/video/:videoId` - Create comment
- `PATCH /api/v1/comments/:commentId` - Update comment
- `DELETE /api/v1/comments/:commentId` - Delete comment

### Subscription Endpoints
- `POST /api/v1/subscriptions/:channelId` - Subscribe/unsubscribe
- `GET /api/v1/subscriptions/user` - Get user subscriptions
- `GET /api/v1/subscriptions/channel/:channelId` - Get channel subscribers

For detailed API documentation, see [API_DOCUMENTATION.md](../API_DOCUMENTATION.md).

## Response Format

### Success Response
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": { ... },
  "requestId": "uuid-string"
}
```

### Error Response
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error message",
  "error": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ],
  "requestId": "uuid-string"
}
```

## Rate Limiting

- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 requests per hour per IP
- **Upload**: 2 uploads per hour per IP

## Logging

Logs are written to:
- Console (development)
- `logs/combined.log` (all logs)
- `logs/error.log` (errors only)
- `logs/exceptions.log` (unhandled exceptions)
- `logs/rejections.log` (unhandled promise rejections)

## Related Documentation

- [Main README](../README.md) - Project overview
- [API Documentation](../API_DOCUMENTATION.md) - Complete API reference
- [Architecture](../ARCHITECTURE.md) - Architecture details
- [Security](../SECURITY.md) - Security implementation
- [Deployment](../DEPLOYMENT.md) - Deployment guide

## License

[Add your license]
