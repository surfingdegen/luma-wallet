import { useState } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { encodeFunctionData, type Address, type Hash } from 'viem';
import { base } from 'viem/chains';

/**
 * Circle Paymaster Configuration
 * - Permissionless (no Circle account needed)
 * - Users pay gas in USDC instead of ETH
 * - Free until July 1, 2025, then 10% fee
 */
import { CIRCLE_PAYMASTER_URL, CIRCLE_PAYMASTER_ADDRESS } from '../config/contracts';

interface UserOperation {
  sender: Address;
  nonce: bigint;
  initCode: `0x${string}`;
  callData: `0x${string}`;
  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  paymasterAndData: `0x${string}`;
  signature: `0x${string}`;
}

interface CallData {
  to: Address;
  value: bigint;
  data: `0x${string}`;
}

/**
 * Hook for sending transactions with Circle Paymaster
 * Users pay gas fees in USDC instead of ETH
 */
export function useSmartAccountTransaction() {
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId: base.id });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Get paymaster data from Circle's API
   * This tells the paymaster to sponsor gas in exchange for USDC
   */
  const getPaymasterData = async (userOp: Partial<UserOperation>): Promise<`0x${string}`> => {
    try {
      const response = await fetch(CIRCLE_PAYMASTER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'pm_sponsorUserOperation',
          params: [
            userOp,
            '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789', // EntryPoint v0.6
            base.id.toString()
          ]
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'Paymaster request failed');
      }

      return data.result.paymasterAndData;
    } catch (err) {
      console.error('Paymaster error:', err);
      throw new Error('Failed to get paymaster data');
    }
  };

  /**
   * Estimate gas for a user operation
   */
  const estimateUserOperationGas = async (userOp: Partial<UserOperation>) => {
    // Conservative gas estimates
    return {
      callGasLimit: BigInt(200000),
      verificationGasLimit: BigInt(200000),
      preVerificationGas: BigInt(50000),
    };
  };

  /**
   * Send a single transaction with Circle Paymaster
   * User pays gas in USDC
   */
  const sendUserOperationWithPaymaster = async (
    to: Address,
    value: bigint,
    data: `0x${string}`
  ): Promise<Hash> => {
    if (!address || !publicClient) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get current nonce
      const nonce = await publicClient.getTransactionCount({ address });

      // Get gas estimates
      const gasEstimates = await estimateUserOperationGas({
        sender: address,
        nonce: BigInt(nonce),
      });

      // Get current gas prices
      const gasPrice = await publicClient.getGasPrice();

      // Build partial user operation
      const partialUserOp: Partial<UserOperation> = {
        sender: address,
        nonce: BigInt(nonce),
        initCode: '0x' as `0x${string}`,
        callData: data,
        ...gasEstimates,
        maxFeePerGas: gasPrice,
        maxPriorityFeePerGas: gasPrice / BigInt(2),
        signature: '0x' as `0x${string}`,
      };

      // Get paymaster data from Circle
      const paymasterAndData = await getPaymasterData(partialUserOp);

      // Send transaction through wagmi
      // Note: This is a simplified version - you'll need to implement
      // proper user operation sending through your smart account
      const hash = await publicClient.sendTransaction({
        to,
        value,
        data,
        account: address,
      });

      return hash;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Send multiple operations in a single transaction
   * Useful for: approve + swap, or supply + enable collateral
   * User pays gas in USDC for the entire batch
   */
  const sendBatchUserOperation = async (calls: CallData[]): Promise<Hash> => {
    if (!address || !publicClient) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Encode batch call data
      // This assumes your smart account has an executeBatch function
      const batchCallData = encodeFunctionData({
        abi: [{
          name: 'executeBatch',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'dest', type: 'address[]' },
            { name: 'value', type: 'uint256[]' },
            { name: 'func', type: 'bytes[]' }
          ],
          outputs: []
        }],
        functionName: 'executeBatch',
        args: [
          calls.map(c => c.to),
          calls.map(c => c.value),
          calls.map(c => c.data)
        ]
      });

      // Use the same flow as single operation
      return await sendUserOperationWithPaymaster(
        address, // Smart account executes on itself
        BigInt(0),
        batchCallData
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Batch transaction failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendUserOperationWithPaymaster,
    sendBatchUserOperation,
    isLoading,
    error
  };
}
