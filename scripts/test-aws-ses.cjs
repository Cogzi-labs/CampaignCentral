#!/usr/bin/env node
// Simple script to test AWS SES credentials
const AWS = require('aws-sdk');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Get SES credentials directly from environment
const SES_USERNAME = process.env.SES_USERNAME || '';
const SES_PASSWORD = process.env.SES_PASSWORD || '';
const SES_SENDER = process.env.SES_SENDER || 'contact@ce.cogzi.io';
const SES_REGION = process.env.SES_REGION || 'ap-south-1';

console.log(`Testing AWS SES with the following configuration:`);
console.log(`Region: ${SES_REGION}`);
console.log(`Username available: ${SES_USERNAME ? 'Yes' : 'No'}`);
console.log(`Password available: ${SES_PASSWORD ? 'Yes' : 'No'}`);
console.log(`Sender email: ${SES_SENDER}`);

// Initialize AWS SES service with credentials
const sesConfig = {
  accessKeyId: SES_USERNAME,
  secretAccessKey: SES_PASSWORD,
  region: SES_REGION
};

// Create SES client
const ses = new AWS.SES(sesConfig);

// Test function to verify AWS SES identity
async function testSesIdentity() {
  try {
    console.log('Checking verified email identities...');
    const identities = await ses.listIdentities({
      IdentityType: 'EmailAddress',
      MaxItems: 10
    }).promise();
    
    console.log('Verified email identities:', identities.Identities);
    
    if (identities.Identities.includes(SES_SENDER)) {
      console.log(`Sender ${SES_SENDER} is verified`);
    } else {
      console.log(`⚠️ Warning: Sender ${SES_SENDER} is NOT verified. Email sending will fail.`);
    }
    
    return true;
  } catch (error) {
    console.error('Error checking SES identities:', error);
    return false;
  }
}

// Run tests
async function runTests() {
  try {
    const identityTest = await testSesIdentity();
    
    if (identityTest) {
      console.log('✅ AWS SES credentials appear to be valid');
    } else {
      console.log('❌ AWS SES credential test failed');
    }
  } catch (error) {
    console.error('Test execution error:', error);
  }
}

runTests();