import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Address, parseUnits, formatUnits } from 'viem';
import { MOONWELL_MARKET_ABI, MOONWELL_COMPTROLLER_ABI } from '../lib/moonwellAbi';
import { MOONWELL_MARKETS, TOKENS, DEV_WALLET } from '../lib/contracts';
import { useEffect } from 'react';

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
    ? Number(supplyRate) * 31536000 / 1e18 * 100 // seconds per year
    : 4.5; // fallback to ~4.5% if data not loaded

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

  // Get supplied cbBTC (mToken balance)
  const { data: mTokenBalance } = useReadContract({
    address: MOONWELL_MARKETS.cbBTC,
    abi: MOONWELL_MARKET_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  // Get borrowed USDC amount
  const { data: borrowBalance } = useReadContract({
    address: MOONWELL_MARKETS.USDC,
    abi: MOONWELL_MARKET_ABI,
    functionName: 'borrowBalanceCurrent',
    args: address ? [address] : undefined,
  });

  // Convert values
  const supplied = mTokenBalance ? Number(formatUnits(mTokenBalance, 8)) : 0;
  const borrowed = borrowBalance ? Number(formatUnits(borrowBalance, 6)) : 0;
  
  // liquidity[0] = error code, liquidity[1] = liquidity (can borrow), liquidity[2] = shortfall
  const liquidityValue = liquidity ? Number(formatUnits(liquidity[1], 18)) : 0;
  const shortfall = liquidity ? Number(formatUnits(liquidity[2], 18)) : 0;

  // Calculate health factor
  // If no borrowed amount, health factor is infinite (safe)
  // If shortfall > 0, health factor is below 1 (liquidation risk)
  let healthFactor: number;
  
  if (borrowed === 0) {
    healthFactor = 999; // Effectively infinite when nothing borrowed
  } else if (shortfall > 0) {
    // Position is underwater
    healthFactor = 0.95; // Below 1 = liquidation risk
  } else {
    // Health Factor = (Total Collateral in USD) / (Total Borrowed in USD)
    // Moonwell gives us liquidity = how much more we can borrow
    // So: Total Collateral Value = Borrowed + Liquidity
    const totalCollateralValue = borrowed + liquidityValue;
    healthFactor = borrowed > 0 ? totalCollateralValue / borrowed : 999;
  }

  return {
    supplied,
    borrowed,
    maxBorrow: liquidityValue,
    liquidity: liquidityValue,
    healthFactor: Math.min(healthFactor, 999), // Cap at 999 for display
 };
}

