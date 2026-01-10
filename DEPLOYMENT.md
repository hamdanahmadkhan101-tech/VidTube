# VidTube Deployment Guide

## Pre-Deployment Checklist

### Backend

- [ ] All environment variables configured
- [ ] Database connection string set
- [ ] JWT secrets are strong and unique
- [ ] Cloudinary credentials configured
- [ ] Security headers enabled
- [ ] Rate limiting configured
- [ ] Logging configured
- [ ] Error handling tested
- [ ] Health check endpoint working

### Frontend

- [ ] API URL set for production
- [ ] Build completes without errors
- [ ] All environment variables set
- [ ] Production build tested locally
- [ ] Assets loading correctly

## Environment Setup

### Backend Environment Variables

```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vidtube?retryWrites=true&w=majority
ACCESS_TOKEN_SECRET=your-production-secret-min-32-chars-change-this
REFRESH_TOKEN_SECRET=your-production-refresh-secret-different-from-access
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Frontend Environment Variables

```env
VITE_API_ROOT=https://api.yourdomain.com
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
```

## Deployment Options

### Option 1: Railway (Recommended for Backend)

1. **Connect Repository**

   - Link your GitHub repository
   - Railway will auto-detect Node.js

2. **Configure Environment Variables**

   - Add all required `.env` variables in Railway dashboard

3. **Deploy**

   - Railway will automatically deploy on push
   - Or manually trigger deployment

4. **Custom Domain**
   - Add custom domain in Railway settings
   - Update DNS records

### Option 2: Render

#### Backend (Web Service)

- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment**: Node
- **Add Environment Variables**: All backend env vars

#### Frontend (Static Site)

- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Add Environment Variables**: `VITE_API_URL`

### Option 3: Vercel (Frontend)

1. **Install Vercel CLI**

   ```bash
   npm i -g vercel
   ```

2. **Deploy**

   ```bash
   cd vidtube-frontend
   vercel
   ```

3. **Set Environment Variables**
   - In Vercel dashboard: Settings → Environment Variables
   - Add `VITE_API_URL`

### Option 4: Netlify (Frontend)

1. **Connect Repository**

   - Link GitHub repository
   - Set build directory: `vidtube-frontend`

2. **Build Settings**

   - Build command: `cd vidtube-frontend && npm install && npm run build`
   - Publish directory: `vidtube-frontend/dist`

3. **Environment Variables**
   - Add `VITE_API_URL` in site settings

### Option 5: DigitalOcean App Platform

1. **Create App**

   - Connect repository
   - Auto-detect services

2. **Backend Component**

   - Type: Web Service
   - Build command: `npm install`
   - Run command: `npm start`
   - Environment variables: Backend env vars

3. **Frontend Component**
   - Type: Static Site
   - Build command: `cd vidtube-frontend && npm install && npm run build`
   - Output directory: `vidtube-frontend/dist`
   - Environment variables: `VITE_API_URL`

## Database Setup (MongoDB Atlas)

1. **Create Cluster**

   - Go to MongoDB Atlas
   - Create free tier cluster

2. **Configure Network Access**

   - Add IP address (0.0.0.0/0 for development, specific IPs for production)

3. **Create Database User**

   - Username and password
   - Database User Privileges: Read and write to any database

4. **Get Connection String**
   - Click "Connect" → "Connect your application"
   - Copy connection string
   - Replace `<password>` with your password

## Cloudinary Setup

1. **Create Account**

   - Sign up at cloudinary.com

2. **Get Credentials**

   - Dashboard → Settings → API Keys
   - Copy Cloud Name, API Key, API Secret

3. **Configure Upload Presets**
   - Settings → Upload → Upload presets
   - Create presets for video and image uploads
   - Set upload restrictions (file size, formats)

## Post-Deployment

### 1. Verify Backend

```bash
# Health check
curl https://api.yourdomain.com/health

# Should return:
# {"status": "ok", "timestamp": "..."}
```

### 2. Verify Frontend

- Visit your frontend URL
- Check browser console for errors
- Test authentication flow
- Test video upload

### 3. Monitor Logs

- Check application logs for errors
- Monitor rate limiting
- Check database connections

### 4. SSL/HTTPS

- Ensure HTTPS is enabled
- Verify SSL certificate is valid
- Check security headers
  - If using Vercel, Render, Railway, or similar: HTTPS is automatic on custom domains.
  - If self-hosting behind Nginx: obtain a certificate via Let's Encrypt and proxy to Node. Example:

```nginx
server {
   listen 80;
   server_name api.yourdomain.com;
   return 301 https://$host$request_uri;
}

server {
   listen 443 ssl http2;
   server_name api.yourdomain.com;

   ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
   ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
   ssl_protocols TLSv1.2 TLSv1.3;
   ssl_ciphers HIGH:!aNULL:!MD5;

   location / {
      proxy_pass http://127.0.0.1:8080;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
   }
}
```

In Express, set `app.set('trust proxy', 1)` and keep `NODE_ENV=production` to enable strict security headers.

## Production Optimizations

### Backend

- Enable gzip compression
- Set up CDN for static assets
- Configure database connection pooling
- Set up Redis for caching (optional)
- Configure log rotation
- Set up monitoring (PM2, New Relic, etc.)

### Frontend

- Enable gzip/brotli compression
- Set up CDN for assets
- Configure caching headers
- Enable service worker (optional, for PWA)
- Set up analytics (optional)

## Continuous Deployment

### GitHub Actions (Example)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        # Add Railway deployment step

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        # Add Vercel deployment step
```

## Monitoring & Maintenance

### Health Checks

- Monitor `/health` endpoint
- Set up uptime monitoring (UptimeRobot, Pingdom)
- Configure alerts for downtime

### Performance Monitoring

- Backend: Winston logs, application metrics
- Frontend: Lighthouse scores, Core Web Vitals
- Database: Query performance, connection pool

### Regular Maintenance

- Update dependencies monthly
- Review and rotate secrets quarterly
- Backup database regularly
- Review security logs weekly
- Monitor error rates

## Troubleshooting

### Backend Won't Start

- Check environment variables
- Verify database connection
- Check port availability
- Review logs for errors

### Frontend Build Fails

- Clear node_modules and reinstall
- Check for TypeScript/ESLint errors
- Verify environment variables
- Check Vite configuration

### Database Connection Issues

- Verify MongoDB Atlas network access
- Check connection string format
- Verify credentials
- Check firewall rules

### CORS Errors

- Verify `FRONTEND_URL` in backend
- Check CORS configuration
- Ensure credentials: true in CORS

## Rollback Procedure

### Backend

1. Revert to previous commit
2. Re-deploy previous version
3. Verify health check

### Frontend

1. Revert to previous build
2. Re-deploy from Vercel/Netlify dashboard
3. Clear CDN cache if needed

## Scaling Considerations

### Horizontal Scaling

- Use load balancer for multiple backend instances
- Ensure stateless backend (JWT tokens)
- Use shared session storage if needed

### Database Scaling

- MongoDB Atlas auto-scaling
- Read replicas for read-heavy workloads
- Index optimization

### CDN

- Cloudflare for static assets
- Cloudinary CDN for videos/images
- Edge caching

---

**Last Updated**: 2024
**Deployment Version**: 1.0
