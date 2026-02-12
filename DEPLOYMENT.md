# Deployment Guide

This guide covers multiple deployment options for the Academic Calendar Organizer application.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- Git

## Option 1: Deploy to Render (Recommended - Free Tier Available)

### Backend Deployment

1. **Create a Render account** at [render.com](https://render.com)

2. **Create a new Web Service**:
   - Connect your GitHub repository
   - Select the `backend` directory as the root
   - Set build command: `npm install`
   - Set start command: `npm start`

3. **Add Environment Variables**:
   ```
   DATABASE_URL=postgresql://user:password@host:5432/database
   JWT_SECRET=your-secure-jwt-secret
   NODE_ENV=production
   PORT=5000
   ```

4. **Create a PostgreSQL database** on Render:
   - Go to Dashboard → New → PostgreSQL
   - Copy the Internal Database URL to your backend's DATABASE_URL

### Frontend Deployment

1. **Create a new Static Site** on Render:
   - Connect your GitHub repository
   - Select the `frontend` directory as the root
   - Set build command: `npm run build`
   - Set publish directory: `dist`

2. **Add Environment Variables**:
   ```
   VITE_API_URL=https://your-backend.onrender.com
   ```

3. **Update frontend API calls** to use the backend URL

## Option 2: Deploy to Vercel + Railway

### Backend on Railway

1. **Create a Railway account** at [railway.app](https://railway.app)

2. **Deploy from GitHub**:
   - Connect your repository
   - Select the `backend` folder
   - Add a PostgreSQL database

3. **Set Environment Variables**:
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   JWT_SECRET=your-secure-jwt-secret
   NODE_ENV=production
   ```

### Frontend on Vercel

1. **Create a Vercel account** at [vercel.com](https://vercel.com)

2. **Import your repository**:
   - Set Root Directory to `frontend`
   - Framework Preset: Vite

3. **Add Environment Variables**:
   ```
   VITE_API_URL=https://your-backend.railway.app
   ```

## Option 3: Deploy to Heroku

### Prerequisites
- Heroku CLI installed
- Heroku account

### Backend Deployment

```bash
# Login to Heroku
heroku login

# Create Heroku app
cd backend
heroku create your-app-name-backend

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set JWT_SECRET=your-secure-jwt-secret
heroku config:set NODE_ENV=production

# Deploy
git subtree push --prefix backend heroku main
```

### Frontend Deployment

```bash
# Create another Heroku app for frontend
cd frontend
heroku create your-app-name-frontend

# Set buildpack for static sites
heroku buildpacks:set https://github.com/heroku/heroku-buildpack-static.git

# Create static.json for routing
echo '{"root":"dist","routes":{"/**":"index.html"}}' > static.json

# Set environment variable
heroku config:set VITE_API_URL=https://your-app-name-backend.herokuapp.com

# Build and deploy
npm run build
git add . && git commit -m "Build"
git push heroku main
```

## Option 4: Self-Hosted (VPS/Dedicated Server)

### Prerequisites
- Ubuntu 20.04+ server
- Domain name (optional)
- SSL certificate (Let's Encrypt recommended)

### Step 1: Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install PM2 for process management
sudo npm install -g pm2
```

### Step 2: Setup PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE calendar_organizer;
CREATE USER calendar_user WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE calendar_organizer TO calendar_user;
\q
```

### Step 3: Deploy Backend

```bash
# Clone repository
git clone https://github.com/your-username/scheduler.git
cd scheduler/backend

# Install dependencies
npm install --production

# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://calendar_user:your-secure-password@localhost:5432/calendar_organizer
JWT_SECRET=your-secure-jwt-secret
NODE_ENV=production
PORT=5000
EOF

# Run migrations
npm run migrate

# Start with PM2
pm2 start src/server.js --name calendar-backend
pm2 save
pm2 startup
```

### Step 4: Deploy Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
VITE_API_URL=http://your-domain.com/api
EOF

# Build
npm run build

# Copy to Nginx directory
sudo cp -r dist/* /var/www/html/
```

### Step 5: Configure Nginx

```bash
# Create Nginx config
sudo cat > /etc/nginx/sites-available/calendar << EOF
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/html;
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/calendar /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 6: Setup SSL (Optional but Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

## Option 5: Docker Deployment

### Using Docker Compose (Easiest)

```bash
# Build and run
docker-compose up -d

# The application will be available at:
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

### Production Docker Setup

1. **Update docker-compose.yml for production**:

```yaml
version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: calendar_organizer
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@db:5432/calendar_organizer
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
    depends_on:
      - db
    restart: always

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: always

volumes:
  postgres_data:
```

2. **Create .env file**:
```
DB_PASSWORD=your-secure-password
JWT_SECRET=your-secure-jwt-secret
```

3. **Deploy**:
```bash
docker-compose up -d
```

## Post-Deployment Checklist

- [ ] Database migrations completed
- [ ] Environment variables set correctly
- [ ] CORS configured for your domain
- [ ] SSL certificate installed
- [ ] API endpoints accessible
- [ ] Frontend loads correctly
- [ ] User registration/login works
- [ ] Course creation works
- [ ] Calendar displays correctly

## Environment Variables Reference

### Backend
| Variable | Description | Required |
|----------|-------------|----------|
| DATABASE_URL | PostgreSQL connection string | Yes |
| JWT_SECRET | Secret for JWT tokens | Yes |
| NODE_ENV | Set to 'production' | Yes |
| PORT | Server port (default: 5000) | No |
| SENDGRID_API_KEY | For email notifications | No |
| ANTHROPIC_API_KEY | For AI features | No |

### Frontend
| Variable | Description | Required |
|----------|-------------|----------|
| VITE_API_URL | Backend API URL | Yes |

## Troubleshooting

### Common Issues

1. **Database connection errors**:
   - Check DATABASE_URL format
   - Verify database exists
   - Check firewall rules

2. **CORS errors**:
   - Add your frontend domain to CORS settings in backend
   - Update `backend/src/server.js`:
   ```javascript
   app.use(cors({
     origin: ['https://your-frontend-domain.com'],
     credentials: true
   }));
   ```

3. **Build failures**:
   - Check Node.js version (18+)
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and reinstall

4. **API not accessible**:
   - Check if backend is running
   - Verify port is not blocked
   - Check Nginx/Docker proxy settings

## Monitoring & Maintenance

### PM2 Commands (Self-hosted)
```bash
pm2 status              # Check status
pm2 logs calendar-backend  # View logs
pm2 restart calendar-backend # Restart
pm2 monit               # Monitor resources
```

### Docker Commands
```bash
docker-compose logs -f  # View logs
docker-compose restart  # Restart services
docker-compose down     # Stop services
```

### Database Backups
```bash
# Backup
pg_dump -U postgres calendar_organizer > backup.sql

# Restore
psql -U postgres calendar_organizer < backup.sql
```

## Scaling Considerations

For high-traffic deployments:

1. **Use a managed database** (AWS RDS, Google Cloud SQL, or Render PostgreSQL)
2. **Add Redis** for session caching
3. **Use a CDN** for static assets
4. **Enable horizontal scaling** with multiple backend instances
5. **Add load balancing** with Nginx or cloud load balancer

## Security Recommendations

1. **Use strong, unique passwords** for database and JWT secret
2. **Enable HTTPS** everywhere
3. **Set up rate limiting** on API endpoints
4. **Keep dependencies updated**
5. **Use environment variables** for all secrets
6. **Enable database SSL** in production
7. **Set up firewall rules** to restrict access
