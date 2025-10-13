import { useBalance } from 'wagmi';
import { TOKENS } from '../lib/contracts';
import { Address } from 'viem';

export function useTokenBalances(address: Address | undefined) {
  const { data: usdcBalance, isLoading: isLoadingUsdc, refetch: refetchUsdc } = useBalance({
    address,
    token: TOKENS.USDC.address,
  });

  const { data: cbBtcBalance, isLoading: isLoadingCbBtc, refetch: refetchCbBtc } = useBalance({
    address,
    token: TOKENS.cbBTC.address,
  });

  const refetchAll = () => {
    refetchUsdc();
    refetchCbBtc();
  };

  return {
    balances: {
      USDC: usdcBalance?.formatted || '0',
      cbBTC: cbBtcBalance?.formatted || '0',
    },
    isLoading: isLoadingUsdc || isLoadingCbBtc,
    refetch: refetchAll,
  };
}
