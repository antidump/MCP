import { Tool } from '@modelcontextprotocol/sdk/types.js'

/**
 * MCP Tools Registry
 * Centralized tool definitions for both stdio and HTTP transports
 */
export class ToolsRegistry {
  private tools: Map<string, Tool> = new Map()

  constructor() {
    this.registerAllTools()
  }

  getTools(): Tool[] {
    return Array.from(this.tools.values())
  }

  getTool(name: string): Tool | undefined {
    return this.tools.get(name)
  }

  private registerAllTools() {
    // Portfolio tools
    this.tools.set('portfolio.getBalance', {
      name: 'portfolio.getBalance',
      description: 'Get portfolio balance for an address across all chains',
      inputSchema: {
        type: 'object',
        properties: {
          address: {
            type: 'string',
            description: 'Ethereum address (0x...)'
          }
        },
        required: ['address']
      }
    })

    this.tools.set('portfolio.getPositions', {
      name: 'portfolio.getPositions',
      description: 'Get DeFi positions for an address',
      inputSchema: {
        type: 'object',
        properties: {
          address: {
            type: 'string',
            description: 'Ethereum address (0x...)'
          }
        },
        required: ['address']
      }
    })

    // Operations tools
    this.tools.set('ops.scanOpportunities', {
      name: 'ops.scanOpportunities',
      description: 'Scan for DeFi opportunities (liquidation, airdrop, narrative, governance)',
      inputSchema: {
        type: 'object',
        properties: {
          kind: {
            type: 'string',
            enum: ['liquidation', 'airdrop', 'narrative', 'governance'],
            description: 'Type of opportunity to scan for'
          },
          address: {
            type: 'string',
            description: 'Ethereum address (0x...)'
          },
          params: {
            type: 'object',
            description: 'Additional parameters for the scan'
          }
        },
        required: ['kind', 'address']
      }
    })

    // Strategy tools
    this.tools.set('strategy.propose', {
      name: 'strategy.propose',
      description: 'Propose a new DeFi strategy based on portfolio and market conditions',
      inputSchema: {
        type: 'object',
        properties: {
          intent: {
            type: 'string',
            description: 'Strategy intent (dca_event_aware, auto_repay, rotate_to, liquidation_guard)'
          },
          params: {
            type: 'object',
            description: 'Strategy parameters'
          },
          address: {
            type: 'string',
            description: 'Ethereum address (0x...)'
          }
        },
        required: ['intent', 'params', 'address']
      }
    })

    this.tools.set('strategy.backtest', {
      name: 'strategy.backtest',
      description: 'Backtest a strategy with historical data',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            enum: ['dca_event_aware', 'basket_rotation', 'hedge_guard'],
            description: 'Strategy name to backtest'
          },
          params: {
            type: 'object',
            description: 'Strategy parameters'
          },
          lookbackDays: {
            type: 'number',
            minimum: 1,
            maximum: 365,
            description: 'Number of days to look back'
          }
        },
        required: ['name', 'params', 'lookbackDays']
      }
    })

    // Swap tools
    this.tools.set('swap.parse', {
      name: 'swap.parse',
      description: 'Parse natural language swap intent (e.g., "swap 1 ETH to USDC on Base")',
      inputSchema: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'Natural language swap command'
          }
        },
        required: ['text']
      }
    })

    this.tools.set('swap.quote', {
      name: 'swap.quote',
      description: 'Get swap quote with auto-selected best DEX across 200+ chains',
      inputSchema: {
        type: 'object',
        properties: {
          fromToken: {
            type: 'string',
            description: 'Source token symbol (e.g., ETH, USDC)'
          },
          toToken: {
            type: 'string',
            description: 'Destination token symbol'
          },
          amount: {
            type: 'string',
            description: 'Amount to swap'
          },
          chain: {
            type: 'string',
            description: 'Blockchain network'
          },
          userAddress: {
            type: 'string',
            description: 'User wallet address'
          }
        },
        required: ['fromToken', 'toToken', 'amount', 'chain', 'userAddress']
      }
    })

    this.tools.set('swap.prepare', {
      name: 'swap.prepare',
      description: 'Prepare swap transaction (checks allowance, builds tx data)',
      inputSchema: {
        type: 'object',
        properties: {
          quoteId: {
            type: 'string',
            description: 'Quote ID from swap.quote'
          },
          userAddress: {
            type: 'string',
            description: 'User wallet address'
          }
        },
        required: ['quoteId', 'userAddress']
      }
    })

    this.tools.set('swap.execute', {
      name: 'swap.execute',
      description: 'Execute swap with web-signed transaction',
      inputSchema: {
        type: 'object',
        properties: {
          txData: {
            type: 'object',
            description: 'Transaction data from swap.prepare'
          },
          signedTx: {
            type: 'string',
            description: 'Signed transaction from browser wallet'
          }
        },
        required: ['txData', 'signedTx']
      }
    })

    // Transaction tools
    this.tools.set('tx.simulate', {
      name: 'tx.simulate',
      description: 'Simulate a transaction to estimate costs and check guardrails',
      inputSchema: {
        type: 'object',
        properties: {
          intentId: {
            type: 'string',
            description: 'Intent ID from strategy.propose'
          },
          txParams: {
            type: 'object',
            description: 'Transaction parameters'
          }
        }
      }
    })

    this.tools.set('tx.execute', {
      name: 'tx.execute',
      description: 'Execute a transaction (may require payment via x402)',
      inputSchema: {
        type: 'object',
        properties: {
          intentId: {
            type: 'string',
            description: 'Intent ID from strategy.propose'
          },
          txParams: {
            type: 'object',
            description: 'Transaction parameters'
          },
          paymentProof: {
            type: 'object',
            description: 'x402 payment proof (if required)'
          }
        }
      }
    })

    // Guard tools
    this.tools.set('guard.setRules', {
      name: 'guard.setRules',
      description: 'Set guard rules for risk management',
      inputSchema: {
        type: 'object',
        properties: {
          ruleType: {
            type: 'string',
            enum: ['risk', 'gas', 'route', 'deny'],
            description: 'Type of guard rule'
          },
          params: {
            type: 'object',
            description: 'Guard rule parameters'
          }
        },
        required: ['ruleType', 'params']
      }
    })

    this.tools.set('guard.setEmergencyStop', {
      name: 'guard.setEmergencyStop',
      description: 'Enable or disable emergency stop (halt all transactions)',
      inputSchema: {
        type: 'object',
        properties: {
          enabled: {
            type: 'boolean',
            description: 'Enable or disable emergency stop'
          }
        },
        required: ['enabled']
      }
    })

    // Report tools
    this.tools.set('report.get', {
      name: 'report.get',
      description: 'Get performance report for a session',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: {
            type: 'string',
            description: 'Session ID'
          }
        },
        required: ['sessionId']
      }
    })

    // System tools
    this.tools.set('system.health', {
      name: 'system.health',
      description: 'Get system health status',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    })
  }
}
