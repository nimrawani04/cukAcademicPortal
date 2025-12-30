# 🚀 Deployment Guide - Render & MongoDB Atlas

## 📋 Pre-Deployment Checklist

### ✅ **Project Preparation**
- [x] Environment variables configured
- [x] CORS setup for production
- [x] Security middleware enabled
- [x] Static file serving configured
- [x] Error handling implemented
- [x] Health check endpoint available
- [x] Email service configured
- [x] Database models ready

## 🗄️ **Step 1: MongoDB Atlas Setup**

### **1.1 Create MongoDB Atlas Account**
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Sign up for a free account
3. Create a new project: "Academic Portal"

### **1.2 Create Database Cluster**
1. Click "Build a Database"
2. Choose "M0 Sandbox" (Free tier)
3. Select your preferred cloud provider and region
4. Name your cluster: "academic-portal-cluster"
5. Click "Create Cluster"

### **1.3 Configure Database Access**
1. **Database User**:
   - Go to "Database Access"
   - Click "Add New Database User"
   - Username: `academic_portal_user`
   - Password: Generate secure password
   - Database User Privileges: "Read and write to any database"

2. **Network Access**:
   - Go to "Network Access"
   - Click "Add IP Address"
   - Select "Allow Access from Anywhere" (0.0.0.0/0)
   - Or add specific Render IP ranges for better security

### **1.4 Get Connection String**
1. Go to "Database" → "Connect"
2. Choose "Connect your application"
3. Select "Node.js" and version "4.1 or later"
4. Copy the connection string:
   ```
   mongodb+srv://<username>:<password>@academic-portal-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<username>` and `<password>` with your database user credentials
6. Add database name: `academic_portal`

**Final connection string:**
```
mongodb+srv://academic_portal_user:YOUR_PASSWORD@academic-portal-cluster.xxxxx.mongodb.net/academic_portal?retryWrites=true&w=majority
```

## 🌐 **Step 2: Render Deployment**

### **2.1 Prepare Repository**
1. **Commit all changes**:
   ```bash
   git add .
   git commit -m "Prepare for production deployment"
   git push origin main
   ```

2. **Ensure package.json has correct scripts**:
   ```json
   {
     "scripts": {
       "start": "node server.js",
       "build": "echo 'No build step needed'",
       "dev": "nodemon server.js"
     }
   }
   ```

