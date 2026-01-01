# 🔧 Troubleshooting Guide

## ✅ **Current Status:**
- ✅ Backend running on port 5001
- ✅ MongoDB Atlas connected
- ✅ API endpoints responding
- ✅ CORS configured for port 5500

## 🔍 **Common Issues & Solutions:**

### 1. **"Failed to fetch" Error**
**Cause:** Backend not running or wrong port
**Solution:**
```bash
# Kill any existing node processes
taskkill /f /im node.exe

# Start backend
npm start

# Verify it's running on port 5001
```

### 2. **CORS Error**
**Cause:** Frontend not on port 5500
**Solution:**
- Use Live Server extension in VS Code
- Make sure it opens on `http://127.0.0.1:5500`
- Check browser console for CORS errors

### 3. **API Not Defined Error**
**Cause:** `client/js/api.js` not loaded
**Solution:**
- Check if `<script src="client/js/api.js"></script>` is in index.html
- Open browser console and type `authAPI` - should show object

### 4. **Registration/Login Hanging**
**Cause:** JavaScript error or API call failure
**Solution:**
- Open browser console (F12)
- Look for error messages
- Check Network tab for failed requests

## 🧪 **Quick Tests:**

### Test 1: Backend Health
```bash
node test-connection.js
```
Should show: ✅ ALL CONNECTION TESTS PASSED!

### Test 2: Frontend API Access
Open: `http://127.0.0.1:5500/quick-test.html`
Should show: ✅ SUCCESS: Academic Portal Server is running

### Test 3: Full Frontend Test
Open: `http://127.0.0.1:5500/debug-frontend.html`
Click "Test API Load" - should show API loaded

## 📋 **Step-by-Step Verification:**

1. **Backend Running?**
   ```bash
   npm start
   ```
   Should show: "Server running on port 5001"

2. **Frontend on Port 5500?**
   - Right-click index.html → "Open with Live Server"
   - URL should be: `http://127.0.0.1:5500`

3. **API File Loaded?**
   - Open browser console
   - Type: `API_BASE_URL`
   - Should show: "http://localhost:5001"

4. **Test Registration:**
   - Fill registration form
   - Open browser console (F12)
   - Click Register
   - Look for API request logs

## 🚨 **If Still Not Working:**

1. **Clear Browser Cache:** Ctrl+Shift+R
2. **Check Browser Console:** F12 → Console tab
3. **Check Network Tab:** F12 → Network tab
4. **Restart Both Servers:**
   ```bash
   # Kill backend
   taskkill /f /im node.exe
   
   # Restart backend
   npm start
   
   # Restart Live Server (VS Code)
   ```

## 📞 **Debug Information to Provide:**
- Browser console errors
- Network tab failed requests
- Exact error messages
- Which step fails (registration/login)