# Render Deployment Guide - Step by Step

This guide provides detailed step-by-step instructions to deploy the Academic Calendar Organizer on Render.com.

## Prerequisites

1. **GitHub Account** - Your code must be on GitHub
2. **Render Account** - Sign up free at [render.com](https://render.com)
3. **Code Pushed to GitHub** - Make sure all changes are committed and pushed

---

## Step 1: Push Code to GitHub

Before deploying, ensure your latest code is on GitHub:

```bash
# In your project directory
git add .
git commit -m "Prepare for Render deployment"
git push origin master
```

---

## Step 2: Create Render Account (if needed)

1. Go to [render.com](https://render.com)
2. Click **Get Started for Free**
3. Sign up using your GitHub account (recommended) or email
4. Verify your email if required

---

## Step 3: Deploy Using Blueprint (Recommended)

The `render.yaml` file in your repository defines all services automatically.

### 3.1: Access Blueprint Creation

1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Click the **New +** button (top right)
3. Select **Blueprint** from the dropdown

### 3.2: Connect GitHub Repository

1. If this is your first time, click **Connect GitHub account**
2. Authorize Render to access your GitHub
3. Select **Only select repositories** (recommended)
4. Choose your repository: `doobyanil/scheduler`
5. Click **Connect**

### 3.3: Configure Blueprint

1. Render will detect the `render.yaml` file automatically
2. You'll see a preview of services to be created:
   - **calendar-organizer-db** (PostgreSQL database)
   - **calendar-organizer-backend** (Node.js Web Service)
   - **calendar-organizer-frontend** (Static Site)
3. Review the configuration
4. Click **Apply** to start creating services

### 3.4: Wait for Deployment

1. Render will create all three services
2. This takes approximately 10-15 minutes
3. You can watch the build logs in real-time
4. Each service will show a green checkmark when ready

---

## Step 4: Run Database Migrations

After all services are deployed, you need to create the database tables.

### 4.1: Open Backend Shell

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click on **calendar-organizer-backend** (your backend service)
3. Click the **Shell** tab in the left sidebar
4. Wait for the shell to connect (shows `$` prompt)

### 4.2: Run Migration Command

In the shell, type:

```bash
npm run migrate
```

You should see:
```
Database tables created successfully
```

### 4.3: Verify Tables Created

To verify, you can run:

```bash
node -e "require('./src/database/db').createTables().then(() => process.exit(0))"
```

---

## Step 5: Verify Deployment

### 5.1: Check Service Status

1. Go to [Render Dashboard](https://dashboard.render.com)
2. All three services should show **Live** (green status)

### 5.2: Test Backend API

1. Click on **calendar-organizer-backend**
2. Copy the service URL (e.g., `https://calendar-organizer-backend.onrender.com`)
3. Open in browser: `https://your-backend-url.onrender.com/api/health`
4. You should see: `{"status":"ok"}`

### 5.3: Test Frontend

1. Click on **calendar-organizer-frontend**
2. Click the service URL
3. The application should load
4. Try registering a new user account

---

## Alternative: Manual Deployment (Step by Step)

If Blueprint doesn't work, deploy each service manually.

### Manual Step 1: Create PostgreSQL Database

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **PostgreSQL**
3. Fill in the form:
   - **Name**: `calendar-organizer-db`
   - **Database**: `calendar_organizer`
   - **User**: Leave default (auto-generated)
   - **Region**: Oregon (or closest to you)
   - **PostgreSQL Version**: 15
   - **Plan**: Free
4. Click **Create Database**
5. Wait 2-3 minutes for database to be ready
6. **Important**: Copy the **Internal Database URL** (you'll need it for the backend)

### Manual Step 2: Create Backend Web Service

1. Click **New +** → **Web Service**
2. Connect your GitHub repository:
   - Click **Connect GitHub** if not already connected
   - Select `doobyanil/scheduler`
3. Configure the service:
   - **Name**: `calendar-organizer-backend`
   - **Region**: Same as database (Oregon)
   - **Branch**: `master`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free
4. Add Environment Variables (click **Advanced** to see all):

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | Paste Internal Database URL from Step 1 |
   | `JWT_SECRET` | Click **Generate** to create a secure secret |
   | `NODE_ENV` | `production` |
   | `CORS_ORIGIN` | `https://calendar-organizer-frontend.onrender.com` |

5. Click **Create Web Service**
6. Wait 5-10 minutes for deployment
7. Copy your backend URL when ready

### Manual Step 3: Create Frontend Static Site

1. Click **New +** → **Static Site**
2. Select your repository: `doobyanil/scheduler`
3. Configure the site:
   - **Name**: `calendar-organizer-frontend`
   - **Region**: Same as backend (Oregon)
   - **Branch**: `master`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Plan**: Free
4. Add Environment Variable:

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://calendar-organizer-backend.onrender.com` |

5. Click **Create Static Site**
6. Wait 2-5 minutes for deployment

### Manual Step 4: Run Migrations

Follow Step 4 above to run database migrations.

---

## Environment Variables Reference

### Backend Service (`calendar-organizer-backend`)

| Variable | Required | How to Set |
|----------|----------|------------|
| `DATABASE_URL` | Yes | Auto-linked from database or paste manually |
| `JWT_SECRET` | Yes | Click **Generate** in Render |
| `NODE_ENV` | Yes | Set to `production` |
| `CORS_ORIGIN` | Yes | Your frontend URL |
| `PORT` | No | Render sets automatically |

### Frontend Service (`calendar-organizer-frontend`)

| Variable | Required | How to Set |
|----------|----------|------------|
| `VITE_API_URL` | Yes | Your backend URL |

---

## Troubleshooting

### Backend Shows "Build Failed"

1. Click on the backend service
2. Go to **Logs** tab
3. Look for error messages
4. Common fixes:
   - Ensure `package.json` exists in `backend/` folder
   - Check for missing dependencies
   - Verify Node.js version compatibility

### Frontend Shows Blank Page

1. Open browser Developer Tools (F12)
2. Check Console for errors
3. Common fixes:
   - Verify `VITE_API_URL` is set correctly
   - Ensure backend is running
   - Check CORS settings

### Database Connection Errors

1. Verify database is running (green status)
2. Check `DATABASE_URL` is set in backend
3. Use **Internal Database URL** (not External)
4. Ensure both services are in the same region

### CORS Errors in Browser Console

1. Go to backend service in Render
2. Add environment variable:
   - Key: `CORS_ORIGIN`
   - Value: Your frontend URL (e.g., `https://calendar-organizer-frontend.onrender.com`)
3. Backend will auto-redeploy

### "Service Unavailable" Error

1. Free tier services spin down after 15 minutes of inactivity
2. First request takes ~30 seconds to wake up
3. This is normal for free tier

---

## Free Tier Limitations

- **750 hours/month** of Web Service runtime
- **1 free PostgreSQL** database (expires after 90 days)
- **100GB** bandwidth per month
- Services **spin down** after 15 minutes of inactivity
- **Cold start** takes ~30 seconds

---

## Post-Deployment Checklist

- [ ] All three services show "Live" status
- [ ] Backend health check returns `{"status":"ok"}`
- [ ] Frontend loads without errors
- [ ] Can register a new user account
- [ ] Can log in with created account
- [ ] Can create a new course
- [ ] Calendar displays correctly

---

## Useful Render Dashboard Features

### View Logs
1. Click on any service
2. Go to **Logs** tab
3. See real-time application logs

### View Metrics
1. Click on any service
2. Go to **Metrics** tab
3. See CPU, memory, and request metrics

### Manual Deploy
1. Click on any service
2. Click **Manual Deploy** → **Deploy latest commit**

### Shell Access
1. Click on backend service
2. Go to **Shell** tab
3. Run commands directly on the server

---

## Support Resources

- **Render Documentation**: [render.com/docs](https://render.com/docs)
- **Render Status**: [status.render.com](https://status.render.com)
- **Render Support**: [render.com/support](https://render.com/support)

---

## Quick Reference URLs

After deployment, your URLs will be:

- **Frontend**: `https://calendar-organizer-frontend.onrender.com`
- **Backend**: `https://calendar-organizer-backend.onrender.com`
- **Health Check**: `https://calendar-organizer-backend.onrender.com/api/health`
