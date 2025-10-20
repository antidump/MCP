# AURA MCP Server

## Overview

AURA MCP Server is a Model Context Protocol (MCP) implementation that bridges Large Language Models (LLMs) like Claude and ChatGPT with the AURA API and Ethereum Virtual Machine (EVM) networks. It enables AI-powered DeFi portfolio analysis, yield opportunity discovery, automated trading strategy execution, and risk management across multiple blockchain networks.

The server provides a comprehensive toolkit for on-chain intelligence, combining real-time blockchain data analysis with AI-driven decision-making capabilities. It supports multi-chain operations (Ethereum, Base, Arbitrum, Polygon, Optimism) and includes sophisticated risk management through a configurable Guard Engine.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### October 11, 2025 - Native MCP Protocol Support (HTTP + SSE) ✅
- **MCP over HTTP Implementation** - Full Model Context Protocol support with Server-Sent Events
- Endpoints: POST /mcp (JSON-RPC 2.0) and GET /mcp/stream (SSE real-time updates)
- Protocol version 2024-11-05 with complete capabilities support
- **15 MCP Tools Registered:**
  - Portfolio: getBalance, getPositions
  - Operations: scanOpportunities (airdrops, liquidations, narratives, governance)
  - Strategy: propose, backtest
  - Swap: parse, quote, prepare, execute (natural language + DEX aggregation)
  - Transaction: simulate, execute
  - Guard: setRules, setEmergencyStop
  - Report: get
  - System: health
- **3 MCP Prompts:** analyze_portfolio, find_opportunities, execute_swap
- **2 MCP Resources:** aura://portfolio, aura://opportunities
- **ChatGPT/Claude Integration:** Direct connector support via MCP protocol
- SSE streaming with heartbeat (30s keep-alive) for real-time updates
- JSON-RPC 2.0 message handling: initialize, tools/list, tools/call, resources/list, prompts/list
- Shared tools registry for consistency between stdio and HTTP transports
- Documentation: MCP_INTEGRATION.md with setup guides for ChatGPT and Claude
- Local testing: All endpoints verified working (initialize, list tools, call tools, SSE stream)
- Production ready: Re-publish required to update live deployment at mcp-aura.replit.app

### October 10, 2025 - 100% Real-Time AURA API Integration ✅
- **ALL FEATURES NOW REAL-TIME** - Zero mock data, all production endpoints live
- **Operations Intelligence:**
  - Airdrop detection using native AURA API (eligible/upcoming airdrops with value estimates)
  - Liquidation risk scanning with health factor monitoring across protocols
  - Narrative/trend opportunities from real-time market analysis
  - Governance proposal detection with voting rewards tracking
