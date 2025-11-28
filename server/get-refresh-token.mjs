#!/usr/bin/env node

/**
 * Script to get Gmail OAuth2 Refresh Token
 * 
 * Usage:
 * 1. Set these environment variables:
 *    - GMAIL_CLIENT_ID
 *    - GMAIL_CLIENT_SECRET
 *    - EMAIL_USER (your Gmail address)
 * 
 * 2. Run: node get-refresh-token.mjs
 * 
 * 3. Follow the instructions to authorize and get refresh token
 */

import { google } from 'googleapis';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: join(__dirname, '.env') });

const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const EMAIL_USER = process.env.EMAIL_USER || 'jojoopiwe@gmail.com';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Error: GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET must be set in .env file');
  console.error('');
  console.error('Add these to server/.env:');
  console.error('GMAIL_CLIENT_ID=your-client-id');
  console.error('GMAIL_CLIENT_SECRET=your-client-secret');
  console.error('EMAIL_USER=jojoopiwe@gmail.com');
  process.exit(1);
}

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];
const TOKEN_PATH = join(__dirname, 'gmail-token.json');

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  'urn:ietf:wg:oauth:2.0:oob' // For command-line apps
);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function getAccessToken() {
  // Check if we already have a token
  if (existsSync(TOKEN_PATH)) {
    const token = JSON.parse(readFileSync(TOKEN_PATH, 'utf8'));
    if (token.refresh_token) {
      console.log('✅ Found existing refresh token!');
      console.log(`📋 Refresh Token: ${token.refresh_token}`);
      console.log('');
      console.log('Add this to Render environment variables:');
      console.log(`GMAIL_REFRESH_TOKEN=${token.refresh_token}`);
      rl.close();
      return;
    }
  }

  // Get authorization URL
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // Force consent screen to get refresh token
  });

  console.log('');
  console.log('🔐 Gmail OAuth2 Authorization');
  console.log('============================');
  console.log('');
  console.log('1. Open this URL in your browser:');
  console.log('');
  console.log(authUrl);
  console.log('');
  console.log('2. Sign in with:', EMAIL_USER);
  console.log('3. Click "Allow" to grant permissions');
  console.log('4. Copy the authorization code from the page');
  console.log('');

  const code = await question('Enter the authorization code: ');

  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    // Save token
    writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
    console.log('');
    console.log('✅ Success! Refresh token obtained');
    console.log('');
    console.log('📋 Refresh Token:');
    console.log(tokens.refresh_token);
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Add this to Render environment variables:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log('');
    console.log('Also make sure you have:');
    console.log(`EMAIL_USER=${EMAIL_USER}`);
    console.log(`GMAIL_CLIENT_ID=${CLIENT_ID}`);
    console.log(`GMAIL_CLIENT_SECRET=${CLIENT_SECRET}`);
    console.log('');
  } catch (error) {
    console.error('❌ Error getting token:', error.message);
    if (error.message.includes('invalid_grant')) {
      console.error('');
      console.error('⚠️  This usually means:');
      console.error('   1. The authorization code expired (they expire quickly)');
      console.error('   2. The code was already used');
      console.error('   3. Try running the script again and use a fresh code');
    }
    process.exit(1);
  }

  rl.close();
}

getAccessToken().catch(console.error);

