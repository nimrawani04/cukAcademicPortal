// Generate secure secrets for production
const crypto = require('crypto');

console.log('🔐 Generating Secure Secrets for Production\n');

console.log('Copy these values to your Render environment variables:\n');

console.log('JWT_SECRET=');
console.log(crypto.randomBytes(32).toString('hex'));

console.log('\nJWT_REFRESH_SECRET=');
console.log(crypto.randomBytes(32).toString('hex'));

console.log('\nSESSION_SECRET=');
console.log(crypto.randomBytes(32).toString('hex'));

console.log('\n⚠️  Keep these secrets secure and never share them!');