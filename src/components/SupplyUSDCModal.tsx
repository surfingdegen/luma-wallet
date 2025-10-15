import React, { useState } from 'react';
import Modal from './Modal';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { TOKENS, MOONWELL_MARKETS } from '../lib/contracts';
import { parseUnits } from 'viem';
import { MOONWELL_MARKET_ABI, MOONWELL_COMPTROLLER_ABI } from '../lib/moonwellAbi';
import toast from 'react-hot-toast';

const MOONWELL_COMPTROLLER = '0xfBb21d0380beE3312B33c4353c8936a0F13EF26C';

interface SupplyUSDCModalProps {
  onClose: () => void;
  t: (key: string) => string;
  usdcBalance: string;
}

export default function SupplyUSDCModal({ onClose, t, usdcBalance }: SupplyUSDCModalProps) {
  const [amount, setAmount] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const { address } = useAccount();
  const { writeContract, data: hash } = useWriteContract();

  const handleSupply = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      setIsApproving(true);
      
      // Step 1: Approve Moonwell USDC market to spend USDC
      const amountWei = parseUnits(amount, TOKENS.USDC.decimals);
      
      const approveHash = await writeContract({
        address: TOKENS.USDC.address,
        abi: TOKENS.USDC.abi,
        functionName: 'approve',
        args: [MOONWELL_MARKETS.USDC, amountWei],
      });

      toast.success('Approval submitted! Waiting for confirmation...');
      
      // Wait a bit for approval to complete
      await new Promise(resolve => setTimeout(resolve, 3000));

      setIsApproving(false);

      // Step 2: Enter market (enable USDC as collateral)
      try {
        await writeContract({
          address: MOONWELL_COMPTROLLER,
          abi: MOONWELL_COMPTROLLER_ABI,
          functionName: 'enterMarkets',
          args: [[MOONWELL_MARKETS.USDC]],
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.log('Already in market or error:', e);
      }

      // Step 3: Supply USDC to Moonwell
      await writeContract({
        address: MOONWELL_MARKETS.USDC,
        abi: MOONWELL_MARKET_ABI,
        functionName: 'mint',
        args: [amountWei],
      });

      toast.success('Supply transaction submitted!');
      onClose();
      
    } catch (error: any) {
      console.error('Supply failed:', error);
      toast.error(error?.message || 'Supply failed');
      setIsApproving(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">
        Supply USDC
      </h2>
      
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">Available Balance</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {parseFloat(usdcBalance).toFixed(2)} USDC
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Supply USDC to Moonwell to earn 3.50% APY
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Amount
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              max={usdcBalance}
              className="w-full p-3 pr-16 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <button
              onClick={() => setAmount(usdcBalance)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 dark:text-blue-400 text-sm font-medium hover:text-blue-700 dark:hover:text-blue-300"
            >
              MAX
            </button>
          </div>
        </div>

        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">You will receive</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {amount || '0'} mUSDC
            </span>
          </div>
        </div>

        <button
          onClick={handleSupply}
          disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(usdcBalance) || isApproving}
          className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
        >
          {isApproving ? 'Approving...' : 'Supply to Moonwell'}
        </button>
      </div>
    </Modal>
  );
}
