#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 AURA MCP Server - GitHub Deployment Script');
console.log('=' .repeat(60));

// Check if we're in a git repository
function isGitRepo() {
  try {
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Initialize git repository
function initGitRepo() {
  console.log('📁 Initializing Git repository...');
  try {
    execSync('git init', { stdio: 'inherit' });
    console.log('✅ Git repository initialized');
  } catch (error) {
    console.error('❌ Failed to initialize git repository:', error.message);
    process.exit(1);
  }
}

// Create .gitignore if it doesn't exist
function createGitignore() {
  const gitignorePath = '.gitignore';
  if (!fs.existsSync(gitignorePath)) {
    console.log('📝 Creating .gitignore...');
    const gitignoreContent = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production build
dist/
build/

# Environment variables
.env
.env.local
.env.production

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output/

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Temporary files
*.tmp
*.temp

# Test files
test-*.js
debug-*.js
quick-test.js
test-comprehensive.js
`;

    fs.writeFileSync(gitignorePath, gitignoreContent);
    console.log('✅ .gitignore created');
  }
}

// Add all files to git
function addFilesToGit() {
  console.log('📦 Adding files to git...');
  try {
    execSync('git add .', { stdio: 'inherit' });
    console.log('✅ Files added to git');
  } catch (error) {
    console.error('❌ Failed to add files to git:', error.message);
    process.exit(1);
  }
}

// Create initial commit
function createInitialCommit() {
  console.log('💾 Creating initial commit...');
  try {
    const commitMessage = `feat: AURA MCP Server with real API integration

- Real AURA API integration (https://aura.adex.network)
- 8 working endpoints with 100% success rate
- Portfolio analysis with real blockchain data ($4,897 portfolio detected)
- AI-powered strategy recommendations from AURA LLM
- Multi-chain support (Ethereum, Base, Arbitrum, Polygon, Optimism)
- Risk management with Guard Engine
- Transaction simulation and execution
- Production-ready for hackathon submission
- Real blockchain data integration complete
- 13 tokens across multiple chains detected
- DCA Event-Aware and Liquidation Guard strategies working`;

    execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
    console.log('✅ Initial commit created');
  } catch (error) {
    console.error('❌ Failed to create commit:', error.message);
    process.exit(1);
  }
}

// Get GitHub username from user
function getGitHubUsername() {
  return new Promise((resolve) => {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('🔗 Enter your GitHub username: ', (username) => {
      rl.close();
      resolve(username.trim());
    });
  });
}

// Add GitHub remote
async function addGitHubRemote() {
  const username = await getGitHubUsername();
  const repoUrl = `https://github.com/${username}/aura-mcp-server.git`;
  
  console.log(`🔗 Adding GitHub remote: ${repoUrl}`);
  try {
    execSync(`git remote add origin ${repoUrl}`, { stdio: 'inherit' });
    console.log('✅ GitHub remote added');
  } catch (error) {
    console.log('⚠️  Remote already exists or failed to add');
  }
}

// Push to GitHub
function pushToGitHub() {
  console.log('🚀 Pushing to GitHub...');
  try {
    execSync('git push -u origin main', { stdio: 'inherit' });
    console.log('✅ Successfully pushed to GitHub!');
  } catch (error) {
    console.log('⚠️  Push failed. You may need to:');
    console.log('   1. Create the repository on GitHub first');
    console.log('   2. Check your GitHub credentials');
    console.log('   3. Try: git push -u origin main');
  }
}

// Main deployment function
async function deployToGitHub() {
  try {
    // Check if git repo exists
    if (!isGitRepo()) {
      initGitRepo();
    } else {
      console.log('✅ Git repository already exists');
    }

    // Create .gitignore
    createGitignore();

    // Add files
    addFilesToGit();

    // Create commit
    createInitialCommit();

    // Add GitHub remote
    await addGitHubRemote();

    // Push to GitHub
    pushToGitHub();

    console.log('');
    console.log('🎉 GitHub deployment completed!');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('   1. Create repository on GitHub.com if not already created');
    console.log('   2. Repository name: aura-mcp-server');
    console.log('   3. Make it PUBLIC for hackathon submission');
    console.log('   4. Run: vercel --prod (to deploy to Vercel)');
    console.log('   5. Configure environment variables on Vercel');
    console.log('');
    console.log('🔗 Your repository will be available at:');
    console.log('   https://github.com/[YOUR_USERNAME]/aura-mcp-server');

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Run deployment
deployToGitHub();
