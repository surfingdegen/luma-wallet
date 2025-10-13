import React, { useState } from 'react';
import Modal from './Modal';
import { QrCode } from 'lucide-react';
import QRScanner from './QRScanner';

interface Contact {
  id: string;
  label: string;
  address: string;
}

interface AddContactModalProps {
  onClose: () => void;
  contacts: Contact[];
  setContacts: (contacts: Contact[]) => void;
  t: (key: string) => string;
}

export default function AddContactModal({ 
  onClose, 
  contacts, 
  setContacts, 
  t 
}: AddContactModalProps) {
  const [label, setLabel] = useState('');
  const [address, setAddress] = useState('');
  const [showScanner, setShowScanner] = useState(false);

const handleScanResult = (result: string) => {
    console.log('Raw QR scan result:', result);
    
    try {
      // Try parsing as JSON first
      const data = JSON.parse(result);
      console.log('Parsed as JSON:', data);
      
      if (data.to) {
        setAddress(data.to);
        setShowScanner(false);
        return;
      }
      if (data.address) {
        setAddress(data.address);
        setShowScanner(false);
        return;
      }
    } catch {
      // Not JSON, continue with string parsing
    }
    
    let addr = result.trim();
    console.log('Processing as string:', addr);
    
    // Handle Ethereum URI format: ethereum:0x...
    if (addr.toLowerCase().startsWith('ethereum:')) {
      addr = addr.substring(9);
    }
    
    // Handle ENS/Farcaster format
    if (addr.includes('.eth') || addr.includes('.farcaster')) {
      // Don't process ENS names directly, show error
      alert('ENS/Farcaster names are not supported. Please use a wallet address (0x...)');
      return;
    }
    
    // Remove chain prefix if present (e.g., eip155:1/...)
    if (addr.includes('/')) {
      addr = addr.split('/').pop() || addr;
    }
    
    // Remove query parameters
    if (addr.includes('?')) {
      addr = addr.split('?')[0];
    }
    
    // Remove @ symbols
    if (addr.includes('@')) {
      addr = addr.split('@')[0];
    }
    
    // Validate it's an Ethereum address
    if (!addr.startsWith('0x') || addr.length !== 42) {
      alert('Invalid Ethereum address. Address must start with 0x and be 42 characters long.');
      return;
    }
    
    console.log('Final address:', addr);
    setAddress(addr);
    setShowScanner(false);
  };

  const handleSave = () => {
    if (label && address) {
      const newContact: Contact = {
        id: Date.now().toString(),
        label,
        address
      };
      setContacts([...contacts, newContact]);
      onClose();
    }
  };

  if (showScanner) {
    return <QRScanner onClose={() => setShowScanner(false)} onScan={handleScanResult} t={t} />;
  }

  return (
    <Modal onClose={onClose}>
      <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">
        {t('addContact')}
      </h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('label')}
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Friend, Family..."
            className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('address')}
            </label>
            <button
              onClick={() => setShowScanner(true)}
              className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 text-sm font-medium hover:text-blue-700 dark:hover:text-blue-300"
            >
              <QrCode className="w-4 h-4" />
              <span>Scan QR</span>
            </button>
          </div>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="0x..."
            className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={!label || !address}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
          >
            {t('save')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
