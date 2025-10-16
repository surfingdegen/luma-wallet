import { useState } from 'react';
import { useAccount, usePublicClient, useWalletClient, useReadContract } from 'wagmi';
import { encodeFunctionData, type Address, parseUnits } from 'viem';
import { base } from 'viem/chains';
import { useSmartAccountTransaction } from './useSmartAccountTransaction';
import { LUMA_VAULT_ABI } from '../lib/vaultAbi';
import { 
  LUMA_USDC_VAULT_ADDRESS, 
  LUMA_BTC_VAULT_ADDRESS,
  USDC_ADDRESS,
  CBBTC_ADDRESS,
  getVaultAddress,
  getTokenAddress
} from '../config/contracts';

// ERC20 ABI - For token approvals
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

interface VaultStats {
  userShares: string;
  totalAssets: string;
  userAssets: string;
}

/**
 * Hook for interacting with Luma Vaults
 * Supports both USDC and cbBTC vaults
 * Uses Circle Paymaster - users pay gas in USDC
 * 
 * @param token - 'USDC' or 'BTC' (defaults to 'USDC')
 */
export function useVault(token: 'USDC' | 'BTC' = 'USDC') {
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId: base.id });
  const { data: walletClient } = useWalletClient();
  
  // Get the appropriate vault and token addresses based on token type
  const vaultAddress = getVaultAddress(token);
  const tokenAddress = getTokenAddress(token);
  const tokenDecimals = token === 'USDC' ? 6 : 8; // USDC has 6 decimals, cbBTC has 8
  
  // Import paymaster utilities
  const { 
    sendUserOperationWithPaymaster, 
    sendBatchUserOperation,
    isLoading: isPaymasterLoading,
    error: paymasterError 
  } = useSmartAccountTransaction();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Get user's vault statistics
   */
  const getVaultStats = async (): Promise<VaultStats | null> => {
    if (!address || !publicClient) return null;

    try {
      // Get user's balance using getUserBalance
      const balance = await publicClient.readContract({
        address: vaultAddress,
        abi: LUMA_VAULT_ABI,
        functionName: 'getUserBalance',
        args: [address]
      });

      // Get user's shares
      const shares = await publicClient.readContract({
        address: vaultAddress,
        abi: LUMA_VAULT_ABI,
        functionName: 'userShares',
        args: [address]
      });

      // Get total vault assets using getTotalAssets
      const totalAssets = await publicClient.readContract({
        address: vaultAddress,
        abi: LUMA_VAULT_ABI,
        functionName: 'getTotalAssets',
        args: []
      });

      return {
        userShares: shares.toString(),
        totalAssets: totalAssets.toString(),
        userAssets: balance.toString()
      };
    } catch (err) {
      console.error('Failed to get vault stats:', err);
      return null;
    }
  };

  /**
   * Check if token approval is needed for vault
   */
  const checkApproval = async (amount: bigint): Promise<boolean> => {
    if (!address || !publicClient) return false;

    try {
      const allowance = await publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [address, vaultAddress]
      });

      return allowance >= amount;
    } catch (err) {
      console.error('Failed to check approval:', err);
      return false;
    }
  };

  /**
   * Deposit tokens into vault
   * Uses batch operation: approve + deposit in one transaction
   * User pays gas in USDC via Circle Paymaster
   */
  const deposit = async (amount: string) => {
    if (!address || !publicClient) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Convert amount to proper decimals (6 for USDC, 8 for cbBTC)
      const amountBigInt = parseUnits(amount, tokenDecimals);

      console.log(`Depositing ${amount} ${token} to vault ${vaultAddress}`);

      // Check if approval is needed
      const hasApproval = await checkApproval(amountBigInt);

      if (!hasApproval) {
        console.log('Approval needed - using batch operation');

        // Encode approve call
        const approveData = encodeFunctionData({
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [vaultAddress, amountBigInt]
        });

        // Encode deposit call - your vault only takes amount
        const depositData = encodeFunctionData({
          abi: LUMA_VAULT_ABI,
          functionName: 'deposit',
          args: [amountBigInt]
        });

        // Send both operations in one transaction
        // User pays gas ONCE for both approve + deposit (in USDC)
        const hash = await sendBatchUserOperation([
          {
            to: tokenAddress,
            value: BigInt(0),
            data: approveData
          },
          {
            to: vaultAddress,
            value: BigInt(0),
            data: depositData
          }
        ]);

        console.log('Batch deposit successful:', hash);
        return hash;
      } else {
        console.log('Already approved - single deposit');

        // Just deposit (already approved)
        const depositData = encodeFunctionData({
          abi: LUMA_VAULT_ABI,
          functionName: 'deposit',
          args: [amountBigInt]
        });

        // Send single operation with paymaster
        const hash = await sendUserOperationWithPaymaster(
          vaultAddress,
          BigInt(0),
          depositData
        );

        console.log('Deposit successful:', hash);
        return hash;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Deposit failed';
      setError(errorMessage);
      console.error('Deposit error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Withdraw tokens from vault
   * User pays gas in USDC via Circle Paymaster
   */
  const withdraw = async (amount: string) => {
    if (!address || !publicClient) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Convert amount to proper decimals (6 for USDC, 8 for cbBTC)
      const amountBigInt = parseUnits(amount, tokenDecimals);

      console.log(`Withdrawing ${amount} ${token} from vault ${vaultAddress}`);

      // Encode withdraw call - your vault only takes shares amount
      const withdrawData = encodeFunctionData({
        abi: LUMA_VAULT_ABI,
        functionName: 'withdraw',
        args: [amountBigInt]
      });

      // Send with paymaster - user pays gas in USDC
      const hash = await sendUserOperationWithPaymaster(
        vaultAddress,
        BigInt(0),
        withdrawData
      );

      console.log('Withdrawal successful:', hash);
      return hash;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Withdrawal failed';
      setError(errorMessage);
      console.error('Withdrawal error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    deposit,
    withdraw,
    getVaultStats,
    isLoading: isLoading || isPaymasterLoading,
    error: error || paymasterError,
    vaultAddress, // Expose for debugging
    tokenAddress, // Expose for debugging
    tokenDecimals // Expose for debugging
  };
}

/**
 * Read-only hook to get BTC vault balance
 * Used by LumaWallet for displaying balance
 */
export function useVaultBalance(userAddress?: Address) {
  const { address: connectedAddress } = useAccount();
  const address = userAddress || connectedAddress;
  
  // Get user's balance using the correct vault functions
  const { data: balance } = useReadContract({
    address: LUMA_BTC_VAULT_ADDRESS,
    abi: LUMA_VAULT_ABI,
    functionName: 'getUserBalance',
    args: address ? [address] : undefined,
  });

  // Get user's shares
  const { data: shares } = useReadContract({
    address: LUMA_BTC_VAULT_ADDRESS,
    abi: LUMA_VAULT_ABI,
    functionName: 'userShares',
    args: address ? [address] : undefined,
  });

  const balanceFormatted = balance ? Number(balance) / 1e8 : 0; // cbBTC has 8 decimals
  const sharesFormatted = shares ? Number(shares) / 1e8 : 0;

  return {
    balance: balanceFormatted,
    shares: sharesFormatted
  };
}
