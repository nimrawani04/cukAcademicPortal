# 🚀 Render Deployment Guide

## ✅ Pre-Deployment Checklist

Your backend is **already configured** for Render deployment:

- ✅ Uses `process.env.PORT` (defaults to 5000 locally)
- ✅ No localhost hardcoding
- ✅ Start script in package.json: `"start": "node server.js"`
- ✅ Binds to `0.0.0.0` for external access
- ✅ Environment-aware configuration

## 🔧 Required Configuration Changes

### 1. Environment Variables on Render

Set these in your Render service dashboard:

#### **Essential Variables:**
```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/academic_portal
JWT_SECRET=your_32_character_secret_key_here
FRONTEND_URL=https://your-frontend-domain.com
```

#### **Email Configuration:**
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=Central University of Kashmir <noreply@cukashmir.ac.in>
```

#### **Security & Performance:**
```bash
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_MAX_REQUESTS=50
SESSION_SECRET=your_session_secret
```

### 2. MongoDB Atlas Setup

#### **Create MongoDB Atlas Cluster:**
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create free cluster (M0 Sandbox)
3. Create database user with read/write permissions
4. Whitelist IP addresses (0.0.0.0/0 for Render)
5. Get connection string

#### **Connection String Format:**
```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/academic_portal?retryWrites=true&w=majority
```

**Replace:**
- `<username>` with your database username
- `<password>` with your database password
- `cluster0.xxxxx` with your actual cluster address

## 🌐 Deployment Steps

### **Option 1: Using Render Dashboard**

1. **Connect Repository:**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service:**
   - **Name:** `academic-portal-backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free (or Starter for better performance)

3. **Set Environment Variables:**
   - Go to "Environment" tab
   - Add all variables from the list above
   - Use "Generate" for JWT secrets

### **Option 2: Using render.yaml (Automatic)**

Your `render.yaml` is already configured! Just:

1. Push code to GitHub
2. Connect repository to Render
3. Render will auto-detect the blueprint
4. Set the `sync: false` variables manually:
   - `MONGODB_URI`
   - `FRONTEND_URL`
   - `EMAIL_USER`
   - `EMAIL_PASS`

## 🔍 Production Verification

### **Health Check Endpoint:**
```bash
GET https://your-app.onrender.com/api/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "message": "Server is running"
}
```

### **Registration Test:**
```bash
POST https://your-app.onrender.com/api/auth/register
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123"
}
```

## 🔒 Security Considerations

### **Environment Variables Security:**
- Never commit `.env` files to Git
- Use strong, unique secrets for JWT
- Rotate secrets regularly
- Use MongoDB Atlas IP whitelisting

### **Production Optimizations:**
- Rate limiting enabled (50 requests/15min)
- CORS configured for your frontend domain
- Password hashing with bcrypt (12 rounds)
- Request logging for debugging

## 🐛 Troubleshooting

### **Common Issues:**

#### **1. Server Won't Start**
- Check Render logs for specific error
- Verify all required environment variables are set
- Ensure MongoDB connection string is correct

#### **2. Database Connection Failed**
- Verify MongoDB Atlas cluster is running
- Check IP whitelist includes 0.0.0.0/0
- Confirm username/password in connection string
- Test connection string locally first

#### **3. CORS Errors**
- Set `FRONTEND_URL` to your actual frontend domain
- Include protocol (https://) in the URL
- No trailing slash in the URL

#### **4. 502 Bad Gateway**
- Server is crashing on startup
- Check environment variables
- Review Render deployment logs

### **Debugging Commands:**
```bash
# Check server logs
curl https://your-app.onrender.com/api/health

# Test registration endpoint
curl -X POST https://your-app.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"password123"}'
```

## 📊 Performance Monitoring

### **Render Metrics:**
- Response times
- Memory usage
- CPU usage
- Request volume

### **Application Logs:**
- All requests logged with method/path/body
- Database connection status
- Error messages with stack traces
- Environment confirmation on startup

## 🔄 Continuous Deployment

### **Auto-Deploy Setup:**
1. Enable auto-deploy in Render dashboard
2. Push to main branch triggers deployment
3. Health check ensures successful deployment
4. Rollback available if deployment fails

### **Manual Deploy:**
- Use "Manual Deploy" button in Render dashboard
- Select specific commit to deploy
- Monitor deployment logs in real-time

## 🎯 Next Steps After Deployment

1. **Test all endpoints** with production URL
2. **Update frontend** to use production API URL
3. **Configure custom domain** (optional)
4. **Set up monitoring** and alerts
5. **Implement backup strategy** for MongoDB
6. **Add SSL certificate** (automatic with Render)

Your backend is **production-ready** and will work seamlessly on Render! 🚀