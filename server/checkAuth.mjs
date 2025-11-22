#!/usr/bin/env node
import jwt from 'jsonwebtoken';
import { config } from 'dotenv';

config();

// Get token from command line argument
const token = process.argv[2];

if (!token) {
  console.log('\n❌ No token provided!');
  console.log('\nUsage: node checkAuth.mjs <your-jwt-token>');
  console.log('\nTo get your token:');
  console.log('1. Open browser console');
  console.log('2. Run: localStorage.getItem("token")');
  console.log('3. Copy the token value');
  console.log('4. Run: node checkAuth.mjs <paste-token-here>\n');
  process.exit(1);
}

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  console.error('❌ JWT_SECRET not configured in .env file');
  process.exit(1);
}

try {
  // Verify and decode the token
  const decoded = jwt.verify(token, jwtSecret);

  console.log('\n✅ Token is VALID!\n');
  console.log('📋 Token Details:');
  console.log('  User ID:', decoded.sub);
  console.log('  Role:', decoded.role);

  if (decoded.exp) {
    const expiryDate = new Date(decoded.exp * 1000);
    const now = new Date();
    const isExpired = expiryDate < now;

    console.log('  Expires:', expiryDate.toLocaleString());
    console.log('  Status:', isExpired ? '❌ EXPIRED' : '✅ Active');
  }

  console.log('\n🔐 Authorization Check:');
  if (decoded.role === 'ADMIN' || decoded.role === 'TECHNICIAN') {
    console.log('  ✅ You can update assets (Role: ' + decoded.role + ')');
  } else {
    console.log('  ❌ You CANNOT update assets (Role: ' + decoded.role + ')');
    console.log('  ⚠️  Only ADMIN and TECHNICIAN roles can update assets');
  }

  console.log('\n');
} catch (error) {
  console.log('\n❌ Token is INVALID!\n');

  if (error.name === 'TokenExpiredError') {
    console.log('  Reason: Token has expired');
    console.log('  Expired at:', new Date(error.expiredAt).toLocaleString());
    console.log('\n  Solution: Log in again to get a fresh token\n');
  } else if (error.name === 'JsonWebTokenError') {
    console.log('  Reason:', error.message);
    console.log('\n  Solution: Make sure you copied the complete token\n');
  } else {
    console.log('  Error:', error.message);
  }
}
