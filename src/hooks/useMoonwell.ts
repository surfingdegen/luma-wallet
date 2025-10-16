import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Address, parseUnits, formatUnits } from 'viem';
import { MOONWELL_MARKET_ABI, MOONWELL_COMPTROLLER_ABI } from '../lib/moonwellAbi';
import { MOONWELL_MARKETS, TOKENS, DEV_WALLET } from '../lib/contracts';
import { useEffect } from 'react';
import { useVaultBalance } from './useVault';  // <-- ADD THIS LINE

const MOONWELL_COMPTROLLER = '0xfBb21d0380beE3312B33c4353c8936a0F13EF26C' as Address;
const WELL_TOKEN = '0xA88594D404727625A9437C3f886C7643872296AE' as Address;

// Moonwell Multi-Reward Distributor for claiming WELL rewards
const MULTI_REWARD_DISTRIBUTOR = '0xe9005b078701e2A0948D2EaC43010D35870Ad9d2' as Address;

export function useMoonwellSupply() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const supply = async (amount: string) => {
    const amountWei = parseUnits(amount, TOKENS.cbBTC.decimals);
    
    // First, enter markets (enable cbBTC as collateral)
    try {
      await writeContract({
        address: MOONWELL_COMPTROLLER,
        abi: MOONWELL_COMPTROLLER_ABI,
        functionName: 'enterMarkets',
        args: [[MOONWELL_MARKETS.cbBTC]],
      });
    } catch (e) {
      console.log('Already in market or error:', e);
    }
    
    // Then supply
    return writeContract({
      address: MOONWELL_MARKETS.cbBTC,
      abi: MOONWELL_MARKET_ABI,
      functionName: 'mint',
      args: [amountWei],
    });
  };

  return { supply, isPending: isPending || isConfirming, isSuccess, hash };
}

export function useMoonwellBorrow() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const borrow = async (amount: string) => {
    const amountWei = parseUnits(amount, TOKENS.USDC.decimals);
    
    return writeContract({
      address: MOONWELL_MARKETS.USDC,
      abi: MOONWELL_MARKET_ABI,
      functionName: 'borrow',
      args: [amountWei],
    });
  };

  return { borrow, isPending: isPending || isConfirming, isSuccess, hash };
}

export function useMoonwellSupplyAPY() {
  const { data: supplyRate } = useReadContract({
    address: MOONWELL_MARKETS.cbBTC,
    abi: MOONWELL_MARKET_ABI,
    functionName: 'supplyRatePerTimestamp',
});

  // Convert per-timestamp rate to APY
  // Moonwell uses per-second rates on Base
  const apy = supplyRate 
    ? Number(supplyRate) * 31536000 / 1e18 * 100
    : 4.5; // fallback to ~4.5% if data not loaded

  return apy;
}
export function useMoonwellUSDCSupplyAPY() {
  const { data: supplyRate } = useReadContract({
    address: MOONWELL_MARKETS.USDC,
    abi: MOONWELL_MARKET_ABI,
    functionName: 'supplyRatePerTimestamp',
  });

  // Convert per-timestamp rate to APY
  // Moonwell uses per-second rates on Base
  const apy = supplyRate 
    ? Number(supplyRate) * 31536000 / 1e18 * 100
    : 3.5; // fallback to ~3.5% if data not loaded

  return apy;
}

export function useMoonwellBorrowAPY() {
  const { data: borrowRate } = useReadContract({
    address: MOONWELL_MARKETS.USDC,
    abi: MOONWELL_MARKET_ABI,
    functionName: 'borrowRatePerTimestamp',
  });

  // Convert per-timestamp rate to APY
  const apy = borrowRate 
    ? Number(borrowRate) * 31536000 / 1e18 * 100
    : 8.0; // fallback

  return apy;
}

export function useMoonwellAccountData(address?: Address) {
  // Get liquidity data from comptroller
  const { data: liquidity } = useReadContract({
    address: MOONWELL_COMPTROLLER,
    abi: MOONWELL_COMPTROLLER_ABI,
    functionName: 'getAccountLiquidity',
    args: address ? [address] : undefined,
  });

  // Get borrowed USDC
  const { data: borrowBalance } = useReadContract({
    address: MOONWELL_MARKETS.USDC,
    abi: MOONWELL_MARKET_ABI,
    functionName: 'borrowBalanceStored',
    args: address ? [address] : undefined,
  });

  // Get supplied BTC (from vault balance)
  const vaultBalance = useVaultBalance(address);

  // Safe defaults
  const borrowed = borrowBalance ? Number(borrowBalance) / 1e6 : 0;
  const supplied = vaultBalance || 0;
  
  // Calculate health factor safely
  const liquidityValue = liquidity?.[1] ? Number(liquidity[1]) / 1e18 : 0;
  const shortfallValue = liquidity?.[2] ? Number(liquidity[2]) / 1e18 : 0;
  
  let healthFactor = 999;
  if (borrowed > 0) {
    healthFactor = liquidityValue > 0 ? liquidityValue / (borrowed * 0.75) : 999;
  }

  // Available to borrow (75% of collateral value minus already borrowed)
  const availableToBorrow = Math.max(0, (supplied * 0.75) - borrowed);

  return {
    supplied: typeof supplied === 'number' ? supplied : 0,
    borrowed: typeof borrowed === 'number' ? borrowed : 0,
    healthFactor: typeof healthFactor === 'number' ? healthFactor : 999,
    availableToBorrow: typeof availableToBorrow === 'number' ? availableToBorrow : 0,
  };
}   
