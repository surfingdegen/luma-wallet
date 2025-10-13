import React, { useState } from 'react';
import Modal from './Modal';
import { useTokenBalances } from '../hooks/useBalances';
import { Address } from 'viem';

interface SupplyModalProps {
  onClose: () => void;
  t: (key: string) => string;
}

export default function SupplyModal({ onClose, t }: SupplyModalProps) {
  const [amount, setAmount] = useState('');
  const [isSupplying, setIsSupplying] = useState(false);

  // Mock balance - replace with real hook
  const btcBalance = '0.05';

  const handleSupply = async () => {
    setIsSupplying(true);
    try {
      // TODO: Implement actual Moonwell supply transaction
      console.log('Supplying', amount, 'BTC to Moonwell');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate transaction
      alert('Supply successful!');
      onClose();
    } catch (error) {
      console.error('Supply failed:', error);
      alert('Supply failed');
    } finally {
      setIsSupplying(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">
        {t('supply')} BTC
      </h2>
      
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">Available Balance</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {parseFloat(btcBalance).toFixed(8)} BTC
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Supply BTC as collateral to borrow USDC
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('amount')}
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00000000"
              step="0.00000001"
              max={btcBalance}
              className="w-full p-3 pr-16 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <button
              onClick={() => setAmount(btcBalance)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 dark:text-blue-400 text-sm font-medium hover:text-blue-700 dark:hover:text-blue-300"
            >
              {t('max')}
            </button>
          </div>
        </div>

        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">You will receive</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {amount || '0'} mwBTC
            </span>
          </div>
        </div>

        <button
          onClick={handleSupply}
          disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(btcBalance) || isSupplying}
          className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
        >
          {isSupplying ? 'Supplying...' : t('confirm')}
        </button>
      </div>
    </Modal>
  );
}
