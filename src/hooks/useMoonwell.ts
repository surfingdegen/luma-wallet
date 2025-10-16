import { useState } from 'react';
import { useAccount, usePublicClient, useReadContract } from 'wagmi';
import { Address, parseUnits, encodeFunctionData } from 'viem';
import { base } from 'viem/chains';
import { MOONWELL_MARKET_ABI, MOONWELL_COMPTROLLER_ABI } from '../lib/moonwellAbi';
import { MOONWELL_MARKETS, TOKENS } from '../lib/contracts';
import { useSmartAccountTransaction } from './useSmartAccountTransaction';
import { useVault } from './useVault';
import { CBBTC_ADDRESS, USDC_ADDRESS } from '../config/contracts';

const MOONWELL_COMPTROLLER = '0xfBb21d0380beE3312B33c4353c8936a0F13EF26C' as Address;
const WELL_TOKEN = '0xA88594D404727625A9437C3f886C7643872296AE' as Address;
const MULTI_REWARD_DISTRIBUTOR = '0xe9005b078701e2A0948D2EaC43010D35870Ad9d2' as Address;

// ERC20 ABI for approvals
const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  }
] as const;

/**
 * Hook for supplying assets to Moonwell
 * Uses Circle Paymaster - user pays gas in USDC
 */
export function useMoonwellSupply() {
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId: base.id });
  const { sendUserOperationWithPaymaster, sendBatchUserOperation, isLoading, error } = useSmartAccountTransaction();
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Check if token approval is needed for Moonwell market
   */
  const checkApproval = async (tokenAddress: Address, marketAddress: Address, amount: bigint): Promise<boolean> => {
    if (!address || !publicClient) return false;

    try {
      const allowance = await publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [address, marketAddress]
      });

      return allowance >= amount;
    } catch (err) {
      console.error('Failed to check approval:', err);
      return false;
    }
  };

  /**
   * Supply cbBTC to Moonwell
   * Uses batch operation: approve + enterMarkets + mint in one transaction
   * User pays gas in USDC via Circle Paymaster
   */
  const supply = async (amount: string) => {
    if (!address || !publicClient) {
      throw new Error('Wallet not connected');
    }

    setIsProcessing(true);

    try {
      const amountBigInt = parseUnits(amount, 8); // cbBTC has 8 decimals

      console.log(`Supplying ${amount} cbBTC to Moonwell`);

      // Check if approval is needed
      const hasApproval = await checkApproval(CBBTC_ADDRESS, MOONWELL_MARKETS.cbBTC, amountBigInt);

      // Prepare operations
      const operations = [];

      // If approval needed, add it to the batch
      if (!hasApproval) {
        console.log('Approval needed - including in batch');
        operations.push({
          to: CBBTC_ADDRESS,
          value: BigInt(0),
          data: encodeFunctionData({
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [MOONWELL_MARKETS.cbBTC, amountBigInt]
          })
        });
      }

      // Enter markets (enable as collateral)
      operations.push({
        to: MOONWELL_COMPTROLLER,
        value: BigInt(0),
        data: encodeFunctionData({
          abi: MOONWELL_COMPTROLLER_ABI,
          functionName: 'enterMarkets',
          args: [[MOONWELL_MARKETS.cbBTC]]
        })
      });

      // Supply (mint)
      operations.push({
        to: MOONWELL_MARKETS.cbBTC,
        value: BigInt(0),
        data: encodeFunctionData({
          abi: MOONWELL_MARKET_ABI,
          functionName: 'mint',
          args: [amountBigInt]
        })
      });

      // Send all operations in one transaction
      // User pays gas ONCE in USDC for: approve + enterMarkets + mint
      const hash = await sendBatchUserOperation(operations);

      console.log('Supply successful:', hash);
      return hash;
    } catch (err) {
      console.error('Supply failed:', err);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  return { 
    supply, 
    isLoading: isLoading || isProcessing, 
    error 
  };
}

/**
 * Hook for borrowing from Moonwell
 * Uses Circle Paymaster - user pays gas in USDC
 */
export function useMoonwellBorrow() {
  const { address } = useAccount();
  const { sendUserOperationWithPaymaster, isLoading, error } = useSmartAccountTransaction();
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Borrow USDC from Moonwell
   * User pays gas in USDC via Circle Paymaster
   */
  const borrow = async (amount: string) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    setIsProcessing(true);

    try {
      const amountBigInt = parseUnits(amount, 6); // USDC has 6 decimals

      console.log(`Borrowing ${amount} USDC from Moonwell`);

      // Encode borrow call
      const borrowData = encodeFunctionData({
        abi: MOONWELL_MARKET_ABI,
        functionName: 'borrow',
        args: [amountBigInt]
      });

      // Send with paymaster - user pays gas in USDC
      const hash = await sendUserOperationWithPaymaster(
        MOONWELL_MARKETS.USDC,
        BigInt(0),
        borrowData
      );

      console.log('Borrow successful:', hash);
      return hash;
    } catch (err) {
      console.error('Borrow failed:', err);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  return { 
    borrow, 
    isLoading: isLoading || isProcessing, 
    error 
  };
}

/**
 * Get Moonwell cbBTC supply APY
 */
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

/**
 * Get Moonwell USDC supply APY
 */
export function useMoonwellUSDCSupplyAPY() {
  const { data: supplyRate } = useReadContract({
    address: MOONWELL_MARKETS.USDC,
    abi: MOONWELL_MARKET_ABI,
    functionName: 'supplyRatePerTimestamp',
  });

  // Convert per-timestamp rate to APY
  const apy = supplyRate 
    ? Number(supplyRate) * 31536000 / 1e18 * 100
    : 3.5; // fallback to ~3.5% if data not loaded

  return apy;
}

/**
 * Get Moonwell USDC borrow APY
 */
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

/**
 * Get Moonwell account data
 * Returns: supplied, borrowed, health factor, available to borrow
 */
export function useMoonwellAccountData(userAddress?: Address) {
  const { address: connectedAddress } = useAccount();
  const address = userAddress || connectedAddress;

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

  // Get supplied cbBTC balance from vault
  const { getVaultStats } = useVault('BTC');
  const [supplied, setSupplied] = useState(0);

  // Fetch vault stats on mount
  useState(() => {
    if (address) {
      getVaultStats().then(stats => {
        if (stats) {
          setSupplied(Number(stats.userAssets) / 1e8); // Convert from wei
        }
      });
    }
  });

  // Safe defaults
  const borrowed = borrowBalance ? Number(borrowBalance) / 1e6 : 0;
  
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
