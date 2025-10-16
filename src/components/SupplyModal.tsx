import React, { useState } from 'react';
import Modal from './Modal';
import { useTokenBalances } from '../hooks/useBalances';
import { useVaultDeposit } from '../hooks/useVault';
import { useAccount, useWriteContract } from 'wagmi';
import { TOKENS, LUMA_VAULT } from '../lib/contracts';
import { parseUnits } from 'viem';
import toast from 'react-hot-toast';

interface SupplyModalProps {
  onClose: () => void;
  t: (key: string) => string;
  btcBalance: string;
}

export default function SupplyModal({ onClose, t, btcBalance }: SupplyModalProps) {
  const [amount, setAmount] = useState('');
  const { address } = useAccount();
  const { deposit, isPending, isSuccess } = useVaultDeposit();
  const { writeContract } = useWriteContract();
  
  // Debug logs
  console.log('SupplyModal Debug:', { address, btcBalance });

  const handleSupply = async () => {
    try {
      // First approve the vault to spend cbBTC
      const amountWei = parseUnits(amount, TOKENS.cbBTC.decimals);
      
      await writeContract({
        address: TOKENS.cbBTC.address,
        abi: TOKENS.cbBTC.abi,
        functionName: 'approve',
        args: [LUMA_VAULT, amountWei],
      });

      toast.success('Approval successful! Depositing...');

      // Then deposit into vault
      await deposit(amount);
      toast.success('Deposit successful!');
    } catch (error) {
      console.error('Deposit failed:', error);
      toast.error('Deposit failed');
    }
  };

  React.useEffect(() => {
    if (isSuccess) {
      toast.success('Deposit confirmed!');
      onClose();
    }
  }, [isSuccess, onClose]);

  return (
    <Modal onClose={onClose}>
<h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">
        {t('supplyBTC')}
      </h2>
      
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex justify-between text-sm mb-1">
	    <span className="text-gray-600 dark:text-gray-400">{t('availableBalance')}</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {parseFloat(btcBalance).toFixed(8)} BTC
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('supplyBTCToEarn')}
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
            <span className="text-gray-600 dark:text-gray-400">{t('youWillReceive')}</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {amount || '0'} {t('vaultShares')}
            </span>
          </div>
        </div>

        <button
          onClick={handleSupply}
          disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(btcBalance) || isPending}
          className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
        >
          {isPending ? t('supplying') : t('confirm')}
        </button>
      </div>
    </Modal>
  );
}
