import React from 'react';
import { User, X } from 'lucide-react';

interface Contact {
  id: string;
  label: string;
  address: string;
}

interface ContactCardProps {
  contact: Contact;
  onDelete: (id: string) => void;
}

export default function ContactCard({ contact, onDelete }: ContactCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white">
            {contact.label}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
            {contact.address.slice(0, 6)}...{contact.address.slice(-4)}
          </p>
        </div>
      </div>
      <button
        onClick={() => onDelete(contact.id)}
        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
      >
        <X className="w-4 h-4 text-red-600 dark:text-red-400" />
      </button>
    </div>
  );
}
