import { useCallback } from 'react';
import { usePublicClient, useWalletClient } from 'wagmi';
import { Address } from 'viem';
import { TOKENS } from '../lib/contracts';

export function usePimlicoPaymaster() {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  /**
   * Check if user has USDC
   */
  const checkUSDCBalance = useCallback(async (address: Address): Promise<bigint> => {
    if (!publicClient) return 0n;

    try {
      const balance = await publicClient.readContract({
        address: TOKENS.USDC.address,
        abi: TOKENS.USDC.abi,
        functionName: 'balanceOf',
        args: [address],
      });
      return balance as bigint;
    } catch (error) {
      console.error('Error checking USDC balance:', error);
      return 0n;
    }
  }, [publicClient]);

  /**
   * Send transaction - Coinbase Smart Wallet automatically uses
   * ERC20 paymaster when user has USDC (no ETH needed!)
   */
  const sendWithPaymaster = useCallback(async (
    transaction: {
      to: Address;
      data: `0x${string}`;
      value?: bigint;
    }
  ) => {
    if (!walletClient) {
      throw new Error('Wallet not connected');
    }

    try {
      const userAddress = walletClient.account.address;

      // Check if user has USDC
      const usdcBalance = await checkUSDCBalance(userAddress);
      
      console.log('💰 USDC Balance:', usdcBalance.toString());

      if (usdcBalance === 0n) {
        console.warn('⚠️ User has no USDC - transaction will require ETH');
      } else {
        console.log('✅ User has USDC - will use for gas fees');
      }

      // Coinbase Smart Wallet automatically detects USDC and uses it for gas
      const hash = await walletClient.sendTransaction({
        account: userAddress,
        to: transaction.to,
        data: transaction.data,
        value: transaction.value || 0n,
        chain: walletClient.chain,
      });

      console.log('✅ Transaction sent:', hash);
      return hash;

    } catch (error) {
      console.error('❌ Transaction failed:', error);
      throw error;
    }
  }, [walletClient, checkUSDCBalance]);

  return {
    sendWithPaymaster,
    checkUSDCBalance,
  };
}