- **Smart Fallback Strategy:** 
  - Primary endpoints: /api/opportunities/* 
  - Fallback endpoints: /api/portfolio/* for compatibility
  - Graceful error handling (returns empty array, no crashes)
- All data now sourced directly from AURA's blockchain intelligence engine

### October 10, 2025 - Swap Feature Implementation (PRODUCTION READY ✅)
- **Complete Swap System** - Full swap functionality with natural language support
- AURA API integration for automatic best DEX selection across 200+ chains and 9M+ tokens
- Intent parser supporting commands like "swap 1 ETH to USDC on Base"
- Web-based transaction signing (user signs in browser, server only broadcasts)
- Token allowance flow with automatic approval handling
- Guard engine integration for swap risk validation
- x402 payment gate for monetized swap execution
- API endpoints: /api/swap/parse, /api/swap/quote, /api/swap/prepare, /api/swap/execute
- **Critical Bug Fixes:**
  - Fixed quote response to include chain, quoteId, routeId for proper AURA transaction building
  - Fixed buildSwapTransaction to send complete context (quoteId, routeId, chain, tokens) to AURA
  - Fixed prepare method to get real contract addresses and calldata from AURA (not placeholders)
  - Added comprehensive unit tests for prepare/execute flows
- Architect approved: Swap flow is end-to-end functional and production-ready

### October 10, 2025 - Dual Deployment Support (Replit + Vercel) ✅
- **Dual Platform Compatibility** - Server now works seamlessly on both Replit and Vercel
- Dynamic port configuration: PORT (Vercel) || MCP_SERVER_PORT (Replit) || 5000 (fallback)
- Fixed all TypeScript ES module imports (.js extensions) for Node16 module resolution
- Removed path alias (@/types) in favor of relative imports for better compatibility
- Updated tsconfig.json module setting from ESNext to Node16
- Added vercel-build script to package.json
- Optimized vercel.json routing for both root and API endpoints
- All TypeScript compilation errors resolved - production build successful
- **Security Enhancement**: Removed all hard-coded API keys, now requires AURA_API_KEY environment variable
- Configured Replit workflow for development server on port 5000
- Optimized landing page handler with startup caching for better performance
- All API endpoints verified and working correctly on both platforms

## System Architecture

### Core Components

**MCP Server Architecture**
- Built on @modelcontextprotocol/sdk for standardized LLM integration
- Dual transport support: stdio for direct MCP clients, HTTP/Fastify for web access
- TypeScript-first implementation with Zod schema validation
- Modular tool system with 7 distinct capability domains

**AURA API Integration**
- Central adapter pattern for AURA API communication (https://aura.adex.network)
- Real-time portfolio balance and position tracking across chains
- AI-powered strategy recommendations using AURA's LLM
- Handles multi-chain data aggregation and normalization
- Configurable timeout and API key management

**Guard Engine (Risk Management)**
- Rule-based transaction validation system
- Four guard types: risk, gas, route, and deny lists
- Pre-simulation and pre-execution validation hooks
- Configurable per-user guardrails with emergency stop capability
- Validates slippage limits, gas prices, health factors, and protocol restrictions

### Tool Modules

**Portfolio Tools**
- Cross-chain wallet balance retrieval
- DeFi position monitoring with health factors
- Real-time USD value calculations
- Support for native tokens and ERC-20s

**Operations Tools**
- Opportunity scanning (liquidations, airdrops, narratives, governance)
- Multi-strategy opportunity detection
- Protocol-specific opportunity analysis

**Strategy Tools**
- Strategy proposal generation (DCA, liquidation guards, basket rotation)
- Historical backtesting with performance metrics (CAGR, Sharpe, max drawdown)
- Event-aware strategy configuration
- Integration with AURA's AI recommendations

**Transaction Tools**
- Transaction simulation with cost estimation
- Guard-validated execution pipeline
- x402 payment protocol support for monetization
- Multi-step transaction orchestration

**Guard Tools**
- Dynamic rule configuration
- Real-time risk parameter updates
- Support for allowlists/denylists

**Report Tools**
- Trading history and fill tracking
- PnL calculation and performance metrics
- Session-based reporting

**System Tools**
- Health monitoring and uptime tracking
- Dependency status checking
- Version management

**Swap Tools** (NEW)
- Natural language intent parser ("swap 1 ETH to USDC on Base")
- AURA-powered quote aggregation (auto-selects best DEX across 200+ chains)
- Token allowance management (auto-check and prepare approvals)
- Web-based transaction signing (secure browser-based signing)
- Guard validation (slippage, gas, risk management)
- x402 payment gate for premium access

### Strategy Plugins

**DCA Event-Aware Plugin**
- Dollar-cost averaging with market event detection
- Pause triggers on token unlocks
- Gas-price aware execution
- Drawdown-based buy amplification

**Liquidation Guard Plugin**
- Automated health factor monitoring
- Auto-repay triggers for position protection
- Multi-protocol support (Aave, Compound)
- Emergency position closure

### Data Layer

**Type System**
- Comprehensive Zod schemas for runtime validation
- Shared types across common, portfolio, strategy, transaction, guard, report, and system domains
- Type-safe request/response handling
- Address and transaction hash validation

**Configuration**
- JSON-based chain configuration (chains.json)
- Default guard rules (guards.json)
- Environment-based secrets management
- Multi-chain RPC endpoint configuration

### Testing Architecture

**Unit Tests**
- Component-level testing for AuraAdapter, GuardEngine, and tool modules
- Mock-based isolation with Jest
- Type-safe test fixtures

**Integration Tests**
- End-to-end strategy flows (propose → simulate → execute)
- x402 payment protocol validation
- Multi-component interaction testing

## External Dependencies

**Core Infrastructure**
- AURA API (https://aura.adex.network) - DeFi data aggregation and AI strategy generation
- Model Context Protocol SDK (@modelcontextprotocol/sdk) - LLM integration framework
- Fastify - High-performance HTTP server
- Ethers.js - Ethereum blockchain interaction

**Blockchain Networks**
- Ethereum Mainnet (Chain ID: 1)
- Base (Chain ID: 8453)
- Arbitrum One (Chain ID: 42161)
- Polygon (Chain ID: 137)
- Optimism (Chain ID: 10)

**DeFi Protocols**
- Supported DEXes: Uniswap, 1inch, SushiSwap, Balancer, Curve
- Lending protocols: Aave, Compound
- Cross-chain position tracking

**Development Tools**
- TypeScript for type safety
- Winston for structured logging
- Jest for testing
- ESLint for code quality

**Deployment Platforms**
- Replit (primary deployment target)
- Vercel (legacy support)
- Node.js 18+ runtime requirement

**Payment Protocol**
- x402 on-chain payment verification
- USDC/USDT support for per-request monetization
- Invoice generation and tracking system