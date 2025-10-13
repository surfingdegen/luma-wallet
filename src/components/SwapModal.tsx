import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { ArrowDownUp, AlertCircle, Info } from 'lucide-react';
import { useSwap } from '../hooks/useSwap';
import { useTokenBalances } from '../hooks/useBalances';
import { Address } from 'viem';

interface SwapModalProps {
  address: Address | undefined;
  onClose: () => void;
  t: (key: string) => string;
}

export default function SwapModal({ address, onClose, t }: SwapModalProps) {
  const [tokenIn, setTokenIn] = useState<'USDC' | 'BTC'>('USDC');
  const [tokenOut, setTokenOut] = useState<'USDC' | 'BTC'>('BTC');
  const [amountIn, setAmountIn] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [showSlippage, setShowSlippage] = useState(false);

  const { balances } = useTokenBalances(address);
  const {
    quote,
    isLoadingQuote,
    fetchQuote,
    needsApproval,
    isApproving,
    approveToken,
    isSwapping,
    swap
  } = useSwap();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (amountIn && parseFloat(amountIn) > 0) {
        fetchQuote(tokenIn, tokenOut, amountIn, slippage);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [amountIn, tokenIn, tokenOut, slippage]);

  const handleFlipTokens = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setAmountIn('');
  };

  const handleMaxAmount = () => {
    setAmountIn(balances[tokenIn]);
  };

  const handleApprove = async () => {
    try {
      await approveToken(tokenIn, amountIn);
      alert('Approval successful!');
    } catch (error) {
      alert('Approval failed');
    }
  };

  const handleSwap = async () => {
    try {
      await swap(tokenIn, tokenOut, amountIn);
      alert('Swap successful!');
      onClose();
    } catch (error) {
      alert('Swap failed');
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('swap')}</h2>
          <button
            onClick={() => setShowSlippage(!showSlippage)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Info className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {showSlippage && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Slippage Tolerance
            </label>
            <div className="flex gap-2">
              {[0.1, 0.5, 1.0].map((value) => (
                <button
                  key={value}
                  onClick={() => setSlippage(value)}
                  className={`px-3 py-1 rounded text-sm ${
                    slippage === value
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {value}%
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">{t('from')}</span>
            <span className="text-gray-600 dark:text-gray-400">
              Balance: {parseFloat(balances[tokenIn]).toFixed(tokenIn === 'BTC' ? 8 : 2)}
            </span>
          </div>
          <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <input
                type="number"
                value={amountIn}
                onChange={(e) => setAmountIn(e.target.value)}
                placeholder="0.0"
                className="bg-transparent text-2xl font-semibold outline-none w-full text-gray-900 dark:text-white"
              />
              <button
                onClick={handleMaxAmount}
                className="text-blue-600 dark:text-blue-400 text-sm font-medium mr-2"
              >
                MAX
              </button>
              <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg font-medium text-gray-900 dark:text-white">
                {tokenIn}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleFlipTokens}
            className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
          >
            <ArrowDownUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="space-y-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">{t('to')} (estimated)</span>
          <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                {isLoadingQuote ? (
                  <span className="text-gray-400">Loading...</span>
                ) : quote ? (
                  parseFloat(quote.amountOutFormatted).toFixed(tokenOut === 'BTC' ? 8 : 2)
                ) : (
                  '0.0'
                )}
              </div>
              <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg font-medium text-gray-900 dark:text-white">
                {tokenOut}
              </div>
            </div>
          </div>
        </div>

        {quote && !isLoadingQuote && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Rate</span>
              <span className="font-medium">
                1 {tokenIn} = {quote.rate} {tokenOut}
              </span>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Price Impact</span>
              <span className={`font-medium ${
                quote.priceImpact > 5 ? 'text-red-600 dark:text-red-400' : ''
              }`}>
                {quote.priceImpact.toFixed(2)}%
              </span>
            </div>
          </div>
        )}

        {quote && quote.priceImpact > 5 && (
          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-300">
              High price impact! Consider reducing your swap amount.
            </p>
          </div>
        )}

        <div className="space-y-2">
          {needsApproval && (
            <button
              onClick={handleApprove}
              disabled={isApproving || !quote}
              className="w-full py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
            >
              {isApproving ? 'Approving...' : `Approve ${tokenIn}`}
            </button>
          )}
          
          <button
            onClick={handleSwap}
            disabled={isSwapping || !quote || needsApproval || isLoadingQuote}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
          >
            {isSwapping ? 'Swapping...' : t('swap')}
          </button>
        </div>

        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
          Powered by Aerodrome Finance
        </p>
      </div>
    </Modal>
  );
}
