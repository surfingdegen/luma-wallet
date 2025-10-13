import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Send, 
  Download, 
  QrCode, 
  User, 
  Sun, 
  Moon, 
  Globe, 
  TrendingUp,
  RefreshCw,
  ArrowLeftRight
} from 'lucide-react';
import { useSmartWallet } from '../hooks/useWallet';
import { useTokenBalances } from '../hooks/useBalances';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { translations } from '../lib/translations';
import SendModal from './SendModal';
import ReceiveModal from './ReceiveModal';
import SwapModal from './SwapModal';
import { Plus } from 'lucide-react';
import ContactCard from './ContactCard';
import AddContactModal from './AddContactModal';

interface Contact {
  id: string;
  label: string;
  address: string;
}

export default function LumaWallet() {
  const [isDark, setIsDark] = useLocalStorage('luma-theme', false);
  const [language, setLanguage] = useLocalStorage('luma-lang', 'en');
  const [activeTab, setActiveTab] = useState<'checking' | 'savings' | 'contacts'>('checking');
  const [contacts, setContacts] = useLocalStorage<Contact[]>('luma-contacts', []);

  const t = (key: string) => translations[language]?.[key] || translations.en[key] || key;

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const { isConnected, address, isConnecting } = useSmartWallet();

  if (isConnecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <p className="text-lg text-gray-700 dark:text-gray-300">{t('connecting')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Luma</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <LanguageSelector language={language} setLanguage={setLanguage} />
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            <TabButton
              active={activeTab === 'checking'}
              onClick={() => setActiveTab('checking')}
              icon={<Wallet className="w-5 h-5" />}
              label={t('checking')}
            />
            <TabButton
              active={activeTab === 'savings'}
              onClick={() => setActiveTab('savings')}
              icon={<TrendingUp className="w-5 h-5" />}
              label={t('savings')}
            />
            <TabButton
              active={activeTab === 'contacts'}
              onClick={() => setActiveTab('contacts')}
              icon={<User className="w-5 h-5" />}
              label={t('contacts')}
            />
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'checking' && <CheckingTab address={address} t={t} />}
        {activeTab === 'savings' && <SavingsTab t={t} />}
        {activeTab === 'contacts' && (
          <ContactsTab contacts={contacts} setContacts={setContacts} t={t} />
        )}
      </main>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
        active
          ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}

function LanguageSelector({ language, setLanguage }: any) {
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' }
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <Globe className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg ${
                language === lang.code ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CheckingTab({ address, t, contacts }: any) {
  const { balances, isLoading } = useTokenBalances(address);
  const [showSend, setShowSend] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [showSwap, setShowSwap] = useState(false);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BalanceCard token="USDC" balance={balances.USDC} isLoading={isLoading} t={t} />
        <BalanceCard token="BTC" balance={balances.cbBTC} isLoading={isLoading} t={t} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ActionButton 
          icon={<Send />} 
          label={t('send')} 
          onClick={() => setShowSend(true)}
        />
        <ActionButton 
          icon={<Download />} 
          label={t('receive')} 
          onClick={() => setShowReceive(true)}
        />
        <ActionButton 
          icon={<ArrowLeftRight />} 
          label={t('swap')} 
          onClick={() => setShowSwap(true)}
          highlight 
        />
        <ActionButton 
          icon={<QrCode />} 
          label={t('scanQR')} 
        />
      </div>

      {/* Modals */}
      {showSend && <SendModal onClose={() => setShowSend(false)} t={t} contacts={contacts} />}
      {showReceive && <ReceiveModal address={address} onClose={() => setShowReceive(false)} t={t} />}
      {showSwap && <SwapModal address={address} onClose={() => setShowSwap(false)} t={t} />}
    </div>
  );
}

function BalanceCard({ token, balance, isLoading, t }: any) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{token}</span>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          token === 'BTC' 
            ? 'bg-orange-100 dark:bg-orange-900/20' 
            : 'bg-blue-100 dark:bg-blue-900/20'
        }`}>
          <span className={`font-semibold text-sm ${
            token === 'BTC'
              ? 'text-orange-600 dark:text-orange-400'
              : 'text-blue-600 dark:text-blue-400'
          }`}>
            {token === 'BTC' ? '₿' : '$'}
          </span>
        </div>
      </div>
      {isLoading ? (
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      ) : (
        <>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {parseFloat(balance).toFixed(token === 'BTC' ? 8 : 2)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('balance')}</div>
        </>
      )}
    </div>
  );
}

function ActionButton({ icon, label, highlight = false, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-4 rounded-xl shadow-sm border transition-all ${
        highlight
          ? 'bg-gradient-to-br from-blue-500 to-indigo-600 border-blue-600 text-white hover:shadow-lg'
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md'
      }`}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
        highlight ? 'bg-white/20' : 'bg-blue-50 dark:bg-blue-900/20'
      }`}>
        {React.cloneElement(icon, { 
          className: `w-5 h-5 ${highlight ? 'text-white' : 'text-blue-600 dark:text-blue-400'}` 
        })}
      </div>
      <span className={`text-sm font-medium ${
        highlight ? 'text-white' : 'text-gray-700 dark:text-gray-300'
      }`}>
        {label}
      </span>
    </button>
  );
}

function SavingsTab({ t }: any) {
  return (
    <div className="text-center py-12">
      <TrendingUp className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
      <p className="text-gray-500 dark:text-gray-400">{t('savings')} - Coming soon</p>
    </div>
  );
}

function ContactsTab({ contacts, setContacts, t }: any) {
  const [showAdd, setShowAdd] = useState(false);

  const handleDelete = (id: string) => {
    setContacts(contacts.filter((c: Contact) => c.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('contacts')}
        </h2>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>{t('addContact')}</span>
        </button>
      </div>

      {contacts.length === 0 ? (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">{t('noContacts')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contacts.map((contact: Contact) => (
            <ContactCard 
              key={contact.id} 
              contact={contact} 
              onDelete={handleDelete} 
            />
          ))}
        </div>
      )}

      {showAdd && (
        <AddContactModal
          onClose={() => setShowAdd(false)}
          contacts={contacts}
          setContacts={setContacts}
          t={t}
        />
      )}
    </div>
  );
}
