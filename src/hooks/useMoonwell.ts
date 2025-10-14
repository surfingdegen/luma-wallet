import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Address, parseUnits } from 'viem';
import { MOONWELL_MARKET_ABI, MOONWELL_COMPTROLLER_ABI } from '../lib/moonwellAbi';
import { MOONWELL_MARKETS, TOKENS } from '../lib/contracts';

const MOONWELL_COMPTROLLER = '0xfBb21d0380beE3312B33c4353c8936a0F13EF26C' as Address;

export function useMoonwellSupply() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const supply = async (amount: string) => {
    const amountWei = parseUnits(amount, TOKENS.cbBTC.decimals);
    
    return writeContract({
      address: MOONWELL_MARKETS.cbBTC,
      abi: MOONWELL_MARKET_ABI,
      functionName: 'mint',
      args: [amountWei],
    });
  };

  return { supply, isPending: isPending || isConfirming, isSuccess };
}

export function useMoonwellBorrow() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const borrow = async (amount: string) => {
    const amountWei = parseUnits(amount, TOKENS.USDC.decimals);
    
    // First enter markets (enable as collateral)
    await writeContract({
      address: MOONWELL_COMPTROLLER,
      abi: MOONWELL_COMPTROLLER_ABI,
      functionName: 'enterMarkets',
      args: [[MOONWELL_MARKETS.cbBTC]],
    });

    // Then borrow
    return writeContract({
      address: MOONWELL_MARKETS.USDC,
      abi: MOONWELL_MARKET_ABI,
      functionName: 'borrow',
      args: [amountWei],
    });
  };

  return { borrow, isPending: isPending || isConfirming, isSuccess };
}

export function useMoonwellSupplyAPY() {
  const { data: supplyRate } = useReadContract({
    address: MOONWELL_MARKETS.cbBTC,
    abi: MOONWELL_MARKET_ABI,
    functionName: 'supplyRatePerTimestamp',
  });

  // Convert per-timestamp rate to APY
  const apy = supplyRate 
    ? Number(supplyRate) * 31536000 / 1e18 * 100 // seconds per year
    : 0;

  return apy;
}

export function useMoonwellAccountData(address?: Address) {
  const { data: liquidity } = useReadContract({
    address: MOONWELL_COMPTROLLER,
    abi: MOONWELL_COMPTROLLER_ABI,
    functionName: 'getAccountLiquidity',
    args: address ? [address] : undefined,
  });

  const { data: supplied } = useReadContract({
    address: MOONWELL_MARKETS.cbBTC,
    abi: MOONWELL_MARKET_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  return {
    supplied: supplied ? Number(supplied) / 1e8 : 0,
    maxBorrow: liquidity ? Number(liquidity[1]) / 1e6 : 0,
    liquidity: liquidity ? Number(liquidity[1]) / 1e6 : 0,
  };
}
