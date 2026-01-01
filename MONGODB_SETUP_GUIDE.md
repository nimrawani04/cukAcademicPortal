# 🗄️ MongoDB Atlas Setup Guide

## 🎯 Goal: Connect Your Academic Portal to MongoDB Atlas

Follow these steps to connect your application to your MongoDB Atlas cloud database.

## 📋 Step 1: MongoDB Atlas Account Setup

### **If you don't have a MongoDB Atlas account:**
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Click "Try Free"
3. Sign up with your email
4. Verify your email address

### **If you already have an account:**
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Sign in with your credentials

## 🏗️ Step 2: Create a Cluster

1. **Create New Project** (if needed):
   - Click "New Project"
   - Name it "Academic Portal" or similar
   - Click "Create Project"

2. **Create Cluster**:
   - Click "Create a Cluster"
   - Choose "M0 Sandbox" (FREE tier)
   - Select your preferred cloud provider (AWS recommended)
   - Choose a region close to you
   - Name your cluster (e.g., "academic-portal-cluster")
   - Click "Create Cluster"

## 👤 Step 3: Create Database User

1. **Go to Database Access**:
   - In left sidebar, click "Database Access"
   - Click "Add New Database User"

2. **Create User**:
   - Authentication Method: "Password"
   - Username: `academic_portal_user` (or your choice)
   - Password: Generate a secure password (save this!)
   - Database User Privileges: "Read and write to any database"
   - Click "Add User"

## 🌐 Step 4: Configure Network Access

1. **Go to Network Access**:
   - In left sidebar, click "Network Access"
   - Click "Add IP Address"

2. **Add IP Addresses**:
   - Click "Allow Access from Anywhere" (for development)
   - Or add your specific IP address
   - Click "Confirm"

## 🔗 Step 5: Get Connection String

1. **Go to Clusters**:
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Select "Node.js" and version "4.1 or later"

2. **Copy Connection String**:
   - You'll see something like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   - Copy this entire string

## ⚙️ Step 6: Update Your Environment File

Replace the placeholders in your connection string and update your `.env` file:

### **Example Connection String:**
```
mongodb+srv://academic_portal_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/academic_portal?retryWrites=true&w=majority
```

### **Update `.env` file:**
1. Open your `.env` file
2. Comment out the local MongoDB line
3. Uncomment and update the Atlas line:

```env
# Database Configuration
# For local MongoDB (commented out)
# MONGODB_URI=mongodb://localhost:27017/academic_portal

# For MongoDB Atlas (cloud) - ACTIVE
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/academic_portal?retryWrites=true&w=majority
```

## 🔧 Step 7: Test Connection

1. **Restart your server**:
   ```bash
   npm start
   ```

2. **Check server logs**:
   - Look for "MongoDB connected: cluster0.xxxxx.mongodb.net"
   - Should NOT see "Database connection failed"

3. **Test registration**:
   ```bash
   npm run test:registration
   ```

## 🎯 Step 8: Migrate Dummy Data

Once connected, add your dummy data to the cloud database:

```bash
npm run add:users
npm run add:more
```

## ✅ Verification Checklist

- [ ] MongoDB Atlas account created
- [ ] Cluster created (M0 Free tier)
- [ ] Database user created with read/write permissions
- [ ] Network access configured (IP whitelist)
- [ ] Connection string obtained
- [ ] `.env` file updated with Atlas connection string
- [ ] Server restarted and connects successfully
- [ ] Dummy data added to cloud database

## 🔍 Troubleshooting

### **Connection Issues:**
- Check username/password in connection string
- Verify IP address is whitelisted
- Ensure cluster is running (not paused)

### **Authentication Errors:**
- Double-check database user credentials
- Verify user has proper permissions

### **Network Errors:**
- Check firewall settings
- Verify internet connection
- Try "Allow Access from Anywhere" temporarily

## 📞 Need Help?

If you encounter issues:
1. Check the MongoDB Atlas documentation
2. Verify all steps above
3. Check server logs for specific error messages
4. Ensure your internet connection is stable

## 🚀 Next Steps After Connection

Once connected to MongoDB Atlas:
1. Your login system will use real database authentication
2. User registrations will be permanently stored
3. You can view/manage data through MongoDB Atlas dashboard
4. Ready for production deployment

---

**Ready to connect? Follow the steps above and let me know when you have your connection string!**