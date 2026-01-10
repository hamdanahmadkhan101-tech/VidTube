# VidTube Architecture Documentation

## Overview

VidTube follows a modern, scalable architecture with clear separation of concerns, following industry best practices.

## Architecture Patterns

### Backend Architecture

#### 1. **Service Layer Pattern**
- **Controllers**: Handle HTTP requests/responses, minimal logic
- **Services**: Contain all business logic
- **Models**: Database schema and operations
- **Benefits**: Testable, maintainable, reusable

```
Request → Controller → Service → Model → Database
                ↓
         Response (via Controller)
```

#### 2. **Repository Pattern (Partial)**
- Models encapsulate database operations
- Future: Full repository pattern for complex queries

#### 3. **Middleware Chain**
```
Request ID → Logger → Security → Rate Limit → Body Parser → Routes → Error Handler
```

### Frontend Architecture

#### 1. **State Management (Zustand)**
- **Global State**: Auth, Videos, UI preferences
- **Local State**: Component-specific state with useState
- **Server State**: API responses cached in store

#### 2. **Component Structure**
```
Pages → Components → UI Components
         ↓
      Hooks (Custom)
         ↓
      Services (API)
```

#### 3. **Code Splitting**
- Route-based lazy loading
- Vendor chunk separation
- Dynamic imports for large components

## Directory Structure

### Backend

```
src/
├── controllers/          # Request handlers
│   ├── user.controller.js
│   ├── video.controller.js
│   └── ...
│
├── services/            # Business logic
│   └── video.service.js
│
├── models/              # Database models
│   ├── user.model.js
│   ├── video.model.js
│   └── ...
│
├── routes/              # API routes
│   ├── user.routes.js
│   ├── video.routes.js
│   └── ...
│
├── middlewares/         # Express middlewares
│   ├── auth.middleware.js
│   ├── error.middleware.js
│   ├── logger.middleware.js
│   ├── rateLimit.middleware.js
│   ├── security.middleware.js
│   └── validate.middleware.js
│
├── validators/          # Zod schemas
│   ├── user.validator.js
│   ├── video.validator.js
│   └── ...
│
├── errors/              # Custom error classes
│   ├── ValidationError.js
│   ├── NotFoundError.js
│   └── ...
│
└── utils/               # Utilities
    ├── apiError.js
    ├── apiResponse.js
    ├── logger.js
    └── ...
```

### Frontend

```
src/
├── components/          # React components
│   ├── auth/
│   ├── common/
│   ├── layout/
│   ├── social/
│   ├── ui/
│   ├── user/
│   └── video/
│
├── pages/               # Route pages
│   ├── auth/
│   ├── channel/
│   ├── dashboard/
│   ├── video/
│   └── ...
│
├── store/               # Zustand stores
│   ├── authStore.js
│   ├── videoStore.js
│   └── uiStore.js
│
├── hooks/               # Custom hooks
│   ├── useAuth.js
│   ├── useDebounce.js
│   ├── useFetchWithCache.js
│   └── ...
│
├── services/            # API services
│   ├── authService.js
│   ├── videoService.js
│   └── ...
│
├── utils/               # Utilities
│   ├── apiErrorHandler.js
│   ├── formatters.js
│   └── constants.js
│
└── validators/          # Zod schemas
    └── auth.validator.js
```

## Data Flow

### Authentication Flow

```
1. User submits login form
2. Frontend: Validates with Zod
3. Frontend: Calls authService.login()
4. Backend: Validates credentials
5. Backend: Generates JWT tokens
6. Backend: Returns user data + tokens
7. Frontend: Stores tokens in cookies
8. Frontend: Updates authStore
9. Frontend: Redirects to dashboard
```

### Video Upload Flow

```
1. User selects video file
2. Frontend: Validates file (size, type)
3. Frontend: Shows preview
4. User submits form
5. Frontend: Validates metadata with Zod
6. Frontend: Uploads to Cloudinary (with progress)
7. Backend: Receives video URL + metadata
8. Backend: Validates with Zod
9. Backend: Creates Video document
10. Backend: Updates user statistics
11. Backend: Returns video data
12. Frontend: Updates videoStore cache
13. Frontend: Redirects to video page
```

