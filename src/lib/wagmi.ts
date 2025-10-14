import { createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { coinbaseWallet } from 'wagmi/connectors';

const PIMLICO_API_KEY = import.meta.env.VITE_PIMLICO_API_KEY || '';

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
    [base.id]: http(`https://api.pimlico.io/v2/base/rpc?apikey=${PIMLICO_API_KEY}`),
  },
});
