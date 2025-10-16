import React, { useState } from 'react';
import Modal from './Modal';
import { useVault } from '../hooks/useVault';
import { useAccount } from 'wagmi';
import toast from 'react-hot-toast';

interface SupplyModalProps {
  onClose: () => void;
  t: (key: string) => string;
  btcBalance: string;
  token?: 'USDC' | 'BTC'; // Allow selecting which vault to deposit into
}

export default function SupplyModal({ 
  onClose, 
  t, 
  btcBalance,
  token = 'BTC' // Default to BTC vault since we're showing BTC balance
}: SupplyModalProps) {
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { address } = useAccount();
  
  // Use the vault hook with Circle Paymaster
  // User will pay gas in USDC (even when depositing BTC)
  const { deposit, isLoading, error } = useVault(token);
  
  // Determine decimals based on token
  const decimals = token === 'BTC' ? 8 : 6;
  const tokenSymbol = token === 'BTC' ? 'BTC' : 'USDC';

  /**
   * Handle deposit with Circle Paymaster
   * - Automatically handles approve + deposit in one transaction if needed
   * - User pays gas in USDC via Circle Paymaster
   */
  const handleSupply = async () => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (parseFloat(amount) > parseFloat(btcBalance)) {
      toast.error('Insufficient balance');
      return;
    }

    setIsProcessing(true);

    try {
      // The useVault hook handles everything:
      // 1. Checks if approval is needed
      // 2. If yes: sends approve + deposit in ONE batch transaction
      // 3. If no: sends just deposit
      // 4. User pays gas in USDC via Circle Paymaster
      const hash = await deposit(amount);
      
      console.log('Deposit transaction:', hash);
      toast.success('Deposit successful! 🎉');
      
      // Close modal after short delay to let user see success message
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (err) {
      console.error('Deposit failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Deposit failed';
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // Show error from hook if any
  React.useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const isButtonDisabled = 
    !amount || 
    parseFloat(amount) <= 0 || 
    parseFloat(amount) > parseFloat(btcBalance) || 
    isLoading || 
    isProcessing;

  return (
    <Modal onClose={onClose}>
      <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">
        {t('supplyBTC')}
      </h2>
      
      <div className="space-y-4">
        {/* Balance Display */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">
              {t('availableBalance')}
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {parseFloat(btcBalance).toFixed(decimals)} {tokenSymbol}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('supplyBTCToEarn')}
          </p>
        </div>

        {/* Circle Paymaster Info */}
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-xs text-green-700 dark:text-green-300">
            ⚡ Gas fees paid in USDC - no ETH needed!
          </p>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('amount')}
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`0.${'0'.repeat(decimals)}`}
              step={token === 'BTC' ? '0.00000001' : '0.01'}
              max={btcBalance}
              className="w-full p-3 pr-16 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              disabled={isLoading || isProcessing}
            />
            <button
              onClick={() => setAmount(btcBalance)}
              disabled={isLoading || isProcessing}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 dark:text-blue-400 text-sm font-medium hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('max')}
            </button>
          </div>
        </div>

        {/* Expected Shares */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              {t('youWillReceive')}
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {amount || '0'} {t('vaultShares')}
            </span>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-300">
              {error}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSupply}
          disabled={isButtonDisabled}
          className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
        >
          {isLoading || isProcessing ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t('supplying')}
            </span>
          ) : (
            t('confirm')
          )}
        </button>

        {/* Info Text */}
        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
          By depositing, you'll receive vault shares representing your position.
        </p>
      </div>
    </Modal>
  );
}
