import { z } from 'zod'
import { AddressSchema, TxHashSchema } from './common.js'

// Swap Intent Parser - parse natural language to structured swap params
export const SwapIntentSchema = z.object({
  text: z.string().describe('Natural language swap command, e.g. "swap 1 ETH to USDC on Base"'),
  userAddress: AddressSchema.optional().describe('User wallet address for personalized quotes')
})
export type SwapIntent = z.infer<typeof SwapIntentSchema>

// Parsed Swap Parameters
export const SwapParamsSchema = z.object({
  fromToken: z.string().describe('Source token address or symbol'),
  toToken: z.string().describe('Destination token address or symbol'),
  amount: z.string().describe('Amount to swap in source token units'),
  chain: z.string().describe('Blockchain network (e.g., ethereum, base, arbitrum)'),
  slippageTolerance: z.number().optional().default(0.5).describe('Max slippage in percentage'),
  userAddress: AddressSchema.optional().describe('User wallet address')
})
export type SwapParams = z.infer<typeof SwapParamsSchema>

// Swap Quote Request
export const SwapQuoteRequestSchema = z.object({
  fromToken: z.string(),
  toToken: z.string(),
  amount: z.string(),
  chain: z.string(),
  slippageTolerance: z.number().optional(),
  userAddress: AddressSchema.optional()
})
export type SwapQuoteRequest = z.infer<typeof SwapQuoteRequestSchema>

// Swap Quote Response (from AURA API)
export const SwapQuoteResponseSchema = z.object({
  fromToken: z.object({
    address: AddressSchema,
    symbol: z.string(),
    decimals: z.number(),
    amount: z.string()
  }),
  toToken: z.object({
    address: AddressSchema,
    symbol: z.string(),
    decimals: z.number(),
    amount: z.string()
  }),
  price: z.string().describe('Exchange rate'),
  priceImpact: z.number().describe('Price impact in percentage'),
  route: z.object({
    dex: z.string().describe('Selected DEX name'),
    path: z.array(AddressSchema).describe('Token path for the swap'),
    protocols: z.array(z.string()).optional()
  }),
  estimatedGas: z.string(),
  estimatedGasUsd: z.number(),
  guaranteedAmount: z.string().describe('Minimum amount out after slippage'),
  chain: z.string().describe('Blockchain network'),
  quoteId: z.string().optional().describe('AURA quote ID for transaction building'),
  routeId: z.string().optional().describe('AURA route ID for transaction building')
})
export type SwapQuoteResponse = z.infer<typeof SwapQuoteResponseSchema>

// Token Allowance Check
export const AllowanceCheckSchema = z.object({
  tokenAddress: AddressSchema,
  owner: AddressSchema,
  spender: AddressSchema,
  chain: z.string()
})
export type AllowanceCheck = z.infer<typeof AllowanceCheckSchema>

export const AllowanceResponseSchema = z.object({
  currentAllowance: z.string(),
  requiredAllowance: z.string(),
  needsApproval: z.boolean(),
  approvalTx: z.object({
    to: AddressSchema,
    data: z.string(),
    value: z.string().optional()
  }).optional()
})
export type AllowanceResponse = z.infer<typeof AllowanceResponseSchema>

// Swap Preparation (includes allowance + transaction data)
export const SwapPrepareRequestSchema = z.object({
  quote: SwapQuoteResponseSchema,
  userAddress: AddressSchema,
  slippageTolerance: z.number().optional()
})
export type SwapPrepareRequest = z.infer<typeof SwapPrepareRequestSchema>

export const SwapPrepareResponseSchema = z.object({
  needsApproval: z.boolean(),
  approvalTx: z.object({
    to: AddressSchema,
    data: z.string(),
    value: z.string().optional(),
    gasLimit: z.string().optional()
  }).optional(),
  swapTx: z.object({
    to: AddressSchema,
    data: z.string(),
    value: z.string(),
    gasLimit: z.string().optional()
  }),
  summary: z.object({
    fromAmount: z.string(),
    fromSymbol: z.string(),
    toAmount: z.string(),
    toSymbol: z.string(),
    dex: z.string(),
    estimatedGasUsd: z.number()
  })
})
export type SwapPrepareResponse = z.infer<typeof SwapPrepareResponseSchema>

// Swap Execute Request (web-signed transaction)
export const SwapExecuteRequestSchema = z.object({
  signedTx: z.string().describe('User-signed transaction from web wallet'),
  chain: z.string(),
  paymentProof: z.object({
    invoiceId: z.string(),
    txHash: TxHashSchema,
    amount: z.string(),
    asset: z.string()
  }).optional().describe('x402 payment proof if required')
})
export type SwapExecuteRequest = z.infer<typeof SwapExecuteRequestSchema>

export const SwapExecuteResponseSchema = z.object({
  txHash: TxHashSchema,
  status: z.enum(['pending', 'confirmed', 'failed']),
  explorerUrl: z.string().optional()
})
export type SwapExecuteResponse = z.infer<typeof SwapExecuteResponseSchema>
