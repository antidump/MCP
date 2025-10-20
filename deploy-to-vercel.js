#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🚀 AURA MCP Server - Vercel Deployment Script');
console.log('=' .repeat(60));

// Check if Vercel CLI is installed
function checkVercelCLI() {
  try {
    execSync('vercel --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Install Vercel CLI
function installVercelCLI() {
  console.log('📦 Installing Vercel CLI...');
  try {
    execSync('npm install -g vercel', { stdio: 'inherit' });
    console.log('✅ Vercel CLI installed');
  } catch (error) {
    console.error('❌ Failed to install Vercel CLI:', error.message);
    console.log('💡 Try running: npm install -g vercel');
    process.exit(1);
  }
}

// Login to Vercel
function loginToVercel() {
  console.log('🔐 Logging in to Vercel...');
  console.log('💡 This will open your browser for authentication');
  try {
    execSync('vercel login', { stdio: 'inherit' });
    console.log('✅ Successfully logged in to Vercel');
  } catch (error) {
    console.error('❌ Failed to login to Vercel:', error.message);
    console.log('💡 Please run: vercel login');
    process.exit(1);
  }
}

// Deploy to Vercel
function deployToVercel() {
  console.log('🚀 Deploying to Vercel...');
  try {
    execSync('vercel --prod', { stdio: 'inherit' });
    console.log('✅ Successfully deployed to Vercel!');
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    console.log('💡 Try running: vercel --prod');
    process.exit(1);
  }
}

// Get deployment URL
function getDeploymentURL() {
  try {
    const output = execSync('vercel ls', { encoding: 'utf8' });
    console.log('📋 Recent deployments:');
    console.log(output);
  } catch (error) {
    console.log('⚠️  Could not retrieve deployment list');
  }
}

// Main deployment function
function deployToVercelMain() {
  try {
    // Check Vercel CLI
    if (!checkVercelCLI()) {
      installVercelCLI();
    } else {
      console.log('✅ Vercel CLI already installed');
    }

    // Login to Vercel
    console.log('');
    console.log('🔐 Authentication required...');
    loginToVercel();

    // Deploy to production
    console.log('');
    deployToVercel();

    // Show deployment info
    console.log('');
    console.log('📋 Deployment completed!');
    getDeploymentURL();

    console.log('');
    console.log('⚙️  IMPORTANT: Configure Environment Variables on Vercel Dashboard');
    console.log('');
    console.log('📋 Environment Variables to Add:');
    console.log('   AURA_API_URL = https://aura.adex.network');
    console.log('   AURA_API_KEY = be93a4d36df2713dfb9f');
    console.log('   NODE_ENV = production');
    console.log('   MCP_SERVER_PORT = 3000');
    console.log('');
    console.log('🔗 Steps:');
    console.log('   1. Go to https://vercel.com/dashboard');
    console.log('   2. Select your aura-mcp-server project');
    console.log('   3. Go to Settings → Environment Variables');
    console.log('   4. Add the variables above');
    console.log('   5. Redeploy: vercel --prod');
    console.log('');
    console.log('🧪 Test your deployment:');
    console.log('   curl https://your-project.vercel.app/api/health');

  } catch (error) {
    console.error('❌ Deployment process failed:', error.message);
    process.exit(1);
  }
}

// Run deployment
deployToVercelMain();
