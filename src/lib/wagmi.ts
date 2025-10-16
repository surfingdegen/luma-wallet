import { createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { createCDPEmbeddedWalletConnector } from '@coinbase/cdp-wagmi';
import { Config } from '@coinbase/cdp-core';

// CDP Embedded Wallet configuration
const cdpConfig: Config = {
  projectId: import.meta.env.VITE_CDP_PROJECT_ID,
  ethereum: {
    createOnLogin: 'smart',
  },
};

// Create CDP Embedded Wallet connector
const connector = createCDPEmbeddedWalletConnector({
  cdpConfig,
  providerConfig: {
    chains: [base],
    transports: {
      [base.id]: http(import.meta.env.VITE_BASE_RPC_URL),
    },
  },
});

export const config = createConfig({
  chains: [base],
  connectors: [connector],
  transports: {
    [base.id]: http(import.meta.env.VITE_BASE_RPC_URL),
  },
});
