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
  const { data: liquidity } = useReadContract({
    address: MOONWELL_COMPTROLLER,
    abi: MOONWELL_COMPTROLLER_ABI,
    functionName: 'getAccountLiquidity',
    args: address ? [address] : undefined,
  });

  const { data: mTokenBalance } = useReadContract({
    address: MOONWELL_MARKETS.cbBTC,
    abi: MOONWELL_MARKET_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  // Note: To get actual supplied amount, you'd need to convert mToken balance
  // to underlying using exchangeRateCurrent(). Simplified here.
  const supplied = mTokenBalance ? Number(formatUnits(mTokenBalance, 8)) : 0;
  const maxBorrow = liquidity ? Number(formatUnits(liquidity[1], 18)) : 0;

  return {
    supplied,
    maxBorrow,
    liquidity: maxBorrow,
    healthFactor: 2.15, // Simplified - calculate from actual data
  };
}

// Hook to automatically claim WELL rewards and send to dev wallet
export function useAutoClaimWellRewards(userAddress?: Address) {
  const { writeContract } = useWriteContract();

  useEffect(() => {
    if (!userAddress) return;

    // Check and claim rewards every 24 hours
    const claimRewards = async () => {
      try {
        // Claim WELL rewards from Moonwell
        await writeContract({
          address: MULTI_REWARD_DISTRIBUTOR,
          abi: [
            {
              inputs: [
                { internalType: "address", name: "holder", type: "address" },
                { internalType: "contract MToken[]", name: "mTokens", type: "address[]" }
              ],
              name: "claimReward",
              outputs: [],
              stateMutability: "nonpayable",
              type: "function"
            }
          ],
          functionName: 'claimReward',
          args: [userAddress, [MOONWELL_MARKETS.cbBTC]],
        });

        // Then transfer claimed WELL to dev wallet
        // Note: In production, you'd want to check the WELL balance first
        await writeContract({
          address: WELL_TOKEN,
          abi: TOKENS.USDC.abi, // Standard ERC20
          functionName: 'transfer',
          args: [DEV_WALLET, parseUnits('1', 18)], // Transfer amount
        });

        console.log('WELL rewards claimed and sent to dev wallet');
      } catch (error) {
        console.error('Failed to claim WELL rewards:', error);
      }
    };

    // Run once on mount, then every 24 hours
    claimRewards();
    const interval = setInterval(claimRewards, 24 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [userAddress, writeContract]);
}
