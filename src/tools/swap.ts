import { 
  McpResponse,
  SwapIntent, 
  SwapParams,
  SwapQuoteRequest,
  SwapQuoteResponse,
  SwapPrepareRequest,
  SwapPrepareResponse,
  SwapExecuteRequest,
  SwapExecuteResponse,
  X402PaymentRequired
} from '../types/index.js'
import { AuraAdapter } from '../core/aura-adapter.js'
import { GuardEngine } from '../core/guard-engine.js'
import axios from 'axios'

export class SwapTools {
  constructor(
    private auraAdapter: AuraAdapter,
    private guardEngine: GuardEngine
  ) {}

  async handleTool(name: string, args: any): Promise<McpResponse | X402PaymentRequired> {
    switch (name) {
      case 'swap.parse':
        return await this.parseIntent(args as SwapIntent)
      
      case 'swap.quote':
        return await this.getQuote(args as SwapQuoteRequest)
      
      case 'swap.prepare':
        return await this.prepare(args as SwapPrepareRequest)
      
      case 'swap.execute':
        return await this.execute(args as SwapExecuteRequest)
      
      default:
        throw new Error(`Unknown swap tool: ${name}`)
    }
  }

  /**
   * Parse natural language swap intent
   */
  private async parseIntent(intent: SwapIntent): Promise<McpResponse<SwapParams>> {
    try {
      const params = await this.auraAdapter.parseSwapIntent(intent)
      
      return {
        success: true,
        data: params,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: `parse_${Date.now()}`
        }
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PARSE_ERROR',
          message: error instanceof Error ? error.message : String(error)
        },
        metadata: {
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  /**
   * Get swap quote from AURA API
   * AURA automatically selects best DEX across 200+ chains
   */
  private async getQuote(request: SwapQuoteRequest): Promise<McpResponse<SwapQuoteResponse>> {
    try {
      // Get quote from AURA API (auto-selects best DEX)
      const quote = await this.auraAdapter.getSwapQuote(request)
      
      // Validate with guard engine
      const guardResult = this.guardEngine.validateSimulation(
        {
          ok: true,
          est: {
            feeUsd: quote.estimatedGasUsd,
            slippagePct: quote.priceImpact,
            avgPrice: parseFloat(quote.price)
          },
          guardsTriggered: []
        },
        {
          fromToken: request.fromToken,
          toToken: request.toToken,
          amount: request.amount,
          chain: request.chain
        }
      )
      
      if (!guardResult.passed) {
        return {
          success: false,
          error: {
            code: 'GUARD_VIOLATION',
            message: `Quote blocked by guards: ${guardResult.triggeredGuards.join(', ')}`,
            details: {
              triggeredGuards: guardResult.triggeredGuards,
              warnings: guardResult.warnings
            }
          },
          metadata: {
            timestamp: new Date().toISOString()
          }
        }
      }
      
      return {
        success: true,
        data: quote,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: `quote_${Date.now()}`
        }
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'QUOTE_ERROR',
          message: error instanceof Error ? error.message : String(error)
        },
        metadata: {
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  /**
   * Prepare swap transaction (check allowance + build transaction data)
   */
  private async prepare(request: SwapPrepareRequest): Promise<McpResponse<SwapPrepareResponse>> {
    try {
      const { quote, userAddress, slippageTolerance } = request
      
      // Build swap transaction with proper calldata from AURA API
      const txData = await this.auraAdapter.buildSwapTransaction(quote, userAddress, slippageTolerance)
      
      const response: SwapPrepareResponse = {
        needsApproval: txData.needsApproval,
        approvalTx: txData.approvalTx ? {
          to: txData.approvalTx.to,
          data: txData.approvalTx.data,
          value: txData.approvalTx.value || '0',
          gasLimit: txData.approvalTx.gasLimit
        } : undefined,
        swapTx: {
          to: txData.to,
          data: txData.data,
          value: txData.value,
          gasLimit: txData.gasLimit
        },
        summary: {
          fromAmount: quote.fromToken.amount,
          fromSymbol: quote.fromToken.symbol,
          toAmount: quote.toToken.amount,
          toSymbol: quote.toToken.symbol,
          dex: quote.route.dex,
          estimatedGasUsd: quote.estimatedGasUsd
        }
      }
      
      return {
        success: true,
        data: response,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: `prepare_${Date.now()}`
        }
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PREPARE_ERROR',
          message: error instanceof Error ? error.message : String(error)
        },
        metadata: {
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  /**
   * Execute swap with user-signed transaction
   * Server only broadcasts the transaction, user signs in browser
   */
  private async execute(request: SwapExecuteRequest): Promise<McpResponse<SwapExecuteResponse> | X402PaymentRequired> {
    try {
      // Check if payment is required (x402 gate)
      if (this.shouldRequirePayment(request)) {
        if (!request.paymentProof) {
          return this.generatePaymentRequired(request)
        }
        
        // Verify payment proof
        const paymentValid = await this.verifyPaymentProof(request.paymentProof)
        if (!paymentValid) {
          return {
            success: false,
            error: {
              code: 'INVALID_PAYMENT',
              message: 'Payment proof verification failed'
            },
            metadata: {
              timestamp: new Date().toISOString()
            }
          }
        }
      }
      
      // Broadcast user-signed transaction
      const txHash = await this.broadcastTransaction(request.signedTx, request.chain)
      
      // Get explorer URL for the chain
      const explorerUrl = this.getExplorerUrl(request.chain, txHash)
      
      return {
        success: true,
        data: {
          txHash,
          status: 'pending',
          explorerUrl
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: `execute_${Date.now()}`
        }
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : String(error)
        },
        metadata: {
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  /**
   * Check if x402 payment is required for this swap
   */
  private shouldRequirePayment(request: SwapExecuteRequest): boolean {
    // Payment required for premium features or large swaps
    // This is configurable based on your business model
    return true // For now, always require payment
  }

  /**
   * Generate x402 payment required response
   */
  private generatePaymentRequired(request: SwapExecuteRequest): X402PaymentRequired {
    return {
      invoiceId: `swap_${Date.now()}`,
      amount: '10', // 10 USDC per swap
      asset: 'USDC',
      receiver: process.env.X402_RECEIVER || '0x0000000000000000000000000000000000000000',
      description: 'Payment required for swap execution'
    }
  }

  /**
   * Verify x402 payment proof
   */
  private async verifyPaymentProof(proof: any): Promise<boolean> {
    try {
      // Verify on-chain payment
      // This would check the blockchain to confirm payment was made
      // For now, basic validation
      return proof.txHash && proof.amount && proof.asset === 'USDC'
    } catch {
      return false
    }
  }

  /**
   * Broadcast signed transaction to blockchain
   */
  private async broadcastTransaction(signedTx: string, chain: string): Promise<string> {
    try {
      // Get RPC endpoint for chain
      const rpcUrl = this.getRpcUrl(chain)
      
      // Broadcast transaction
      const response = await axios.post(rpcUrl, {
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_sendRawTransaction',
        params: [signedTx]
      })
      
      if (response.data.error) {
        throw new Error(response.data.error.message)
      }
      
      return response.data.result
    } catch (error) {
      throw new Error(`Broadcast failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Get RPC URL for chain
   */
  private getRpcUrl(chain: string): string {
    const rpcMap: Record<string, string> = {
      ethereum: process.env.RPC_ETHEREUM || 'https://eth-mainnet.g.alchemy.com/v2/demo',
      base: process.env.RPC_BASE || 'https://mainnet.base.org',
      arbitrum: process.env.RPC_ARBITRUM || 'https://arb1.arbitrum.io/rpc',
      polygon: process.env.RPC_POLYGON || 'https://polygon-rpc.com',
      optimism: process.env.RPC_OPTIMISM || 'https://mainnet.optimism.io'
    }
    
    return rpcMap[chain.toLowerCase()] || rpcMap.ethereum
  }

  /**
   * Get block explorer URL for transaction
   */
  private getExplorerUrl(chain: string, txHash: string): string {
    const explorerMap: Record<string, string> = {
      ethereum: 'https://etherscan.io/tx/',
      base: 'https://basescan.org/tx/',
      arbitrum: 'https://arbiscan.io/tx/',
      polygon: 'https://polygonscan.com/tx/',
      optimism: 'https://optimistic.etherscan.io/tx/'
    }
    
    const baseUrl = explorerMap[chain.toLowerCase()] || explorerMap.ethereum
    return `${baseUrl}${txHash}`
  }
}
