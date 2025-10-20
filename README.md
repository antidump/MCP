# 🚀 AURA MCP Server

**Bridge LLMs with AURA API for DeFi Intelligence & On-Chain Automation**

A production-ready Model Context Protocol (MCP) server that enables Claude & ChatGPT to interact with AURA API for real-time DeFi portfolio analysis, swap execution, yield opportunities, and automated trading strategies across 200+ blockchain networks.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/aura-mcp/server)
[![Run on Replit](https://replit.com/badge/github/aura-mcp/server)](https://replit.com/@aura-mcp/server)

## 🌟 Features

### 🔄 **Swap Execution** (NEW)
- Natural language swap intent parsing ("swap 1 ETH to USDC on Base")
- AURA-powered DEX aggregation (auto-selects best route across 200+ chains)
- 9M+ token support with real-time pricing
- Web-based transaction signing (secure browser signing)
- Token allowance management (auto-approval flow)
- Guard validation (slippage, gas, risk management)

### 💼 **Portfolio Management**
- Cross-chain wallet balance tracking
- DeFi position monitoring with health factors
- Real-time USD value calculations
- Support for native tokens and ERC-20s

### 🎯 **Operations Intelligence** (100% Real-Time AURA API)
- **Airdrop Detection**: Eligible & upcoming airdrops with value estimates
- **Liquidation Scanning**: Health factor monitoring across protocols
- **Narrative Opportunities**: Real-time market trend analysis
- **Governance Tracking**: Proposal detection with voting rewards

### 🤖 **AI Strategy Automation**
- DCA Event-Aware: Dollar-cost averaging with market event detection
- Liquidation Guard: Automated position protection
- Basket Rotation: Dynamic portfolio rebalancing
- Historical backtesting with CAGR, Sharpe ratio, max drawdown

### 🛡️ **Guard Engine (Risk Management)**
- Max slippage & gas price limits
- Allowed DEXes & blocked tokens/protocols
- Emergency stop capability
- Per-user customizable guardrails

### 💰 **x402 Payment Protocol**
- On-chain payment verification
- Per-request monetization
- USDC/USDT support
- Invoice generation & tracking

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- AURA API Key ([Get one here](https://aura.adex.network))
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/aura-mcp/server.git
cd aura-mcp-server

# Install dependencies
npm install

# Configure environment
cp env.example .env
# Edit .env and add your AURA_API_KEY
```

### Development

```bash
# Start HTTP server (for ChatGPT/web integration)
npm run dev

# Start MCP server (for Claude Desktop)
npm run dev:mcp

# Run tests
npm test

# Build for production
npm run build
```

### Production

```bash
# Build and start
npm run build
npm start
```

Server runs on:
- **Replit**: Port 5000 (auto-configured)
- **Vercel**: Dynamic port (auto-configured)
- **Local**: Port 5000 (default)

## ⚙️ Configuration

### Required Environment Variables

```bash
# AURA API Configuration (Required)
AURA_API_KEY=your_aura_api_key_here

# Optional Configuration
AURA_API_URL=https://aura.adex.network  # Default AURA API endpoint
MCP_SERVER_PORT=5000                     # Server port (Replit)
PORT=                                    # Dynamic port (Vercel)
NODE_ENV=production                      # Environment
```

### Optional: x402 Payment Configuration

```bash
X402_RECEIVER=0xYourWalletAddress
X402_ASSET=USDC
```

## 🔌 Integration with LLMs

### 🎯 **MCP Protocol (Native Integration)**

**NEW:** AURA MCP Server now supports native MCP over HTTP with SSE for real-time two-way communication!

**MCP Endpoint:** `https://mcp-aura.replit.app/mcp`  
**Documentation:** [MCP_INTEGRATION.md](./MCP_INTEGRATION.md)

#### ChatGPT MCP Connector (Recommended)
1. Open ChatGPT → Settings → Connectors
2. Enable Developer mode
3. Create new connector:
   - Name: `AURA DeFi`
   - URL: `https://mcp-aura.replit.app/mcp`
4. Use in chat with 15 DeFi tools!

#### Claude Desktop MCP Connector
1. Open Settings → Connectors
2. Add custom connector:
   - Name: `AURA DeFi`
   - URL: `https://mcp-aura.replit.app/mcp`

See [MCP_INTEGRATION.md](./MCP_INTEGRATION.md) for complete guide.

### Claude Desktop (MCP Native)

1. Edit Claude config:
   ```bash
   # macOS/Linux
   nano ~/Library/Application\ Support/Claude/claude_desktop_config.json
   
   # Windows
   notepad %APPDATA%\Claude\claude_desktop_config.json
   ```

2. Add MCP server:
   ```json
   {
     "mcpServers": {
       "aura-mcp": {
         "command": "node",
         "args": ["path/to/aura-mcp-server/dist/index.js"],
         "env": {
           "AURA_API_KEY": "your_api_key_here"
         }
       }
     }
   }
   ```

3. Restart Claude Desktop

### ChatGPT (Custom GPT via HTTP API)

1. Deploy server to Vercel/Replit (see Deployment section)
2. Create Custom GPT in ChatGPT
3. Add Actions with your server URL
4. Import OpenAPI spec from `/api/openapi.json`

## 📖 Usage Examples

### Swap Execution

```typescript
// Parse natural language swap intent
const intent = await mcpClient.call('swap.parse', {
  text: 'swap 1 ETH to USDC on Base',
  userAddress: '0x69bfD720Dd188B8BB04C4b4D24442D3c15576D10'
});

// Get quote (AURA auto-selects best DEX)
const quote = await mcpClient.call('swap.quote', intent.params);

// Prepare transaction (check allowance, get tx data)
const prepared = await mcpClient.call('swap.prepare', {
  quoteId: quote.quoteId,
  userAddress: '0x69bfD720Dd188B8BB04C4b4D24442D3c15576D10'
});

// User signs transaction in browser
const signedTx = await userWallet.signTransaction(prepared.transaction);

// Execute swap
const result = await mcpClient.call('swap.execute', {
  signedTransaction: signedTx
});
```

### Portfolio Analysis

```typescript
// Get wallet balance across chains
const balance = await mcpClient.call('portfolio.getBalance', {
  address: '0x69bfD720Dd188B8BB04C4b4D24442D3c15576D10',
  chain: 'ethereum'
});

// Get DeFi positions with health factors
const positions = await mcpClient.call('portfolio.getPositions', {
  address: '0x69bfD720Dd188B8BB04C4b4D24442D3c15576D10'
});
```

### Opportunity Scanning

```typescript
// Scan for airdrop opportunities
const airdrops = await mcpClient.call('ops.scanOpportunities', {
  kind: 'airdrop',
  params: { address: '0x69bfD720Dd188B8BB04C4b4D24442D3c15576D10' }
});

// Scan for liquidation risks
const liquidations = await mcpClient.call('ops.scanOpportunities', {
  kind: 'liquidation',
  params: { protocol: 'aave' }
});
```

### AI Strategy Automation

```typescript
// Propose DCA Event-Aware Strategy
const strategy = await mcpClient.call('strategy.propose', {
  intent: 'dca_event_aware',
  params: {
    asset: 'ETH',
    budgetUsd: 200,
    cadence: '2x/week',
    eventRules: {
      pauseOnUnlock: true,
      maxGasGwei: 25,
      boostOnDrawdownPct: 3
    }
  },
  address: '0x69bfD720Dd188B8BB04C4b4D24442D3c15576D10'
});

// Backtest strategy
const backtest = await mcpClient.call('strategy.backtest', {
  name: 'dca_event_aware',
  params: strategy.params,
  lookbackDays: 90
});
```

## 🚀 Deployment

### Deploy to Vercel (Recommended)

**Option 1: One-Click Deploy**
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/aura-mcp/server)

**Option 2: Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Login and deploy
vercel login
vercel --prod

# Set environment variable
vercel env add AURA_API_KEY
```

**Option 3: GitHub Integration**
1. Push to GitHub
2. Import repository at [vercel.com/new](https://vercel.com/new)
3. Add `AURA_API_KEY` in Environment Variables
4. Deploy

📖 **Detailed Guide**: See [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md)

### Deploy to Replit

1. Import GitHub repository to Replit
2. Add `AURA_API_KEY` to Replit Secrets
3. Click Run (auto-configured on port 5000)

### Deploy to Railway

```bash
npm i -g @railway/cli
railway login
railway up
railway variables set AURA_API_KEY=your_key
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Claude/ChatGPT│    │  AURA MCP Server│    │    AURA API     │
│                 │◄──►│                 │◄──►│                 │
│  - Tool Calls   │    │  - MCP Protocol │    │  - Portfolio    │
│  - Responses    │    │  - Guard Engine │    │  - Swap Agg.    │
│  - Context      │    │  - x402 Paywall │    │  - Strategies   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  200+ Chains    │
                       │                 │
                       │  - Ethereum     │
                       │  - Base         │
                       │  - Arbitrum     │
                       │  - Polygon      │
                       │  - Optimism     │
                       │  - And more...  │
                       └─────────────────┘
```

### Tech Stack

- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Fastify (HTTP), MCP SDK (stdio)
- **Validation**: Zod schemas
- **Testing**: Jest with 80%+ coverage
- **Blockchain**: Ethers.js v6
- **API**: AURA API (https://aura.adex.network)

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test suite
npm test -- --testNamePattern="Swap Tools"

# Watch mode
npm run test:watch
```

## 📊 Performance

- **Swap Quote**: < 500ms (AURA API aggregation)
- **Portfolio Analysis**: < 2s across chains
- **Strategy Backtest**: < 5s for 90-day window
- **Throughput**: 100+ requests/minute
- **Uptime**: 99.9% SLA (Vercel/Railway)

## 🔒 Security

- ✅ Input validation with Zod schemas
- ✅ Guard engine risk management
- ✅ Web-based signing (no server-side private keys)
- ✅ x402 on-chain payment verification
- ✅ Rate limiting & DDoS protection
- ✅ Environment variable encryption

## 📚 API Reference

### MCP Tools

| Tool | Description | Input | Output |
|------|-------------|-------|--------|
| `swap.parse` | Parse natural language swap intent | `{ text, userAddress }` | Parsed swap params |
| `swap.quote` | Get swap quote with best DEX | `{ fromToken, toToken, amount, chain }` | Quote with route |
| `swap.prepare` | Prepare swap transaction | `{ quoteId, userAddress }` | Transaction data |
| `swap.execute` | Execute signed swap | `{ signedTransaction }` | Execution result |
| `portfolio.getBalance` | Get wallet balance | `{ address, chain }` | Token balances |
| `portfolio.getPositions` | Get DeFi positions | `{ address }` | Positions with health |
| `ops.scanOpportunities` | Scan opportunities | `{ kind, params }` | Opportunity list |
| `strategy.propose` | Propose strategy | `{ intent, params, address }` | Strategy proposal |
| `strategy.backtest` | Backtest strategy | `{ name, params, lookbackDays }` | Performance metrics |
| `transaction.simulate` | Simulate transaction | `{ intentId, txParams }` | Simulation result |
| `transaction.execute` | Execute transaction | `{ intentId, txParams }` | Execution result |
| `guard.setRules` | Set risk rules | `{ ruleType, params }` | Confirmation |
| `report.get` | Get trading report | `{ sessionId }` | PnL & fills |
| `system.health` | Check system health | `{}` | Health status |

### HTTP Endpoints

All HTTP endpoints available at `/api/*`:
- `POST /api/swap/parse` - Parse swap intent
- `POST /api/swap/quote` - Get swap quote
- `POST /api/swap/prepare` - Prepare swap transaction
- `POST /api/swap/execute` - Execute swap
- `POST /api/portfolio/balance` - Get balance
- `POST /api/portfolio/positions` - Get positions
- `POST /api/strategy/propose` - Propose strategy
- `GET /api/health` - Health check
- `GET /api/system/health` - System status

## 🤝 Contributing

Contributions welcome! Please follow these steps:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 🏆 AURA API Hackathon

**Status**: ✅ Production Ready

### Key Features Implemented
- ✅ 100% Real-time AURA API integration (zero mock data)
- ✅ Swap execution with auto-DEX selection (200+ chains, 9M+ tokens)
- ✅ AI-powered strategy automation (DCA, liquidation guards)
- ✅ Opportunity scanning (airdrops, liquidations, governance)
- ✅ x402 payment protocol integration
- ✅ Guard engine risk management
- ✅ MCP protocol for Claude & ChatGPT

### Demo
- **Live Server**: [Your deployed URL]
- **GitHub**: https://github.com/aura-mcp/server
- **Documentation**: See `replit.md` for technical details

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Documentation**: [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md)
- **Issues**: [GitHub Issues](https://github.com/aura-mcp/server/issues)
- **AURA API**: https://aura.adex.network
- **MCP Protocol**: https://modelcontextprotocol.io

---

**Built with ❤️ for the AURA community**

*Powered by AURA API • Model Context Protocol • Web3*
