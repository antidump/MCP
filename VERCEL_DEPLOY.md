# Vercel Deployment Guide

## Quick Deploy to Vercel

### Prerequisites
- GitHub account
- Vercel account (sign up at https://vercel.com)
- AURA API key (get from https://aura.adex.network)

### Deployment Steps

#### Option 1: Using Vercel Dashboard (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Vercel will auto-detect the Node.js project

3. **Configure Environment Variables**
   - In Vercel dashboard, go to Settings → Environment Variables
   - Add: `AURA_API_KEY` = your_api_key_here
   - Add: `NODE_ENV` = production

4. **Deploy**
   - Click "Deploy"
   - Your app will be live at: `https://your-app.vercel.app`

#### Option 2: Using Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   # First deployment (creates project)
   vercel
   
   # Production deployment
   vercel --prod
   ```

4. **Set Environment Variables**
   ```bash
   vercel env add AURA_API_KEY
   # Enter your API key when prompted
   ```

#### Option 3: Automated Script

```bash
# Run the deployment script
node deploy-to-vercel.js
```

### Vercel Configuration

The project includes `vercel.json` with optimized settings:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/",
      "dest": "dist/http-server.js"
    },
    {
      "src": "/api/(.*)",
      "dest": "dist/http-server.js"
    }
  ]
}
```

### Testing Your Deployment

1. **Check Health Endpoint**
   ```bash
   curl https://your-app.vercel.app/api/health
   ```

2. **Test Swap API**
   ```bash
   curl -X POST https://your-app.vercel.app/api/swap/parse \
     -H "Content-Type: application/json" \
     -d '{"text": "swap 1 ETH to USDC on Base"}'
   ```

### Port Configuration

The server automatically uses Vercel's dynamic port:
- `process.env.PORT` (Vercel)
- Falls back to `5000` for local development

### Troubleshooting

**Build Errors:**
- Make sure all TypeScript files compile: `npm run build`
- Check that all .js extensions are present in imports

**API Errors:**
- Verify AURA_API_KEY is set in Vercel environment variables
- Check function logs in Vercel dashboard

**Module Not Found:**
- Clear Vercel cache and redeploy
- Ensure all dependencies are in package.json (not devDependencies for runtime)

### Performance Tips

1. **Enable Edge Functions** (if supported)
2. **Use Vercel Analytics** for monitoring
3. **Set up custom domain** for production use
4. **Enable caching** for static assets

### Support

- Vercel Docs: https://vercel.com/docs
- AURA API Docs: https://aura.adex.network/docs
- GitHub Issues: Report bugs in your repository
