import { useBalance } from 'wagmi';
import { TOKENS } from '../lib/contracts';
import { Address } from 'viem';

export function useTokenBalances(address: Address | undefined) {
  const { data: usdcData, isLoading: isLoadingUsdc, refetch: refetchUsdc } = useBalance({
    address,
    token: TOKENS.USDC.address,
  });

  const { data: cbBtcData, isLoading: isLoadingCbBtc, refetch: refetchCbBtc } = useBalance({
    address,
    token: TOKENS.cbBTC.address,
  });

  const refetchAll = () => {
    refetchUsdc();
    refetchCbBtc();
  };

  return {
    usdcBalance: usdcData?.formatted || '0.00',
    btcBalance: cbBtcData?.formatted || '0.00000000',
    isLoading: isLoadingUsdc || isLoadingCbBtc,
    refetch: refetchAll,
  };
}
