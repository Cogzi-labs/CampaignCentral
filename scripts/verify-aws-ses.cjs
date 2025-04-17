#!/usr/bin/env node
// Comprehensive AWS SES credential verification script
const AWS = require('aws-sdk');
const dotenv = require('dotenv');
const { promisify } = require('util');
const { exec: execCallback } = require('child_process');

// Promisify exec
const exec = promisify(execCallback);

// Load environment variables
dotenv.config();

// Get SES credentials from environment
const SES_USERNAME = process.env.SES_USERNAME || '';
const SES_PASSWORD = process.env.SES_PASSWORD || '';
const SES_SENDER = process.env.SES_SENDER || 'contact@ce.cogzi.io';
const SES_REGION = process.env.SES_REGION || 'ap-south-1';

// Set AWS SDK config globally
AWS.config.update({
  accessKeyId: SES_USERNAME,
  secretAccessKey: SES_PASSWORD,
  region: SES_REGION,
});

// Create SES client
const ses = new AWS.SES({
  apiVersion: '2010-12-01',
  region: SES_REGION,
});

console.log(`
======== AWS SES CONFIGURATION VALIDATION ========
Username: ${SES_USERNAME ? '✓ Present' : '✗ Missing'}
Password: ${SES_PASSWORD ? '✓ Present' : '✗ Missing'}
Region: ${SES_REGION}
Sender: ${SES_SENDER}
AWS SDK Version: ${AWS.VERSION}
`);

// Test IAM permissions
async function testIamPermissions() {
  try {
    const iam = new AWS.IAM();
    console.log('Testing IAM GetUser (to check credential validity)...');
    const userData = await iam.getUser().promise();
    console.log(`✓ Credentials valid! Authenticated as: ${userData.User.UserName}`);
    console.log(`Account ID: ${userData.User.Arn.split(':')[4]}`);
    console.log(`User ARN: ${userData.User.Arn}`);
    return true;
  } catch (error) {
    console.log(`✗ IAM test failed: ${error.code} - ${error.message}`);
    
    if (error.code === 'AccessDenied') {
      console.log('Note: This could be normal if your IAM user only has SES permissions');
      return true; // Still proceed with SES tests
    }
    
    // These errors indicate credential issues
    if (['UnrecognizedClientException', 'InvalidClientTokenId', 'SignatureDoesNotMatch'].includes(error.code)) {
      console.log('\n⚠️ CRITICAL CREDENTIAL ERROR: Your AWS credentials appear to be invalid');
      console.log('Possible causes:');
      console.log('1. The Access Key ID is incorrect or was deleted/deactivated');
      console.log('2. The Secret Access Key is incorrect');
      console.log('3. Your system clock is out of sync (affects signature calculation)');
      return false;
    }
    
    return false;
  }
}

// Test SES functionality
async function testSes() {
  try {
    console.log('\nTesting SES GetIdentityVerificationAttributes...');
    const identities = await ses.listIdentities({
      IdentityType: 'EmailAddress',
      MaxItems: 10
    }).promise();
    
    console.log(`✓ SES API access works! Found ${identities.Identities.length} verified identities`);
    console.log('Verified email identities:', identities.Identities);
    
    if (identities.Identities.includes(SES_SENDER)) {
      console.log(`✓ Sender ${SES_SENDER} is verified - good to go!`);
    } else {
      console.log(`⚠️ Warning: Sender ${SES_SENDER} is NOT in the verified identities list`);
      console.log('Email sending will likely fail - verify this email in AWS SES console');
    }
    
    return true;
  } catch (error) {
    console.log(`✗ SES test failed: ${error.code} - ${error.message}`);
    
    if (error.code === 'SignatureDoesNotMatch') {
      console.log('\n⚠️ SIGNATURE ERROR: The request signature calculation failed');
      console.log('Possible causes:');
      console.log('1. Secret Access Key is incorrect');
      console.log('2. AWS region mismatch between credentials and API calls');
      console.log('3. System clock is not synchronized');
      
      // Try to check system time
      try {
        console.log('\nChecking system time...');
        const { stdout } = await exec('date');
        console.log(`System time: ${stdout.trim()}`);
        
        const now = new Date();
        console.log(`JavaScript time: ${now.toISOString()}`);
        
        const timeDiff = Math.abs(now.getTime() - new Date(stdout.trim()).getTime());
        if (timeDiff > 300000) { // More than 5 minutes
          console.log('⚠️ Your system clock might be off by more than 5 minutes');
          console.log('This can cause AWS signature validation failures');
        }
      } catch (e) {
        console.log('Could not check system time');
      }
    }
    
    return false;
  }
}

// Run tests
async function runTests() {
  try {
    const credentialsValid = await testIamPermissions();
    if (!credentialsValid) {
      console.log('\n❌ AWS credential check failed. Email functionality will not work.');
      return;
    }
    
    const sesValid = await testSes();
    if (sesValid) {
      console.log('\n✅ AWS SES configuration appears to be valid!');
    } else {
      console.log('\n❌ AWS SES configuration test failed. Email functionality will not work.');
    }
  } catch (error) {
    console.error('Test execution error:', error);
  }
}

runTests();