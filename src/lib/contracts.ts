import { erc20Abi, Address } from 'viem';

export const TOKENS = {
  USDC: {
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address,
    decimals: 6,
    symbol: 'USDC',
    displaySymbol: 'USDC',
    abi: erc20Abi,
  },
  cbBTC: {
    address: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf' as Address,
    decimals: 8,
    symbol: 'cbBTC',
    displaySymbol: 'BTC',
    abi: erc20Abi,
  },
} as const;

export type TokenSymbol = 'USDC' | 'cbBTC';
export type DisplayToken = 'USDC' | 'BTC';

export function getInternalToken(displayToken: DisplayToken): TokenSymbol {
  return displayToken === 'BTC' ? 'cbBTC' : 'USDC';
}

export function getDisplaySymbol(internalToken: TokenSymbol): DisplayToken {
  return TOKENS[internalToken].displaySymbol as DisplayToken;
}

export const DEV_WALLET = import.meta.env.VITE_DEV_WALLET || 
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1';

export const MOONWELL_MARKETS = {
  cbBTC: import.meta.env.VITE_MOONWELL_CBBTC_MARKET as Address,
  USDC: import.meta.env.VITE_MOONWELL_USDC_MARKET as Address,
};

export function parseTokenAmount(amount: string, decimals: number): bigint {
  const [whole, fraction = ''] = amount.split('.');
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(whole + paddedFraction);
}

export function formatTokenAmount(amount: bigint, decimals: number): string {
  const str = amount.toString().padStart(decimals + 1, '0');
  const whole = str.slice(0, -decimals) || '0';
  const fraction = str.slice(-decimals).replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : whole;
}
export const LUMA_VAULT = import.meta.env.VITE_LUMA_VAULT_ADDRESS as Address;