### **2.2 Create Render Account**
1. Go to [Render](https://render.com)
2. Sign up with GitHub account
3. Connect your repository

### **2.3 Deploy Backend Service**
1. **Create New Web Service**:
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Select the repository: `academic-management-portal`

2. **Configure Service**:
   - **Name**: `academic-portal-backend`
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: Leave empty (root)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

3. **Set Environment Variables**:
   ```env
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb+srv://academic_portal_user:YOUR_PASSWORD@academic-portal-cluster.xxxxx.mongodb.net/academic_portal?retryWrites=true&w=majority
   JWT_SECRET=your_super_secure_jwt_secret_minimum_32_characters_long
   JWT_REFRESH_SECRET=your_super_secure_refresh_jwt_secret_minimum_32_characters_long
   JWT_ACCESS_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   FRONTEND_URL=https://your-render-app.onrender.com
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_production_email@gmail.com
   EMAIL_PASS=your_gmail_app_password
   EMAIL_FROM=Central University of Kashmir <noreply@cukashmir.ac.in>
   MAX_FILE_SIZE=5242880
   ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,doc,docx
   BCRYPT_SALT_ROUNDS=12
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=50
   SESSION_SECRET=your_production_session_secret_minimum_32_characters
   RESET_TOKEN_EXPIRES_IN=1h
   CORS_ORIGIN=https://your-render-app.onrender.com
   ```

4. **Advanced Settings**:
   - **Auto-Deploy**: Yes
   - **Health Check Path**: `/health`

5. **Click "Create Web Service"**

### **2.4 Configure Custom Domain (Optional)**
1. Go to your service dashboard
2. Click "Settings" → "Custom Domains"
3. Add your domain: `api.yourdomain.com`
4. Update DNS records as instructed
5. Update `FRONTEND_URL` and `CORS_ORIGIN` environment variables

## 📧 **Step 3: Email Configuration**

### **3.1 Gmail Setup for Production**
1. **Create Dedicated Gmail Account**:
   - Create: `cuk.portal@gmail.com` (or similar)
   - Enable 2-Factor Authentication

2. **Generate App Password**:
   - Go to Google Account → Security
   - App passwords → Generate new
   - Select "Mail" and your device
   - Copy the 16-character password

3. **Update Environment Variables**:
   ```env
   EMAIL_USER=cuk.portal@gmail.com
   EMAIL_PASS=your_16_character_app_password
   EMAIL_FROM=Central University of Kashmir <noreply@cukashmir.ac.in>
   ```

### **3.2 Alternative: Professional Email Service**
For better deliverability, consider:
- **SendGrid**: Free tier with 100 emails/day
- **Mailgun**: Free tier with 5,000 emails/month
- **Amazon SES**: Pay-as-you-go pricing

## 🔧 **Step 4: Production Configuration**

### **4.1 Update Frontend API URL**
The frontend is already configured to automatically detect production:
```javascript
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api'  // Development
    : '/api';  // Production
```

### **4.2 Security Enhancements**
```javascript
// Already implemented in server.js:
- Helmet security headers
- CORS restrictions
- Rate limiting
- Input validation
- JWT token security
- Password hashing
- File upload restrictions
```

### **4.3 Database Indexes**
MongoDB Atlas will automatically create recommended indexes, but you can optimize:
```javascript
// User collection indexes
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "registrationStatus": 1 })
db.users.createIndex({ "role": 1 })
db.users.createIndex({ "isActive": 1 })

// Notice collection indexes
db.notices.createIndex({ "publishDate": -1 })
db.notices.createIndex({ "priority": 1 })
db.notices.createIndex({ "targetAudience": 1 })
```

## 🧪 **Step 5: Testing Deployment**

### **5.1 Health Check**
```bash
curl https://your-render-app.onrender.com/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 123.45,
  "database": {
    "connected": true,
    "status": "connected"
  },
  "environment": "production"
}
```

### **5.2 API Endpoints Test**
```bash
# Test registration
curl -X POST https://your-render-app.onrender.com/api/registration/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "phone": "+1234567890",
    "password": "TestPass123!",
    "registrationType": "student",
    "course": "Computer Science",
    "year": 1
  }'

# Test forgot password
curl -X POST https://your-render-app.onrender.com/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "userType": "student"
  }'
```

### **5.3 Frontend Testing**
1. Open your deployed frontend URL
2. Test login functionality
3. Test registration process
4. Test forgot password flow
5. Test file uploads
6. Test notice creation
7. Test marks management

## 📊 **Step 6: Monitoring & Maintenance**

### **6.1 Render Monitoring**
- **Logs**: View real-time logs in Render dashboard
- **Metrics**: Monitor CPU, memory, and response times
- **Alerts**: Set up alerts for downtime or errors

### **6.2 MongoDB Atlas Monitoring**
- **Performance Advisor**: Optimize slow queries
- **Real-time Metrics**: Monitor database performance
- **Alerts**: Set up alerts for high usage or errors

### **6.3 Email Monitoring**
- **Delivery Rates**: Monitor email success/failure rates
- **Bounce Rates**: Track bounced emails
- **Spam Reports**: Monitor spam complaints

## 🔒 **Step 7: Security Hardening**

### **7.1 Environment Variables Security**
- Never commit `.env` files to version control
- Use strong, unique secrets for JWT tokens
- Rotate secrets regularly
- Use different secrets for development and production

### **7.2 Database Security**
- Enable MongoDB Atlas IP whitelist
- Use strong database passwords
- Enable database audit logs
- Regular security updates

### **7.3 Application Security**
- Keep dependencies updated
- Monitor for security vulnerabilities
- Implement proper logging
- Regular security audits

## 🚨 **Troubleshooting**

### **Common Deployment Issues**

#### **1. Build Failures**
```bash
# Check package.json dependencies
npm install
npm audit fix

# Verify Node.js version
node --version  # Should be >= 16.0.0
```

#### **2. Database Connection Issues**
- Verify MongoDB Atlas connection string
- Check IP whitelist settings
- Ensure database user has correct permissions
- Test connection locally first

#### **3. CORS Errors**
- Verify FRONTEND_URL environment variable
- Check CORS_ORIGIN configuration
- Ensure frontend domain matches exactly

#### **4. Email Issues**
- Verify Gmail app password (not regular password)
- Check spam folders for test emails
- Verify EMAIL_USER and EMAIL_PASS
- Test with simple email first

### **Debug Commands**
```bash
# Check environment variables
echo $NODE_ENV
echo $MONGODB_URI
echo $FRONTEND_URL

# Test database connection
node -e "require('./server/config/database').connectDB().then(() => console.log('DB OK')).catch(console.error)"

# Test email configuration
npm run test:email
```

## 🎯 **Post-Deployment Steps**

### **1. Domain Configuration**
1. Purchase domain (e.g., `cukportal.com`)
2. Configure DNS records
3. Set up SSL certificates (automatic with Render)
4. Update environment variables with new domain

### **2. Performance Optimization**
1. Enable CDN for static assets
2. Implement caching strategies
3. Optimize database queries
4. Monitor and optimize slow endpoints

### **3. Backup Strategy**
1. Set up MongoDB Atlas automated backups
2. Export critical data regularly
3. Test restore procedures
4. Document recovery processes

## 📈 **Scaling Considerations**

### **When to Scale**
- Response times > 2 seconds
- CPU usage consistently > 80%
- Memory usage > 90%
- Database connections maxed out

### **Scaling Options**
1. **Render**: Upgrade to higher tier plans
2. **MongoDB Atlas**: Upgrade cluster tier
3. **CDN**: Add Cloudflare or similar
4. **Load Balancing**: Multiple Render services

## 🎉 **Deployment Complete!**

Your Academic Management Portal is now ready for production deployment with:

✅ **Production-ready server configuration**
✅ **MongoDB Atlas database setup**
✅ **Secure environment variable management**
✅ **Professional email service integration**
✅ **Comprehensive error handling**
✅ **Security best practices implemented**
✅ **Monitoring and logging configured**
✅ **Scalable architecture**

**Your application will be available at**: `https://your-app-name.onrender.com`

### **Next Steps**:
1. Follow the MongoDB Atlas setup instructions
2. Deploy to Render using the provided configuration
3. Test all functionality in production
4. Configure custom domain if needed
5. Set up monitoring and alerts
6. Plan for regular maintenance and updates