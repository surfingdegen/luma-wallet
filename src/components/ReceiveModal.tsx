import React, { useState } from 'react';
import Modal from './Modal';
import { QRCodeSVG } from 'qrcode.react';

interface ReceiveModalProps {
  address: string | undefined;
  onClose: () => void;
  t: (key: string) => string;
}

export default function ReceiveModal({ address, onClose, t }: ReceiveModalProps) {
  const [token, setToken] = useState<'USDC' | 'BTC'>('USDC');
  const [amount, setAmount] = useState('');

  const qrData = JSON.stringify({
    to: address || '',
    amount,
    token
  });

  return (
    <Modal onClose={onClose}>
      <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">{t('receive')}</h2>
      
      <div className="space-y-4">
        <div className="flex justify-center p-6 bg-white dark:bg-gray-800 rounded-xl">
          <QRCodeSVG value={qrData} size={200} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Token
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setToken('USDC')}
              className={`p-3 rounded-lg border-2 transition-all ${
                token === 'USDC'
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              USDC
            </button>
            <button
              onClick={() => setToken('BTC')}
              className={`p-3 rounded-lg border-2 transition-all ${
                token === 'BTC'
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              BTC
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('amount')} (Optional)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>

        <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400 font-mono break-all">
            {address}
          </p>
        </div>
      </div>
    </Modal>
  );
}
