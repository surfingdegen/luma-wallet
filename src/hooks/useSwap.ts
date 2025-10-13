import { useState, useEffect } from 'react';
import { usePublicClient, useWalletClient, useAccount } from 'wagmi';
import { 
  getSwapQuote, 
  executeSwap, 
  checkAndApproveToken,
  type SwapQuote
} from '../lib/aerodrome';

export function useSwap() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [needsApproval, setNeedsApproval] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const fetchQuote = async (
    tokenIn: 'USDC' | 'BTC',
    tokenOut: 'USDC' | 'BTC',
    amountIn: string,
    slippage: number = 0.5
  ) => {
    if (!publicClient || !amountIn || parseFloat(amountIn) <= 0) {
      setQuote(null);
      return;
    }

    setIsLoadingQuote(true);
    try {
      const quoteData = await getSwapQuote(
        tokenIn,
        tokenOut,
        amountIn,
        slippage,
        publicClient
      );
      
      setQuote(quoteData);

      if (address && walletClient) {
        const { needsApproval: needs } = await checkAndApproveToken(
          tokenIn,
          amountIn,
          address,
          publicClient,
          walletClient
        );
        setNeedsApproval(needs);
      }
    } catch (error) {
      console.error('Failed to fetch quote:', error);
      setQuote(null);
    } finally {
      setIsLoadingQuote(false);
    }
  };

  const approveToken = async (
    token: 'USDC' | 'BTC',
    amount: string
  ) => {
    if (!address || !walletClient || !publicClient) return;

    setIsApproving(true);
    try {
      const { needsApproval: needs, hash } = await checkAndApproveToken(
        token,
        amount,
        address,
        publicClient,
        walletClient
      );

      if (hash) {
        await publicClient.waitForTransactionReceipt({ hash });
      }
      
      setNeedsApproval(false);
      return true;
    } catch (error) {
      console.error('Approval failed:', error);
      throw error;
    } finally {
      setIsApproving(false);
    }
  };

  const swap = async (
    tokenIn: 'USDC' | 'BTC',
    tokenOut: 'USDC' | 'BTC',
    amountIn: string
  ) => {
    if (!address || !walletClient || !publicClient || !quote) {
      throw new Error('Missing required data for swap');
    }

    setIsSwapping(true);
    try {
      const hash = await executeSwap(
        tokenIn,
        tokenOut,
        amountIn,
        quote,
        address,
        walletClient
      );

      await publicClient.waitForTransactionReceipt({ hash });
      
      return hash;
    } catch (error) {
      console.error('Swap failed:', error);
      throw error;
    } finally {
      setIsSwapping(false);
    }
  };

  return {
    quote,
    isLoadingQuote,
    fetchQuote,
    needsApproval,
    isApproving,
    approveToken,
    isSwapping,
    swap
  };
}
