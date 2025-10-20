// Real AURA API Integration
import { 
  PortfolioBalanceResponse, 
  PortfolioPositionsResponse,
  StrategyProposeResponse,
  DCAEventAwareParams,
  LiquidationGuardParams,
  SwapQuoteRequest,
  SwapQuoteResponse,
  SwapIntent,
  SwapParams,
  AllowanceCheck,
  AllowanceResponse
} from '../types/index.js'
import axios from 'axios'

export interface AuraAdapterConfig {
  apiUrl?: string  // Default: https://aura.adex.network
  apiKey?: string  // API key for higher rate limits
  timeout?: number
}

export class AuraAdapter {
  private config: AuraAdapterConfig

  constructor(config: AuraAdapterConfig = {}) {
    this.config = {
      apiUrl: config.apiUrl || process.env.AURA_API_URL || 'https://aura.adex.network',
      apiKey: config.apiKey || process.env.AURA_API_KEY || '',
      timeout: config.timeout || 30000
    }
  }

  /**
   * Get portfolio balance for an address across all supported chains
   */
  async getPortfolioBalance(address: string): Promise<PortfolioBalanceResponse> {
    try {
      const response = await axios.get(`${this.config.apiUrl}/api/portfolio/balances`, {
        params: {
          address,
          apiKey: this.config.apiKey
        },
        timeout: this.config.timeout
      });

      // Parse response to match our schema
      const portfolio = response.data.portfolio;
      const totalBalanceUSD = portfolio.reduce((sum: number, network: any) => 
        sum + network.tokens.reduce((netSum: number, token: any) => netSum + token.balanceUSD, 0), 0
      );

      return {
        native: totalBalanceUSD.toString(),
        tokens: portfolio.flatMap((network: any) => 
          network.tokens.map((token: any) => ({
            address: token.address,
            symbol: token.symbol,
            decimals: 18,
            balance: token.balance.toString(),
            usd: token.balanceUSD
          }))
        )
      };
    } catch (error) {
      throw new Error(`AURA API error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get DeFi positions for an address
   */
  async getPortfolioPositions(address: string): Promise<PortfolioPositionsResponse> {
    try {
      const response = await axios.get(`${this.config.apiUrl}/api/portfolio/balances`, {
        params: {
          address,
          apiKey: this.config.apiKey
        },
        timeout: this.config.timeout
      });

      // Parse positions from portfolio data
      const positions = response.data.portfolio.flatMap((network: any) =>
        network.tokens
          .filter((token: any) => token.balanceUSD > 0)
          .map((token: any) => ({
            protocol: 'wallet',
            asset: token.symbol,
            balance: token.balance.toString(),
            balanceUSD: token.balanceUSD.toString(),
            apy: '0',
            healthFactor: '0',
            network: network.network.name
          }))
      );

      return { positions };
    } catch (error) {
      throw new Error(`AURA API error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get AURA recommendations for an address
   */
  async getRecommendations(address: string, llm: 'gemini' | 'grok' = 'gemini'): Promise<any[]> {
    try {
      const response = await axios.get(`${this.config.apiUrl}/api/portfolio/strategies`, {
        params: {
          address,
          apiKey: this.config.apiKey
        },
        timeout: this.config.timeout
      });

      // Return all strategy responses from AURA
      return response.data.strategies.flatMap((strategy: any) => strategy.response || []);
    } catch (error) {
      throw new Error(`AURA API error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Propose a specific strategy using AURA insights
   */
  async proposeStrategy(
    intent: string, 
    params: any, 
    address: string
  ): Promise<StrategyProposeResponse> {
    try {
      // Try to get real strategies from AURA with longer timeout
      let strategies: any[] = [];
      let auraRecommendations: any[] = [];

      try {
        const response = await axios.get(`${this.config.apiUrl}/api/portfolio/strategies`, {
          params: {
            address,
            apiKey: this.config.apiKey
          },
          timeout: 30000 // 30 seconds timeout for strategies
        });
        strategies = response.data.strategies || [];
        auraRecommendations = strategies.flatMap(s => s.response || []);
      } catch (auraError) {
        console.warn('AURA strategies API timeout/slow, using fallback strategy');
        // Fallback: create basic strategy without AURA recommendations
        auraRecommendations = [];
      }

      const intentId = `${intent}_${Date.now()}`;

      // Map AURA strategies to our format
      if (intent === 'dca_event_aware') {
        return this.generateDCAFromAura(intentId, params, strategies, address, auraRecommendations);
      } else if (intent === 'liquidation_guard') {
        return this.generateLiquidationFromAura(intentId, params, strategies, address, auraRecommendations);
      }

      throw new Error(`Unknown strategy intent: ${intent}`);
    } catch (error) {
      throw new Error(`Strategy generation error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }



  /**
   * Simple prompt generator (from existing AURA codebase)
   */
  private async makeSimplePrompt(props: { portfolio: any[] }): Promise<string> {
    return `Provide investment strategies for a user with the following crypto portfolio:
${JSON.stringify(props.portfolio)}
Be concise, specific and precise in your instruction in each strategy action. 
`
  }

  /**
   * Generate DCA strategy from AURA recommendations
   */
  private generateDCAFromAura(intentId: string, params: DCAEventAwareParams, auraStrategies: any[], address: string, auraRecommendations: any[] = []): StrategyProposeResponse {
    // Extract relevant DCA strategies from AURA response
    const dcaStrategy = auraStrategies.find(s => 
      s.response && s.response.some((r: any) => r.name.toLowerCase().includes('dca') || r.name.toLowerCase().includes('dollar cost'))
    );

    return {
      intentId,
      plan: {
        splits: Math.ceil(params.budgetUsd / 50),
        windowDays: this.parseCadenceToDays(params.cadence),
        venue: ['uniswap', '1inch'],
        maxSlipPct: 0.5,
        budgetUsd: params.budgetUsd,
        asset: params.asset,
        auraRecommendations: dcaStrategy?.response || auraRecommendations || []
      },
      risks: this.extractRisksFromAura(dcaStrategy),
      next: 'tx.simulate'
    };
  }

  /**
   * Generate Liquidation Guard strategy from AURA recommendations
   */
  private generateLiquidationFromAura(intentId: string, params: LiquidationGuardParams, auraStrategies: any[], address: string, auraRecommendations: any[] = []): StrategyProposeResponse {
    // Extract relevant liquidation strategies from AURA response
    const liquidationStrategy = auraStrategies.find(s => 
      s.response && s.response.some((r: any) => r.name.toLowerCase().includes('liquidation') || r.name.toLowerCase().includes('guard'))
    );

    return {
      intentId,
      plan: {
        protocols: params.protocols,
        maxHealthFactor: params.maxHealthFactor,
        minHealthFactor: params.minHealthFactor,
        autoRepayThreshold: params.autoRepayThreshold,
        auraRecommendations: liquidationStrategy?.response || auraRecommendations || []
      },
      risks: this.extractRisksFromAura(liquidationStrategy),
      next: 'tx.simulate'
    };
  }

  /**
   * Extract risks from AURA strategy response
   */
  private extractRisksFromAura(strategy: any): string[] {
    if (!strategy) return [];
    
    const risks: string[] = [];
    strategy.response.forEach((r: any) => {
      if (r.risk === 'high') risks.push('high_risk_detected');
      if (r.risk === 'moderate') risks.push('moderate_risk');
      if (r.risk === 'opportunistic') risks.push('opportunistic_strategy');
    });
    
    return risks;
  }

  /**
   * Parse cadence string to days
   */
  private parseCadenceToDays(cadence: string): number {
    if (cadence.includes('daily')) return 1;
    if (cadence.includes('2x/week')) return 3;
    if (cadence.includes('weekly')) return 7;
    if (cadence.includes('bi-weekly')) return 14;
    return 7; // default to weekly
  }

  /**
   * Parse natural language swap intent to structured parameters
   * Examples:
   * - "swap 1 ETH to USDC on Base"
   * - "exchange 100 USDT for DAI on Arbitrum"
   * - "trade 0.5 BNB to WETH on BSC"
   */
  async parseSwapIntent(intent: SwapIntent): Promise<SwapParams> {
    const text = intent.text.toLowerCase()
    
    // Extract amount
    const amountMatch = text.match(/(\d+\.?\d*)\s*(\w+)/)
    if (!amountMatch) {
      throw new Error('Could not parse amount from intent')
    }
    const amount = amountMatch[1]
    const fromToken = amountMatch[2].toUpperCase()
    
    // Extract destination token
    const toMatch = text.match(/(?:to|for)\s+(\w+)/)
    if (!toMatch) {
      throw new Error('Could not parse destination token from intent')
    }
    const toToken = toMatch[1].toUpperCase()
    
    // Extract chain
    const chainMatch = text.match(/on\s+(\w+)/)
    const chain = chainMatch ? chainMatch[1].toLowerCase() : 'ethereum'
    
    // Extract slippage if specified
    const slippageMatch = text.match(/slippage\s+(\d+\.?\d*)/)
    const slippageTolerance = slippageMatch ? parseFloat(slippageMatch[1]) : 0.5
    
    return {
      fromToken,
      toToken,
      amount,
      chain,
      slippageTolerance,
      userAddress: intent.userAddress
    }
  }

  /**
   * Get swap quote from AURA API
   * AURA automatically selects the best DEX across 200+ chains and 9M+ tokens
   */
  async getSwapQuote(request: SwapQuoteRequest): Promise<SwapQuoteResponse> {
    try {
      const response = await axios.get(`${this.config.apiUrl}/api/swap/quote`, {
        params: {
          fromToken: request.fromToken,
          toToken: request.toToken,
          amount: request.amount,
          chain: request.chain,
          slippageTolerance: request.slippageTolerance || 0.5,
          userAddress: request.userAddress,
          apiKey: this.config.apiKey
        },
        timeout: this.config.timeout
      })

      // AURA returns the best quote with auto-selected DEX
      const quote = response.data
      
      return {
        fromToken: {
          address: quote.fromToken.address,
          symbol: quote.fromToken.symbol,
          decimals: quote.fromToken.decimals,
          amount: quote.fromToken.amount
        },
        toToken: {
          address: quote.toToken.address,
          symbol: quote.toToken.symbol,
          decimals: quote.toToken.decimals,
          amount: quote.toToken.amount
        },
        price: quote.price,
        priceImpact: quote.priceImpact,
        route: {
          dex: quote.route.dex,
          path: quote.route.path,
          protocols: quote.route.protocols
        },
        estimatedGas: quote.estimatedGas,
        estimatedGasUsd: quote.estimatedGasUsd,
        guaranteedAmount: quote.guaranteedAmount,
        chain: request.chain,
        quoteId: quote.quoteId || quote.id,
        routeId: quote.routeId || quote.route?.id
      }
    } catch (error) {
      throw new Error(`AURA swap quote error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Check token allowance for swap
   */
  async checkAllowance(check: AllowanceCheck): Promise<AllowanceResponse> {
    try {
      const response = await axios.get(`${this.config.apiUrl}/api/swap/allowance`, {
        params: {
          tokenAddress: check.tokenAddress,
          owner: check.owner,
          spender: check.spender,
          chain: check.chain,
          apiKey: this.config.apiKey
        },
        timeout: this.config.timeout
      })

      const data = response.data
      
      return {
        currentAllowance: data.currentAllowance,
        requiredAllowance: data.requiredAllowance,
        needsApproval: data.needsApproval,
        approvalTx: data.needsApproval ? {
          to: data.approvalTx.to,
          data: data.approvalTx.data,
          value: data.approvalTx.value || '0'
        } : undefined
      }
    } catch (error) {
      throw new Error(`AURA allowance check error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Build swap transaction with proper calldata from AURA API
   */
  async buildSwapTransaction(quote: any, userAddress: string, slippageTolerance?: number): Promise<any> {
    try {
      // Pass full quote context including chain, quoteId, routeId to AURA
      const response = await axios.post(`${this.config.apiUrl}/api/swap/build`, {
        quoteId: quote.quoteId,
        routeId: quote.routeId,
        chain: quote.chain,
        fromToken: quote.fromToken.address,
        toToken: quote.toToken.address,
        amount: quote.fromToken.amount,
        userAddress,
        slippageTolerance: slippageTolerance || 0.5,
        apiKey: this.config.apiKey
      }, {
        timeout: this.config.timeout
      })

      const data = response.data
      
      return {
        to: data.to,
        data: data.data,
        value: data.value,
        gasLimit: data.gasLimit,
        spenderAddress: data.spenderAddress,
        needsApproval: data.needsApproval,
        approvalTx: data.approvalTx
      }
    } catch (error) {
      throw new Error(`AURA build transaction error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Scan for airdrop opportunities (native AURA API)
   */
  async scanAirdropOpportunities(address: string, chains?: string[]): Promise<any[]> {
    try {
      const response = await axios.get(`${this.config.apiUrl}/api/opportunities/airdrops`, {
        params: {
          address,
          chains: chains?.join(','),
          apiKey: this.config.apiKey
        },
        timeout: this.config.timeout
      })

      return response.data.opportunities || response.data.airdrops || []
    } catch (error) {
      // If endpoint not available, try alternative endpoint
      try {
        const altResponse = await axios.get(`${this.config.apiUrl}/api/portfolio/airdrops`, {
          params: {
            address,
            apiKey: this.config.apiKey
          },
          timeout: this.config.timeout
        })
        return altResponse.data.opportunities || altResponse.data.airdrops || []
      } catch {
        throw new Error(`AURA airdrop scanning error: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }

  /**
   * Scan for liquidation opportunities (native AURA API)
   */
  async scanLiquidationOpportunities(address: string, chains?: string[]): Promise<any[]> {
    try {
      const response = await axios.get(`${this.config.apiUrl}/api/opportunities/liquidations`, {
        params: {
          address,
          chains: chains?.join(','),
          apiKey: this.config.apiKey
        },
        timeout: this.config.timeout
      })

      return response.data.opportunities || response.data.liquidations || []
    } catch (error) {
      // Try alternative endpoint for portfolio risks
      try {
        const altResponse = await axios.get(`${this.config.apiUrl}/api/portfolio/risks`, {
          params: {
            address,
            apiKey: this.config.apiKey
          },
          timeout: this.config.timeout
        })
        return altResponse.data.risks || altResponse.data.liquidations || []
      } catch {
        throw new Error(`AURA liquidation scanning error: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }

  /**
   * Scan for narrative/trend opportunities (native AURA API)
   */
  async scanNarrativeOpportunities(address: string): Promise<any[]> {
    try {
      const response = await axios.get(`${this.config.apiUrl}/api/opportunities/narratives`, {
        params: {
          address,
          apiKey: this.config.apiKey
        },
        timeout: this.config.timeout
      })

      return response.data.opportunities || response.data.narratives || []
    } catch (error) {
      throw new Error(`AURA narrative scanning error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Scan for governance opportunities (native AURA API)
   */
  async scanGovernanceOpportunities(address: string): Promise<any[]> {
    try {
      const response = await axios.get(`${this.config.apiUrl}/api/opportunities/governance`, {
        params: {
          address,
          apiKey: this.config.apiKey
        },
        timeout: this.config.timeout
      })

      return response.data.opportunities || response.data.governance || []
    } catch (error) {
      throw new Error(`AURA governance scanning error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

}
