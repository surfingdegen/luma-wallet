import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useEffect } from 'react';

export function useSmartWallet() {
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    if (!isConnected && !isConnecting) {
      const coinbaseConnector = connectors[0];
      if (coinbaseConnector) {
        connect({ connector: coinbaseConnector });
      }
    }
  }, [isConnected, isConnecting, connect, connectors]);

  return {
    address,
    isConnected,
    isConnecting,
    disconnect,
  };
}
