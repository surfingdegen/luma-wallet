import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { QrCode } from 'lucide-react';
import QRScanner from './QRScanner';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { TOKENS } from '../lib/contracts';
import { parseUnits, Address } from 'viem';
import toast from 'react-hot-toast';

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
  usdcBalance: string;
  btcBalance: string;
}

export default function SendModal({ onClose, t, contacts, initialAddress = '', usdcBalance, btcBalance }: SendModalProps) {
  const [token, setToken] = useState<'USDC' | 'BTC'>('USDC');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState(initialAddress);
  const [showScanner, setShowScanner] = useState(false);
  
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const balance = token === 'USDC' ? usdcBalance : btcBalance;

  useEffect(() => {
    if (initialAddress) {
      setRecipient(initialAddress);
    }
  }, [initialAddress]);

  useEffect(() => {
    if (isSuccess) {
      toast.success('Transaction confirmed!');
      onClose();
    }
  }, [isSuccess, onClose]);

  const handleScanResult = (result: string) => {
    console.log('=== SEND MODAL: Raw scan result ===', result);
    
    // Try JSON format first (for backwards compatibility)
    try {
      const data = JSON.parse(result);
      console.log('Parsed as JSON:', data);
      
      if (data.to) {
        console.log('Found "to" field:', data.to);
        setRecipient(data.to);
        if (data.amount) setAmount(data.amount);
        setShowScanner(false);
        return;
      }
      if (data.address) {
        console.log('Found "address" field:', data.address);
        setRecipient(data.address);
        if (data.amount) setAmount(data.amount);
        setShowScanner(false);
        return;
      }
    } catch (e) {
      console.log('Not JSON, parsing as EIP-681 or plain address');
    }
    
    let addr = result.trim();
    let parsedAmount = '';
    console.log('Processing string:', addr);
    
    // Handle EIP-681 format: ethereum:0xaddress@8453?value=amount
    if (addr.toLowerCase().startsWith('ethereum:')) {
      addr = addr.substring(9);
      console.log('Removed ethereum: prefix:', addr);
    }
    
    // Extract amount from query parameters if present
    if (addr.includes('?')) {
      const [addressPart, queryPart] = addr.split('?');
      addr = addressPart;
      
      const params = new URLSearchParams(queryPart);
      if (params.has('value')) {
        parsedAmount = params.get('value') || '';
        console.log('Found amount in query params:', parsedAmount);
      }
    }
    
    // Remove chain ID if present
    if (addr.includes('@')) {
      addr = addr.split('@')[0];
      console.log('Removed chain ID:', addr);
    }
    
    // Remove any remaining path separators
    if (addr.includes('/')) {
      addr = addr.split('/').pop() || addr;
      console.log('Removed path:', addr);
    }
    
    console.log('Final processed address:', addr);
    console.log('Final amount:', parsedAmount);
    
    // Validate address format
    if (!addr.startsWith('0x') || addr.length !== 42) {
      console.error('Invalid address format');
      alert('Invalid Ethereum address. Must start with 0x and be 42 characters.');
      setShowScanner(false);
      return;
    }
    
    setRecipient(addr);
    if (parsedAmount) {
      setAmount(parsedAmount);
    }
    setShowScanner(false);
  };

  const handleSend = async () => {
    if (!recipient || !amount || parseFloat(amount) <= 0) {
      toast.error('Please enter valid recipient and amount');
      return;
    }

    try {
      const tokenConfig = token === 'BTC' ? TOKENS.cbBTC : TOKENS.USDC;
      const amountWei = parseUnits(amount, tokenConfig.decimals);

      await writeContract({
        address: tokenConfig.address,
        abi: tokenConfig.abi,
        functionName: 'transfer',
        args: [recipient as Address, amountWei],
      });

      toast.success('Transaction submitted!');
    } catch (error: any) {
      console.error('Send failed:', error);
      toast.error(error?.message || 'Transaction failed');
    }
  };

  return (
    <>
      {showScanner ? (
        <QRScanner onClose={() => setShowScanner(false)} onScan={handleScanResult} t={t} />
      ) : (
        <Modal onClose={onClose}>
          <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">{t('send')}</h2>
          
          <div className="space-y-4">
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

            {/* Recipient */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('to')}
                </label>
                <button
                  onClick={() => setShowScanner(true)}
                  className="text-blue-600 dark:text-blue-400 text-sm font-medium flex items-center space-x-1 hover:underline"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Scan QR</span>
                </button>
              </div>
              
              {/* Contact Selection */}
              {contacts.length > 0 && (
                <div className="mb-2">
                  <select
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white mb-2"
                  >
                    <option value="">Select a contact...</option>
                    {contacts.map((contact) => (
                      <option key={contact.id} value={contact.address}>
                        {contact.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x..."
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
              />
            </div>

            {/* Amount */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('amount')}
                </label>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Balance: {parseFloat(balance).toFixed(token === 'BTC' ? 8 : 2)} {token}
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  step={token === 'BTC' ? '0.00000001' : '0.01'}
                  className="w-full p-3 pr-16 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <button
                  onClick={() => setAmount(balance)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 dark:text-blue-400 text-sm font-medium hover:text-blue-700 dark:hover:text-blue-300"
                >
                  {t('max')}
                </button>
              </div>
            </div>

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={!recipient || !amount || parseFloat(amount) <= 0 || isPending || isConfirming}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              {isPending || isConfirming ? 'Sending...' : t('confirm')}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
