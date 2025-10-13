import React, { useState } from 'react';
import Modal from './Modal';

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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('address')}
          </label>
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
