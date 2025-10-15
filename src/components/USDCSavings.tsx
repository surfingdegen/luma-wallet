import React from 'react';
import { DollarSign } from 'lucide-react';

interface USDCSavingsProps {
  balance: string;
  apy: number;
  onSupply: () => void;
  t: (key: string) => string;
}

export default function USDCSavings({ 
  balance, 
  apy, 
  onSupply, 
  t 
}: USDCSavingsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 h-32">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t('usdcSavings')}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400">
              {apy.toFixed(2)}% {t('apy')}
            </p>
          </div>
        </div>
        <button
          onClick={onSupply}
          className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline"
        >
          {t('supply')}
        </button>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">
        ${parseFloat(balance).toFixed(2)}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        {t('earnInterest')}
      </p>
    </div>
  );
}
