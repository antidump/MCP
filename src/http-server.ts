import Fastify from 'fastify'
import cors from '@fastify/cors'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { AuraAdapter } from './core/aura-adapter.js'
import { GuardEngine } from './core/guard-engine.js'
import { SwapTools } from './tools/swap.js'
import { McpHttpHandler } from './mcp/http-handler.js'
import type { GuardEngineConfig } from './types/guard.js'
import winston from 'winston'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Cache landing page HTML at startup
let cachedLandingPage: string | null = null

// Setup logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
})

// Initialize core components
if (!process.env.AURA_API_KEY) {
  logger.error('AURA_API_KEY environment variable is required')
  process.exit(1)
}

const auraAdapter = new AuraAdapter({
  apiUrl: process.env.AURA_API_URL || 'https://aura.adex.network',
  apiKey: process.env.AURA_API_KEY,
  timeout: 30000
})

const config: GuardEngineConfig = {
  defaultRules: {
    risk: {
      maxSlippagePct: 1.0,
      maxGasGwei: 50
    },
    gas: {
      maxGasGwei: 100
    },
    route: {
      allowedDexes: ['uniswap', '1inch'],
      blockedTokens: []
    },
    deny: {
      blockedAddresses: [],
      blockedProtocols: []
    }
  },
  emergencyStop: false
}

const guardEngine = new GuardEngine(config)
const swapTools = new SwapTools(auraAdapter, guardEngine)
const mcpHandler = new McpHttpHandler(auraAdapter, guardEngine)

// Create Fastify server
const fastify = Fastify({
  logger: true
})

// Main function
async function startServer() {
  // Register CORS
  await fastify.register(cors, {
    origin: true
  })

  // Load landing page HTML once at startup
  if (!cachedLandingPage) {
    const htmlPath = join(__dirname, '..', 'public', 'index.html')
    cachedLandingPage = readFileSync(htmlPath, 'utf-8')
  }

  // Serve landing page at root
  fastify.get('/', async (request, reply) => {
    reply.type('text/html').send(cachedLandingPage)
  })

  // Health check endpoint
fastify.get('/api/health', async (request, reply) => {
  return {
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime()
    }
  }
})

// MCP Protocol Endpoints
// JSON-RPC endpoint for MCP requests
fastify.post('/mcp', async (request, reply) => {
  await mcpHandler.handleRequest(request, reply)
})

// SSE endpoint for real-time streaming
fastify.get('/mcp/stream', async (request, reply) => {
  await mcpHandler.handleStream(request, reply)
})

// Portfolio endpoints
fastify.post('/api/portfolio/balance', async (request, reply) => {
  try {
    const { address, chain } = request.body as any
    const result = await auraAdapter.getPortfolioBalance(address)
    return {
      success: true,
      data: result
    }
  } catch (error) {
    logger.error('Portfolio balance error:', error)
    reply.code(500)
    return {
      success: false,
      error: {
        code: 'PORTFOLIO_ERROR',
        message: error instanceof Error ? error.message : String(error)
      }
    }
  }
})

fastify.post('/api/portfolio/positions', async (request, reply) => {
  try {
    const { address } = request.body as any
    const result = await auraAdapter.getPortfolioPositions(address)
    return {
      success: true,
      data: result
    }
  } catch (error) {
    logger.error('Portfolio positions error:', error)
    reply.code(500)
    return {
      success: false,
      error: {
        code: 'PORTFOLIO_ERROR',
        message: error instanceof Error ? error.message : String(error)
      }
    }
  }
})

// Strategy endpoints
fastify.post('/api/strategy/propose', async (request, reply) => {
  try {
    const { intent, params, address } = request.body as any
    const result = await auraAdapter.proposeStrategy(intent, params, address)
    return {
      success: true,
      data: result
    }
  } catch (error) {
    logger.error('Strategy proposal error:', error)
    reply.code(500)
    return {
      success: false,
      error: {
        code: 'STRATEGY_ERROR',
        message: error instanceof Error ? error.message : String(error)
      }
    }
  }
})

// Transaction endpoints
fastify.post('/api/transaction/simulate', async (request, reply) => {
  try {
    const { intentId, txParams } = request.body as any
    
    // Mock simulation result
    const simulation: any = {
      ok: true,
      est: {
        feeUsd: 5.0,
        slippagePct: 0.3,
        avgPrice: 2000
      },
      guardsTriggered: []
    }
    
    // Simulation ready
    
    return {
      success: true,
      data: simulation
    }
  } catch (error) {
    logger.error('Transaction simulation error:', error)
    reply.code(500)
    return {
      success: false,
      error: {
        code: 'SIMULATION_ERROR',
        message: error instanceof Error ? error.message : String(error)
      }
    }
  }
})

// Transaction execute endpoint
fastify.post('/api/transaction/execute', async (request, reply) => {
  try {
    const { intentId, txParams } = request.body as any
    
    // Mock execution result
    const executeResult = {
      success: true,
      data: {
        status: 'submitted',
        txHash: '0xmocktxhash123',
        notes: 'Mock transaction submitted'
      }
    }
    return executeResult
  } catch (error) {
    logger.error('Transaction execution error:', error)
    reply.code(500).send({ 
      success: false, 
      error: { 
        code: 'EXECUTION_ERROR',
        message: error instanceof Error ? error.message : String(error) 
      } 
    })
  }
})

