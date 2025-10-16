import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';
import { useMoonwellBorrow, useMoonwellAccountData } from '../hooks/useMoonwell';
import { useAccount, useWriteContract } from 'wagmi';
import { TOKENS, MOONWELL_MARKETS } from '../lib/contracts';
import toast from 'react-hot-toast';

interface BorrowModalProps {
  onClose: () => void;
  maxBorrow: number;
  t: (key: string) => string;
}

export default function BorrowModal({ onClose, maxBorrow, t }: BorrowModalProps) {
  const [amount, setAmount] = useState('');
  const { address } = useAccount();
  const { borrow, isPending, isSuccess } = useMoonwellBorrow();
  const accountData = useMoonwellAccountData(address);
  const availableLiquidity = accountData.availableToBorrow || 0;
  
  // Calculate health factor
  const currentHealth = accountData.healthFactor || 2.15;
  const estimatedHealth = amount 
    ? Math.max(1.0, currentHealth - (parseFloat(amount) / maxBorrow) * 1.0)
    : currentHealth;
  const isLowHealth = estimatedHealth < 1.5;

  const handleBorrow = async () => {
    if (isLowHealth) {
      toast.error('This borrow would put your health factor below 1.5!');
      return;
    }
    
    try {
      await borrow(amount);
      toast.success('Borrow transaction submitted!');
    } catch (error: any) {
      console.error('Borrow failed:', error);
      toast.error(error?.message || 'Borrow failed');
    }
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success('Borrow confirmed!');
      onClose();
    }
  }, [isSuccess, onClose]);
  
  // Check if user has supplied collateral
  if (accountData.supplied === 0) {
    return (
      <Modal onClose={onClose}>
        <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">
          {t('borrowUSDC')}
        </h2>
        
        <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <AlertTriangle className="w-12 h-12 text-yellow-600 dark:text-yellow-400 mx-auto mb-4" />
          <h3 className="text-center font-semibold text-gray-900 dark:text-white mb-2">
            {t('noCollateralSupplied')}
          </h3>
          <p className="text-center text-sm text-gray-700 dark:text-gray-300">
            {t('needBTCCollateral')}
          </p>
        </div>
        
        <button
          onClick={onClose}
          className="w-full mt-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
        >
          {t('gotIt')}
        </button>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose}>
      <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">
        {t('borrowUSDC')}
      </h2>
      
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">{t('maxAvailable')}</span>
            <span className="font-medium text-gray-900 dark:text-white">
              ${availableLiquidity.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('borrowUpTo75')}
          </p>
        </div>

        {isLowHealth && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-300">
                  Warning: Low Health Factor
                </p>
                <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                  This borrow amount would put you at risk of liquidation
                </p>
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('amount')}
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              max={availableLiquidity}
              className="w-full p-3 pr-16 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <button
              onClick={() => setAmount(availableLiquidity.toString())}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 dark:text-blue-400 text-sm font-medium hover:text-blue-700 dark:hover:text-blue-300"
            >
              {t('max')}
            </button>
          </div>
        </div>

        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">{t('currentHealth')}</span>
            <span className={`font-semibold ${
              currentHealth >= 2 ? 'text-green-600' : 
              currentHealth >= 1.5 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {currentHealth.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">{t('estimatedHealth')}</span>
            <span className={`font-semibold ${
              estimatedHealth >= 2 ? 'text-green-600' : 
              estimatedHealth >= 1.5 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {estimatedHealth.toFixed(2)}
            </span>
          </div>
        </div>

        <button
          onClick={handleBorrow}
          disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > availableLiquidity || isPending || isLowHealth}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
        >
          {isPending ? t('borrowing') : t('confirm')}
        </button>
      </div>
    </Modal>
  );
}
