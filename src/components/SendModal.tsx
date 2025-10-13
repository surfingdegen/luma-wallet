import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { QrCode } from 'lucide-react';
import QRScanner from './QRScanner';

interface Contact {
  id: string;
  label: string;
  address: string;
}

interface SendModalProps {
  onClose: () => void;
  t: (key: string) => string;
  contacts: Contact[];
  initialAddress?: string;
}

export default function SendModal({ onClose, t, contacts, initialAddress = '' }: SendModalProps) {
  const [token, setToken] = useState<'USDC' | 'BTC'>('USDC');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState(initialAddress);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    if (initialAddress) {
      setRecipient(initialAddress);
    }
  }, [initialAddress]);

  const handleScanResult = (result: string) => {
    console.log('=== SEND MODAL: Raw scan result ===', result);
    
    try {
      const data = JSON.parse(result);
      console.log('Parsed as JSON:', data);
      
      if (data.to) {
        console.log('Found "to" field:', data.to);
        setRecipient(data.to);
        setShowScanner(false);
        return;
      }
      if (data.address) {
        console.log('Found "address" field:', data.address);
        setRecipient(data.address);
        setShowScanner(false);
        return;
      }
    } catch (e) {
      console.log('Not JSON, parsing as string');
    }
    
    let addr = result.trim();
    console.log('Processing string:', addr);
    
    if (addr.toLowerCase().startsWith('ethereum:')) {
      addr = addr.substring(9);
      console.log('Removed ethereum: prefix:', addr);
    }
    
    if (addr.includes('/')) {
      addr = addr.split('/').pop() || addr;
      console.log('Removed chain prefix:', addr);
    }
    
    if (addr.includes('?')) {
      addr = addr.split('?')[0];
      console.log('Removed query params:', addr);
    }
    
    if (addr.includes('@')) {
      addr = addr.split('@')[0];
      console.log('Removed @ symbol:', addr);
    }
    
    console.log('Final processed address:', addr);
    
    if (!addr.startsWith('0x') || addr.length !== 42) {
      console.error('Invalid address format');
      alert('Invalid Ethereum address. Must start with 0x and be 42 characters.');
      setShowScanner(false);
      return;
    }
    
    console.log('✓ Valid address, setting recipient');
    setRecipient(addr);
    setShowScanner(false);
  };

  if (showScanner) {
    return <QRScanner onClose={() => setShowScanner(false)} onScan={handleScanResult} t={t} />;
  }

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
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('to')}
            </label>
            <button
              onClick={() => {
                console.log('Opening scanner from Send modal');
                setShowScanner(true);
              }}
              className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 text-sm font-medium hover:text-blue-700 dark:hover:text-blue-300"
            >
              <QrCode className="w-4 h-4" />
              <span>Scan QR</span>
            </button>
          </div>
          
          {contacts && contacts.length > 0 ? (
            <>
              <select
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white mb-2"
              >
                <option value="">Select contact</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.address}>
                    {c.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Or enter address: 0x..."
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              />
            </>
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

        <button 
          disabled={!recipient || !amount}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
        >
          {t('confirm')}
        </button>
      </div>
    </Modal>
  );
}
