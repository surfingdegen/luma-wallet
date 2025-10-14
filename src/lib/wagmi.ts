import { createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { coinbaseWallet } from 'wagmi/connectors';

export const config = createConfig({
  chains: [base],
  connectors: [
    coinbaseWallet({
      appName: 'Luma Wallet',
      preference: 'smartWalletOnly',
      version: '4',
    }),
  ],
  transports: {
    [base.id]: http('https://mainnet.base.org'), // Use regular Base RPC
  },
});

// Pimlico config for later use
export const PIMLICO_API_KEY = import.meta.env.VITE_PIMLICO_API_KEY || '';