// Swap endpoints
// Parse swap intent from natural language
fastify.post('/api/swap/parse', async (request, reply) => {
  try {
    const result = await swapTools.handleTool('swap.parse', request.body)
    return result
  } catch (error) {
    logger.error('Swap parse error:', error)
    reply.code(500)
    return {
      success: false,
      error: {
        code: 'PARSE_ERROR',
        message: error instanceof Error ? error.message : String(error)
      }
    }
  }
})

// Get swap quote (AURA auto-selects best DEX)
fastify.post('/api/swap/quote', async (request, reply) => {
  try {
    const result = await swapTools.handleTool('swap.quote', request.body)
    return result
  } catch (error) {
    logger.error('Swap quote error:', error)
    reply.code(500)
    return {
      success: false,
      error: {
        code: 'QUOTE_ERROR',
        message: error instanceof Error ? error.message : String(error)
      }
    }
  }
})

// Prepare swap transaction
fastify.post('/api/swap/prepare', async (request, reply) => {
  try {
    const result = await swapTools.handleTool('swap.prepare', request.body)
    return result
  } catch (error) {
    logger.error('Swap prepare error:', error)
    reply.code(500)
    return {
      success: false,
      error: {
        code: 'PREPARE_ERROR',
        message: error instanceof Error ? error.message : String(error)
      }
    }
  }
})

// Execute swap (with web-signed transaction)
fastify.post('/api/swap/execute', async (request, reply) => {
  try {
    const result = await swapTools.handleTool('swap.execute', request.body)
    
    // Check if payment is required (x402 response)
    if ('invoiceId' in result) {
      reply.code(402)
      return result
    }
    
    return result
  } catch (error) {
    logger.error('Swap execute error:', error)
    reply.code(500)
    return {
      success: false,
      error: {
        code: 'EXECUTION_ERROR',
        message: error instanceof Error ? error.message : String(error)
      }
    }
  }
})

// Guard endpoints
fastify.post('/api/guard/setRules', async (request, reply) => {
  try {
    const { rules } = request.body as any
    // Set individual rules
    if (rules.risk) {
      guardEngine.setRule('risk', 'risk', rules.risk)
    }
    if (rules.gas) {
      guardEngine.setRule('gas', 'gas', rules.gas)
    }
    if (rules.route) {
      guardEngine.setRule('route', 'route', rules.route)
    }
    if (rules.deny) {
      guardEngine.setRule('deny', 'deny', rules.deny)
    }
    return {
      success: true,
      data: {
        message: 'Rules updated successfully',
        rules: rules
      }
    }
  } catch (error) {
    logger.error('Guard rules error:', error)
    reply.code(500)
    return {
      success: false,
      error: {
        code: 'GUARD_ERROR',
        message: error instanceof Error ? error.message : String(error)
      }
    }
  }
})

fastify.post('/api/guard/setEmergencyStop', async (request, reply) => {
  try {
    const { enabled } = request.body as any
    guardEngine.setEmergencyStop(enabled)
    return {
      success: true,
      data: {
        message: `Emergency stop set to ${enabled}`
      }
    }
  } catch (error) {
    logger.error('Emergency stop error:', error)
    reply.code(500).send({ 
      success: false, 
      error: { 
        code: 'GUARD_ERROR',
        message: error instanceof Error ? error.message : String(error) 
      } 
    })
  }
})

// System endpoints
fastify.get('/api/system/health', async (request, reply) => {
  try {
    return {
      success: true,
      data: {
        status: 'healthy',
        components: {
          auraAdapter: 'connected',
          guardEngine: 'active',
          emergencyStop: (guardEngine as any).emergencyStop || false
        },
        timestamp: new Date().toISOString()
      }
    }
  } catch (error) {
    logger.error('System health error:', error)
    reply.code(500)
    return {
      success: false,
      error: {
        code: 'SYSTEM_ERROR',
        message: error instanceof Error ? error.message : String(error)
      }
    }
  }
})

  // Start server
  try {
    // Use PORT for Vercel/cloud platforms, fallback to MCP_SERVER_PORT for Replit, default 5000
    const port = parseInt(process.env.PORT || process.env.MCP_SERVER_PORT || '5000')
    await fastify.listen({ port, host: '0.0.0.0' })
    logger.info(`🚀 AURA MCP HTTP Server running on port ${port}`)
    logger.info(`📡 Health check: http://localhost:${port}/api/health`)
    logger.info(`📊 Portfolio API: http://localhost:${port}/api/portfolio/balance`)
    logger.info(`🎯 Strategy API: http://localhost:${port}/api/strategy/propose`)
    logger.info(`🔄 Transaction API: http://localhost:${port}/api/transaction/simulate`)
  } catch (err) {
    logger.error('Server start error:', err)
    process.exit(1)
  }
}

// Start the server
startServer()