## Database Design

### Collections

#### Users
- Authentication data
- Profile information
- Preferences
- Statistics (aggregated)

#### Videos
- Video metadata
- References to Cloudinary URLs
- Engagement metrics (denormalized)
- Indexes for search/query optimization

#### Relationships
- One-to-Many: User → Videos
- Many-to-Many: Users ↔ Videos (Likes)
- Many-to-Many: Users ↔ Users (Subscriptions)
- One-to-Many: Video → Comments

### Indexing Strategy

- **Users**: `username`, `email`, `createdAt`
- **Videos**: 
  - Compound: `{ owner, isPublished, createdAt }`
  - Text: `{ title: 'text', description: 'text' }`
  - Individual: `views`, `createdAt`
- **Likes**: Compound unique `{ video, likedBy }`
- **Comments**: `{ video, createdAt }`

## Security Architecture

### Authentication
- JWT-based stateless authentication
- Access tokens (short-lived)
- Refresh tokens (long-lived, stored in DB)
- Secure cookie storage

### Authorization
- Role-based access control (future)
- Resource ownership checks
- Protected routes middleware

### Input Validation
- Zod schemas on both frontend and backend
- Type-safe validation
- Automatic sanitization

### Security Headers
- Helmet.js for security headers
- CORS configuration
- Rate limiting per endpoint type

## Performance Optimization

### Backend
- Database indexing (50-80% query improvement)
- Aggregation pipelines for complex queries
- Response caching (future: Redis)
- Query optimization (select fields)

### Frontend
- Code splitting (route-based)
- Lazy loading (images, components)
- Response caching (Zustand store)
- Debounced search inputs
- Optimistic UI updates

## Error Handling

### Backend
- Custom error classes (ValidationError, NotFoundError, etc.)
- Centralized error middleware
- Request ID tracking
- Winston logging

### Frontend
- Error boundaries (route-level)
- Centralized error handler
- User-friendly error messages
- Retry mechanisms

## API Response Format

### Success Response
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": { ... },
  "requestId": "uuid"
}
```

### Error Response
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "error": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ],
  "requestId": "uuid"
}
```

## State Management

### Zustand Stores

#### AuthStore
- User data
- Authentication status
- Login/logout/register actions
- Persistent (localStorage)

#### VideoStore
- Video list cache
- Current video
- Search filters
- Pagination state
- Cache management

#### UIStore
- Theme preferences
- Player settings (volume, muted)
- Sidebar state
- Toast queue
- Persistent (localStorage)

## Testing Strategy (Future)

### Backend
- Unit tests: Services, utilities
- Integration tests: API endpoints
- E2E tests: Critical user flows

### Frontend
- Unit tests: Components, hooks
- Integration tests: User interactions
- E2E tests: Complete user journeys

## Deployment Architecture

### Recommended Setup
- **Frontend**: Vercel / Netlify / Cloudflare Pages
- **Backend**: Railway / Render / DigitalOcean
- **Database**: MongoDB Atlas
- **Storage**: Cloudinary
- **CDN**: Cloudflare (optional)

### Environment Variables
- Separate configs for dev/staging/prod
- Secrets management
- Feature flags (future)

## Scalability Considerations

### Horizontal Scaling
- Stateless backend (JWT)
- Load balancer ready
- Database connection pooling

### Vertical Scaling
- Efficient database queries
- Indexed collections
- Caching strategy

### Future Enhancements
- Redis for caching
- Message queue for background jobs
- CDN for static assets
- Microservices (if needed)

## Monitoring & Logging

### Current
- Winston logger (structured logs)
- Request ID tracking
- Error logging

### Future
- Application Performance Monitoring (APM)
- Error tracking (Sentry)
- Analytics (user behavior)
- Health check endpoints

---

**Last Updated**: 2024
**Architecture Version**: 1.0
