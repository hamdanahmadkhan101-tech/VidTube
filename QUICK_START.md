# VidTube Quick Start Guide

Get VidTube up and running in 5 minutes!

## Prerequisites

- Node.js 18+ and npm
- MongoDB (local or MongoDB Atlas)
- Cloudinary account (free tier works)

## Step-by-Step Setup

### 1. Clone & Install

```bash
# Clone repository
git clone <repository-url>
cd Vidtube

# Install backend dependencies
cd vidtube-backend
npm install

# Install frontend dependencies
cd ../vidtube-frontend
npm install
```

### 2. Set Up MongoDB

**Option A: MongoDB Atlas (Recommended)**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Create database user
4. Whitelist IP (0.0.0.0/0 for development)
5. Get connection string

**Option B: Local MongoDB**
```bash
# Install MongoDB locally, then:
mongod
# Connection string: mongodb://localhost:27017/vidtube
```

### 3. Set Up Cloudinary

1. Sign up at [Cloudinary](https://cloudinary.com)
2. Get credentials from Dashboard:
   - Cloud Name
   - API Key
   - API Secret

### 4. Configure Environment Variables

**Backend** (`vidtube-backend/.env`):
```env
PORT=5000
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-secret-key-minimum-32-characters-long
JWT_REFRESH_SECRET=your-refresh-secret-different-from-jwt-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

**Frontend** (`vidtube-frontend/.env`):
```env
VITE_API_URL=http://localhost:5000/api/v1
```

### 5. Start Backend

```bash
cd vidtube-backend
npm run dev
```

Backend should be running at: `http://localhost:5000`

### 6. Start Frontend (New Terminal)

```bash
cd vidtube-frontend
npm run dev
```

Frontend should open at: `http://localhost:5173`

## Verify Installation

1. **Check Backend Health**
   ```bash
   curl http://localhost:5000/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

2. **Open Frontend**
   - Visit http://localhost:5173
   - You should see the VidTube homepage

3. **Test Registration**
   - Click "Sign up"
   - Create an account
   - Verify you can log in

## Common Issues

### Backend won't start
- Check MongoDB connection string
- Verify all environment variables are set
- Check if port 5000 is available

### Frontend can't connect to backend
- Verify `VITE_API_URL` is correct
- Check backend is running
- Check CORS configuration

### Database connection errors
- Verify MongoDB is running (if local)
- Check MongoDB Atlas network access settings
- Verify connection string format

### Cloudinary upload errors
- Verify Cloudinary credentials
- Check API key permissions
- Verify file size limits

## Next Steps

- Read [README.md](./README.md) for detailed documentation
- Check [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for API reference
- Review [ARCHITECTURE.md](./ARCHITECTURE.md) for architecture details
- See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment

## Quick Commands Reference

```bash
# Backend
cd vidtube-backend
npm run dev        # Development server
npm start          # Production server
npm run lint       # Lint code

# Frontend
cd vidtube-frontend
npm run dev        # Development server
npm run build      # Production build
npm run preview    # Preview production build
npm run lint       # Lint code
```

## Getting Help

- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) (if exists)
- Review error messages carefully
- Check application logs
- Open an issue on GitHub

---

**Ready to build?** Start creating your video platform! 🚀
