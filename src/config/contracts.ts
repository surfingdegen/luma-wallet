import { type Address } from 'viem';

/**
 * Contract addresses from environment variables
 * All addresses should be set in .env and Vercel
 */

// ========================================
// LUMA VAULTS
// ========================================

// USDC Vault
export const LUMA_USDC_VAULT_ADDRESS = (
  import.meta.env.VITE_LUMA_USDC_VAULT_ADDRESS || 
  '0x0000000000000000000000000000000000000000'
) as Address;

// cbBTC Vault (BTC)
export const LUMA_BTC_VAULT_ADDRESS = (
  import.meta.env.VITE_LUMA_BTC_VAULT_ADDRESS || 
  '0x0000000000000000000000000000000000000000'
) as Address;

// ========================================
// TOKEN ADDRESSES (Base Mainnet)
// ========================================

// USDC Token
export const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address;

// cbBTC Token
export const CBBTC_ADDRESS = '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf' as Address;

// Wrapped ETH
export const WETH_ADDRESS = '0x4200000000000000000000000000000000000006' as Address;

// ========================================
// CIRCLE PAYMASTER (Base Mainnet)
// ========================================

export const CIRCLE_PAYMASTER_ADDRESS = '0x6C973eBe80dCD8660841D4356bf15c32460271C9' as Address;
export const CIRCLE_PAYMASTER_URL = 'https://paymaster.base.org/8453';

// ========================================
// MOONWELL MARKETS (if needed later)
// ========================================

export const MOONWELL_USDC_MARKET = (
  import.meta.env.VITE_MOONWELL_USDC_MARKET || 
  '0x0000000000000000000000000000000000000000'
) as Address;

export const MOONWELL_WETH_MARKET = (
  import.meta.env.VITE_MOONWELL_WETH_MARKET || 
  '0x0000000000000000000000000000000000000000'
) as Address;

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Get vault address by token type
 */
export function getVaultAddress(token: 'USDC' | 'BTC'): Address {
  return token === 'USDC' ? LUMA_USDC_VAULT_ADDRESS : LUMA_BTC_VAULT_ADDRESS;
}

/**
 * Get token address by type
 */
export function getTokenAddress(token: 'USDC' | 'BTC' | 'WETH'): Address {
  switch (token) {
    case 'USDC':
      return USDC_ADDRESS;
    case 'BTC':
      return CBBTC_ADDRESS;
    case 'WETH':
      return WETH_ADDRESS;
    default:
      return USDC_ADDRESS;
  }
}
