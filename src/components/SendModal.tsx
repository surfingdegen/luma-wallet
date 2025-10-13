import React, { useState } from 'react';
import Modal from './Modal';

interface Contact {
  id: string;
  label: string;
  address: string;
}

interface SendModalProps {
  onClose: () => void;
  t: (key: string) => string;
  contacts: Contact[];
}

export default function SendModal({ onClose, t, contacts }: SendModalProps) {
  const [token, setToken] = useState<'USDC' | 'BTC'>('USDC');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');

  return (
    <Modal onClose={onClose}>
      <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">{t('send')}</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Token
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setToken('USDC')}
              className={`p-3 rounded-lg border-2 transition-all ${
                token === 'USDC'
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-gray-900 dark:text-white'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              USDC
            </button>
            <button
              onClick={() => setToken('BTC')}
              className={`p-3 rounded-lg border-2 transition-all ${
                token === 'BTC'
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-gray-900 dark:text-white'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              BTC
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('to')}
          </label>
          {contacts.length > 0 ? (
            <select
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Select contact or enter address</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.address}>
                  {c.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x..."
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          )}
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
              placeholder="0.00"
              className="w-full p-3 pr-16 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 dark:text-blue-400 text-sm font-medium hover:text-blue-700 dark:hover:text-blue-300">
              {t('max')}
            </button>
          </div>
        </div>

        <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
          {t('confirm')}
        </button>
      </div>
    </Modal>
  );
}
