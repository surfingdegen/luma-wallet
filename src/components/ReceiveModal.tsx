import React, { useState } from 'react';
import Modal from './Modal';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check } from 'lucide-react';

interface ReceiveModalProps {
  address: string | undefined;
  onClose: () => void;
  t: (key: string) => string;
}

export default function ReceiveModal({ address, onClose, t }: ReceiveModalProps) {
  const [token, setToken] = useState<'USDC' | 'BTC'>('USDC');
  const [amount, setAmount] = useState('');
  const [copied, setCopied] = useState(false);

  // Generate EIP-681 compliant payment request
  // Format: ethereum:0xaddress@8453?value=amount
  const generateQRData = () => {
    if (!address) return '';
    
    // For just receiving (no amount), show plain address
    if (!amount) {
      return address;
    }
    
    // With amount, use EIP-681 format for Base network (chainId: 8453)
    return `ethereum:${address}@8453?value=${amount}`;
  };

  const qrData = generateQRData();

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Modal onClose={onClose}>
      <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">{t('receive')}</h2>
      
      <div className="space-y-4">
        {/* QR Code */}
        <div className="flex justify-center p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
          <QRCodeSVG 
            value={qrData} 
            size={200}
            level="M"
            includeMargin={true}
          />
        </div>

        {/* Token Selection */}
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

        {/* Amount (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('amount')} (Optional)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            step="0.01"
            className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>

        {/* Address Display with Copy Button */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Your Address
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={address || ''}
              readOnly
              className="flex-1 p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-mono"
            />
            <button
              onClick={handleCopyAddress}
              className="p-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
          Scan this QR code to receive {token} on Base network
        </p>
      </div>
    </Modal>
  );
}
