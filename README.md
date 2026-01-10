# VidTube - Video Sharing Platform

A modern, full-stack video sharing platform built with React 19, Express 5, and MongoDB. Production-ready with industry best practices.

## 🚀 Features

- **Video Management**: Upload, stream, and manage videos
- **User Authentication**: Secure JWT-based authentication
- **Social Features**: Likes, comments, subscriptions, notifications
- **Search & Discovery**: Advanced search with filters and sorting
- **User Profiles**: Customizable channel pages with analytics
- **Responsive Design**: Modern UI with dark theme, fully responsive
- **Performance Optimized**: Code splitting, lazy loading, caching
- **Accessibility**: WCAG AA compliant, full keyboard navigation

## 📋 Tech Stack

### Frontend
- **React 19** - Latest React with concurrent features
- **Vite** - Next-generation build tool
- **Tailwind CSS 4** - Utility-first CSS framework
- **Zustand** - Lightweight state management
- **React Router DOM** - Client-side routing
- **React Hook Form + Zod** - Form validation
- **Axios** - HTTP client
- **React Hot Toast** - Toast notifications

### Backend
- **Node.js** - JavaScript runtime
- **Express 5** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Cloudinary** - Video & image hosting
- **Winston** - Logging
- **Helmet** - Security headers
- **Express Rate Limit** - Rate limiting
- **Zod** - Schema validation

## 🏗️ Project Structure

```
vidtube/
├── vidtube-backend/          # Express API server
│   ├── src/
│   │   ├── controllers/      # Route controllers
│   │   ├── services/         # Business logic layer
│   │   ├── models/           # MongoDB models
│   │   ├── routes/           # API routes
│   │   ├── middlewares/      # Express middlewares
│   │   ├── validators/       # Zod validation schemas
│   │   ├── errors/           # Custom error classes
│   │   └── utils/            # Utility functions
│   └── package.json
│
├── vidtube-frontend/         # React frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Route pages
│   │   ├── store/            # Zustand stores
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API service layer
│   │   ├── utils/            # Utility functions
│   │   └── validators/       # Zod validation schemas
│   └── package.json
│
└── README.md                 # This file
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB database (local or cloud)
- Cloudinary account (for video/image hosting)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Vidtube
   ```

2. **Install backend dependencies**
   ```bash
   cd vidtube-backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../vidtube-frontend
   npm install
   ```

4. **Configure environment variables**

   Create `.env` in `vidtube-backend/`:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/vidtube
   JWT_SECRET=your-secret-key
   JWT_REFRESH_SECRET=your-refresh-secret-key
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   NODE_ENV=development
   ```

   Create `.env` in `vidtube-frontend/`:
   ```env
   VITE_API_URL=http://localhost:5000/api/v1
   ```

5. **Start the backend**
   ```bash
   cd vidtube-backend
   npm run dev
   ```

6. **Start the frontend** (in a new terminal)
   ```bash
   cd vidtube-frontend
   npm run dev
   ```

7. **Open your browser**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## 📚 API Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for detailed API endpoints documentation.

## 🏛️ Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture and design patterns.

## 🔒 Security

See [SECURITY.md](./SECURITY.md) for security best practices and implementation details.

## 🧪 Testing

```bash
# Backend tests (when implemented)
cd vidtube-backend
npm test

# Frontend tests (when implemented)
cd vidtube-frontend
npm test
```

## 📦 Build for Production

### Backend
```bash
cd vidtube-backend
npm run build
npm start
```

### Frontend
```bash
cd vidtube-frontend
npm run build
npm run preview  # Preview production build
```

## 🛠️ Development

### Code Quality
- ESLint for linting
- Consistent code formatting
- Type-safe validation with Zod

### Best Practices
- Service layer pattern for business logic
- Custom error classes for consistent error handling
- Centralized state management with Zustand
- Optimistic UI updates
- Code splitting and lazy loading

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## 📄 License

[Add your license here]

## 🙏 Acknowledgments

- Built with modern web technologies
- Following industry best practices
- Production-ready architecture

## 📝 Recent Updates

See [COMPLETE_REFACTORING_SUMMARY.md](./COMPLETE_REFACTORING_SUMMARY.md) for recent refactoring details.

---

**Status**: ✅ Production Ready
**Version**: 1.0.0
