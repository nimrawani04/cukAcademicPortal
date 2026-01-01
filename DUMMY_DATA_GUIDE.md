# 🎓 Dummy Data Guide

## 📊 Overview

Your academic portal now has **17 sample users** for testing and development:
- **12 University Students** (various courses and years)
- **5 Test Users** (for development testing)

## 🔑 Sample Login Credentials

### **Quick Test Accounts**
```
Email: demo.student@cukashmir.ac.in
Password: demo123

Email: test.student.a@test.com  
Password: test123

Email: aarav.sharma@student.cukashmir.ac.in
Password: student123
```

### **University Students**
| Name | Email | Password | Course | Year |
|------|-------|----------|---------|------|
| Aarav Sharma | aarav.sharma@student.cukashmir.ac.in | student123 | B.Tech CS | 2 |
| Priya Patel | priya.patel@student.cukashmir.ac.in | student123 | B.Tech CS | 3 |
| Rohit Kumar | rohit.kumar@student.cukashmir.ac.in | student123 | M.Tech CS | 1 |
| Sneha Gupta | sneha.gupta@student.cukashmir.ac.in | student123 | MBA | 2 |
| Arjun Singh | arjun.singh@student.cukashmir.ac.in | student123 | B.Tech Civil | 3 |
| Kavya Reddy | kavya.reddy@student.cukashmir.ac.in | student123 | BBA | 1 |
| Ahmed Hassan | ahmed.hassan@student.cukashmir.ac.in | student123 | B.Tech CS | 2 |
| Maria Garcia | maria.garcia@student.cukashmir.ac.in | student123 | MBA | 1 |

### **Test Users**
| Name | Email | Password |
|------|-------|----------|
| Alice Cooper | alice.cooper@test.com | password123 |
| Bob Wilson | bob.wilson@test.com | password123 |
| Charlie Brown | charlie.brown@test.com | password123 |
| Diana Prince | diana.prince@test.com | password123 |
| Edward Norton | edward.norton@test.com | password123 |

## 🛠️ Available Scripts

### **Add More Users**
```bash
npm run add:users
```
Adds comprehensive sample users to the database

### **View Current Users**
```bash
npm run view:users
```
Displays all users in the database with statistics

### **Search Users**
```bash
node view-dummy-data.js search "aarav"
node view-dummy-data.js search "@test.com"
```

### **View Credentials Only**
```bash
node view-dummy-data.js credentials
```

### **Test Registration**
```bash
npm run seed:test
```
Tests registration with additional dummy data

## 📈 Database Statistics

After running the dummy data scripts, your database contains:
- **17 Total Users**
- **17 Students** (all current users are students)
- **0 Faculty** (to be added when faculty features are implemented)
- **0 Admins** (to be added when admin features are implemented)

## 🧪 Testing Scenarios

### **Registration Testing**
- ✅ Valid registrations work
- ✅ Duplicate email prevention works
- ✅ Password validation works
- ✅ Required field validation works

### **Data Variety**
- ✅ Different name formats (Indian, International)
- ✅ Various email domains (@student.cukashmir.ac.in, @test.com)
- ✅ Multiple courses (CS, Civil, MBA, BBA)
- ✅ Different academic years (1-3)

### **Use Cases**
- **Development Testing**: Use @test.com emails
- **Demo Presentations**: Use demo.student@cukashmir.ac.in
- **University Simulation**: Use @student.cukashmir.ac.in emails
- **Load Testing**: All 17 users available

## 🔄 Adding More Data

### **Custom Users**
Modify `add-sample-users.js` to add your own test users:

```javascript
const customUsers = [
    {
        name: 'Your Name',
        email: 'your.email@test.com',
        password: 'yourpassword',
        type: 'student',
        course: 'Your Course',
        year: 1
    }
];
```

### **Bulk Registration**
The scripts handle:
- ✅ Duplicate prevention
- ✅ Password hashing
- ✅ Error handling
- ✅ Progress reporting

## 🚀 Next Steps

### **When Login is Implemented**
1. Test login with any of the sample credentials
2. Verify user sessions work correctly
3. Test role-based access (when implemented)

### **When Dashboards are Added**
1. Use different user types to test various interfaces
2. Verify course-specific data displays correctly
3. Test user profile management

### **For Production**
1. Clear test data: Delete users with @test.com emails
2. Keep university users: @student.cukashmir.ac.in emails
3. Add real faculty and admin accounts

## 📋 Maintenance

### **View Database Status**
```bash
npm run view:users
```

### **Clean Test Data**
```javascript
// In MongoDB or through API (when delete is implemented)
// Delete users where email contains '@test.com'
```

### **Reset Database**
```bash
# Clear all users and re-add fresh dummy data
npm run add:users
```

## 🎯 Summary

Your academic portal now has a rich set of dummy data for:
- ✅ **Testing registration functionality**
- ✅ **Developing login features**
- ✅ **Creating user dashboards**
- ✅ **Demonstrating the application**
- ✅ **Load testing with multiple users**

All users are ready to use with the credentials listed above!