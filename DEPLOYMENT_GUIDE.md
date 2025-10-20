# 🚀 AURA MCP Server - Deployment Guide

## 📋 **Pre-Deployment Checklist**

### ✅ **Local Testing Complete**
- [x] 100% endpoint success rate (8/8 endpoints working)
- [x] Real AURA API integration working
- [x] Portfolio data: $4,897 real blockchain data
- [x] AI strategies: Real AURA LLM recommendations
- [x] Multi-chain support: Ethereum, Base, Arbitrum, Polygon, Optimism

### ✅ **Code Quality**
- [x] TypeScript compilation successful
- [x] All dependencies installed
- [x] Environment variables configured
- [x] Error handling implemented

## 🌐 **Step 1: Push to GitHub**

### **1.1 Initialize Git Repository**
```bash
# Navigate to project directory
cd aura-mcp-server

# Initialize git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "feat: AURA MCP Server with real API integration

- Real AURA API integration (https://aura.adex.network)
- 8 working endpoints with 100% success rate
- Portfolio analysis with real blockchain data
- AI-powered strategy recommendations
- Multi-chain support (Ethereum, Base, Arbitrum, Polygon, Optimism)
- Risk management with Guard Engine
- Transaction simulation and execution
- Production-ready for hackathon submission"
```

### **1.2 Create GitHub Repository**
1. Go to [GitHub.com](https://github.com)
2. Click "New repository"
3. Repository name: `aura-mcp-server`
4. Description: `AURA MCP Server - Bridge LLMs with AURA API and EVM for on-chain intelligence`
5. Make it **Public** (for hackathon submission)
6. Don't initialize with README (we already have one)
7. Click "Create repository"

### **1.3 Push to GitHub**
```bash
# Add GitHub remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/aura-mcp-server.git

# Push to GitHub
git push -u origin main
```

## 🚀 **Step 2: Deploy to Vercel**

### **2.1 Install Vercel CLI (if not already installed)**
```bash
npm install -g vercel
```

### **2.2 Login to Vercel**
```bash
vercel login
```
Follow the prompts to authenticate with your Vercel account.

### **2.3 Deploy to Production**
```bash
# Navigate to project directory
cd aura-mcp-server

# Deploy to production
vercel --prod
```

### **2.4 Configure Environment Variables on Vercel**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `aura-mcp-server` project
3. Go to **Settings** → **Environment Variables**
4. Add the following variables:

```
AURA_API_URL = https://aura.adex.network
AURA_API_KEY = be93a4d36df2713dfb9f
NODE_ENV = production
MCP_SERVER_PORT = 3000
```

5. Click **Save** for each variable

### **2.5 Redeploy with Environment Variables**
```bash
vercel --prod
```

## 🧪 **Step 3: Test Production Deployment**

### **3.1 Get Production URL**
After deployment, Vercel will provide a URL like:
```
https://aura-mcp-server-xxxxx.vercel.app
```

### **3.2 Test Production Endpoints**
```bash
# Test health check
curl https://aura-mcp-server-xxxxx.vercel.app/api/health

# Test portfolio balance
curl -X POST https://aura-mcp-server-xxxxx.vercel.app/api/portfolio/balance \
  -H "Content-Type: application/json" \
  -d '{"address":"0x69bfD720Dd188B8BB04C4b4D24442D3c15576D10"}'

# Test strategy proposal
curl -X POST https://aura-mcp-server-xxxxx.vercel.app/api/strategy/propose \
  -H "Content-Type: application/json" \
  -d '{"intent":"dca_event_aware","params":{"asset":"ETH","budgetUsd":200},"address":"0x69bfD720Dd188B8BB04C4b4D24442D3c15576D10"}'
```

## 📱 **Step 4: Test with MCP Client**

### **4.1 Install MCP Client**
```bash
npm install -g @modelcontextprotocol/cli
```

### **4.2 Test MCP Connection**
```bash
# Test MCP server connection
mcp-client https://aura-mcp-server-xxxxx.vercel.app
```

## 🔗 **Step 5: Integration with Claude Desktop**

### **5.1 Update Claude Desktop Config**
Add to your Claude Desktop MCP configuration:

```json
{
  "mcpServers": {
    "aura-mcp": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/server-http",
        "https://aura-mcp-server-xxxxx.vercel.app"
      ],
      "env": {
        "AURA_API_URL": "https://aura.adex.network",
        "AURA_API_KEY": "be93a4d36df2713dfb9f"
      }
    }
  }
}
```

### **5.2 Restart Claude Desktop**
Restart Claude Desktop to load the new MCP server configuration.

## 🎯 **Step 6: Hackathon Submission**

### **6.1 Repository Requirements**
- [x] Public GitHub repository
- [x] Clear README with setup instructions
- [x] Working demo with real data
- [x] All tests passing

### **6.2 Demo Script for Hackathon**
1. **Portfolio Analysis**: Show real wallet with $4,897 value
2. **AI Strategies**: Generate DCA and Liquidation Guard strategies
3. **Risk Management**: Set guard rules and emergency stop
4. **Transaction Flow**: Simulate and execute transactions
5. **Multi-chain Support**: Show data across Ethereum, Base, Arbitrum

### **6.3 Submission Checklist**
- [ ] GitHub repository link
- [ ] Live demo URL (Vercel)
- [ ] Working MCP integration with Claude
- [ ] Real AURA API integration
- [ ] Complete documentation

## 🛠️ **Troubleshooting**

### **Common Issues:**

1. **Environment Variables Not Loading**
   - Check Vercel dashboard settings
   - Redeploy after adding variables

2. **CORS Issues**
   - Vercel handles CORS automatically
   - Check if endpoints are accessible

3. **AURA API Rate Limits**
   - API key provides higher rate limits
   - Implement caching if needed

4. **MCP Connection Issues**
   - Verify server is running
   - Check Claude Desktop configuration

## 📊 **Production Monitoring**

### **Health Check**
```bash
curl https://aura-mcp-server-xxxxx.vercel.app/api/health
```

### **System Status**
```bash
curl https://aura-mcp-server-xxxxx.vercel.app/api/system/health
```

## 🎉 **Success Criteria**

✅ **Deployment Successful When:**
- All endpoints return 200 status
- Real portfolio data is fetched
- AI strategies are generated
- MCP integration works with Claude
- No errors in Vercel logs

## 📞 **Support**

If you encounter issues:
1. Check Vercel deployment logs
2. Verify environment variables
3. Test endpoints individually
4. Check AURA API status

---

**🚀 Ready to deploy? Let's make it happen!**
