# 🚀 Academic Portal - Deployment Instructions

## 📋 **Quick Setup Checklist**

### ✅ **Backend (Render)**
1. **Push code to GitHub**
2. **Connect Render to your GitHub repo**
3. **Set environment variables in Render dashboard:**
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
   FRONTEND_URL=https://your-vercel-app.vercel.app
   ```
4. **Deploy automatically via render.yaml**

### ✅ **Frontend (Vercel)**
1. **Update API URLs in index.html:**
   ```javascript
   const apiBaseUrl = window.location.hostname === 'localhost' 
       ? 'http://localhost:5000' 
       : 'https://your-render-app.onrender.com'; // ← Update this
   ```
2. **Deploy to Vercel**
3. **Update CORS in server.js with your Vercel URL**

## 🔧 **Local Development**

### Start Backend:
```bash
npm start
# Server runs on http://localhost:5000
```

### Test System:
```bash
node test-complete-system.js
```

### Open Frontend:
```
http://localhost:5000/index.html
```

## 🧪 **Test Credentials**
```
Email: demo@student.com
Password: demo123

Email: test@student.com  
Password: test123
```

## 🔍 **Debugging**

### Check Logs:
- **Render**: View logs in Render dashboard
- **Browser**: Press F12 → Console tab
- **Local**: Check terminal output

### Common Issues:
1. **CORS errors**: Update CORS origins in server.js
2. **Database connection**: Check MONGODB_URI format
3. **API calls failing**: Verify API base URLs match deployment URLs

## 📊 **Health Check**
- Local: `http://localhost:5000/api/health`
- Production: `https://your-render-app.onrender.com/api/health`

## 🎯 **Production URLs**
- **Backend**: `https://your-render-app.onrender.com`
- **Frontend**: `https://your-vercel-app.vercel.app`
- **Health**: `https://your-render-app.onrender.com/api/health`