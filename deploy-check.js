// Simple deployment readiness check
const fs = require('fs');

console.log('🚀 Academic Portal - Deployment Readiness Check\n');

// Check required files
const requiredFiles = [
    'package.json',
    'server.js', 
    'render.yaml',
    '.env.production',
    'server/config/database.js',
    'server/routes/healthRoutes.js'
];

let allGood = true;

console.log('📁 Checking required files:');
requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - MISSING`);
        allGood = false;
    }
});

// Check package.json
console.log('\n📦 Checking package.json:');
try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (pkg.scripts && pkg.scripts.start) {
        console.log('✅ Start script defined');
    } else {
        console.log('❌ Start script missing');
        allGood = false;
    }
    
    if (pkg.main || pkg.scripts.start) {
        console.log('✅ Entry point configured');
    } else {
        console.log('❌ No entry point found');
        allGood = false;
    }
} catch (error) {
    console.log('❌ Error reading package.json');
    allGood = false;
}

console.log('\n🔧 Environment Variables Needed:');
console.log('Copy these to Render Environment Variables:');
console.log('━'.repeat(50));
console.log('NODE_ENV=production');
console.log('PORT=10000');
console.log('MONGODB_URI=your_mongodb_atlas_connection_string');
console.log('JWT_SECRET=your_secure_32_char_secret');
console.log('JWT_REFRESH_SECRET=your_secure_32_char_refresh_secret');
console.log('EMAIL_USER=your_gmail@gmail.com');
console.log('EMAIL_PASS=your_gmail_app_password');
console.log('FRONTEND_URL=https://your-render-app.onrender.com');
console.log('CORS_ORIGIN=https://your-render-app.onrender.com');
console.log('━'.repeat(50));

if (allGood) {
    console.log('\n🎉 Ready for deployment!');
    console.log('\nNext steps:');
    console.log('1. Set up MongoDB Atlas (see MONGODB_ATLAS_SETUP.md)');
    console.log('2. Create Render web service');
    console.log('3. Configure environment variables');
    console.log('4. Deploy!');
} else {
    console.log('\n⚠️  Fix the issues above before deploying');
}