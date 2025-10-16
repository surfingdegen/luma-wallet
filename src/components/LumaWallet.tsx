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
  ArrowLeftRight,
  Plus,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { useSmartWallet } from '../hooks/useWallet';
import { useAccount } from 'wagmi';
import { useTokenBalances } from '../hooks/useBalances';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { translations } from '../lib/translations';
import SendModal from './SendModal';
import ReceiveModal from './ReceiveModal';
import SwapModal from './SwapModal';
import QRScanner from './QRScanner';
import ContactCard from './ContactCard';
import AddContactModal from './AddContactModal';
import SupplyModal from './SupplyModal';
import BorrowModal from './BorrowModal';
import SupplyUSDCModal from './SupplyUSDCModal';
import USDCSavings from './USDCSavings';
import { useMoonwellAccountData, useMoonwellSupplyAPY } from '../hooks/useMoonwell';
import { useVaultBalance } from '../hooks/useVault';
import { useUSDCVaultBalance } from '../hooks/useUSDCVault';
import { useMoonwellUSDCSupplyAPY } from '../hooks/useMoonwell';
import USDCSupplyModal from './USDCSupplyModal';


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

  const t = (key: string) => translations[language]?.[key] || key;

  const [showSend, setShowSend] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [showSwap, setShowSwap] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showSupply, setShowSupply] = useState(false);
  const [showBorrow, setShowBorrow] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);
  const [showSupplyUSDC, setShowSupplyUSDC] = useState(false);

  const { isConnected, address, isConnecting } = useSmartWallet();
  const { usdcBalance, btcBalance, isLoading: balancesLoading, refetch } = useTokenBalances(address);
  const { supplied, borrowed, healthFactor, availableToBorrow } = useMoonwellAccountData(address);
  const moonwellAPY = useMoonwellSupplyAPY();
  const vaultBalance = useVaultBalance(address);
  const usdcVaultBalance = useUSDCVaultBalance(address);
  const usdcAPY = useMoonwellUSDCSupplyAPY();


  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handleAddContact = (label: string, address: string) => {
    const newContact: Contact = {
      id: Date.now().toString(),
      label,
      address,
    };
    setContacts([...contacts, newContact]);
  };

  const handleDeleteContact = (id: string) => {
    setContacts(contacts.filter(c => c.id !== id));
  };

  const languages = [
    { code: 'en', flag: '🇺🇸', name: 'English' },
    { code: 'es', flag: '🇪🇸', name: 'Español' },
    { code: 'fr', flag: '🇫🇷', name: 'Français' },
    { code: 'de', flag: '🇩🇪', name: 'Deutsch' },
    { code: 'zh', flag: '🇨🇳', name: '中文' },
    { code: 'ja', flag: '🇯🇵', name: '日本語' },
    { code: 'ar', flag: '🇸🇦', name: 'العربية' },
    { code: 'pt', flag: '🇧🇷', name: 'Português' },
  ];

  if (isConnecting) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('connecting')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Luma</h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="relative">
                <button
                  onClick={() => setShowLanguages(!showLanguages)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                
                {showLanguages && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setShowLanguages(false);
                        }}
                        className={`w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2 ${
                          language === lang.code ? 'bg-blue-50 dark:bg-blue-900' : ''
                        }`}
                      >
                        <span>{lang.flag}</span>
                        <span className="text-gray-700 dark:text-gray-300">{lang.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <button
                onClick={() => setIsDark(!isDark)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {isDark ? (
                  <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

{/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex space-x-2 sm:space-x-8 min-w-min">
            <TabButton
              active={activeTab === 'checking'}
              onClick={() => setActiveTab('checking')}
              icon={Wallet}
              label={t('checking')}
            />
            <TabButton
              active={activeTab === 'savings'}
              onClick={() => setActiveTab('savings')}
              icon={TrendingUp}
              label={t('savings')}
            />
            <TabButton
              active={activeTab === 'contacts'}
              onClick={() => setActiveTab('contacts')}
              icon={User}
              label={t('contacts')}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Funds Tab (formerly Checking) */}
        {activeTab === 'checking' && (
          <div className="space-y-4">
            {/* USDC Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 h-32 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">USDC</span>
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">$</span>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {balancesLoading ? '...' : usdcBalance}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('balance')}</p>
            </div>

            {/* USDC Savings Card */}
		<USDCSavings
                balance={usdcVaultBalance.balance.toFixed(2)}
                apy={usdcAPY}
                onSupply={() => setShowSupplyUSDC(true)}
                 t={t}
              />

            {/* BTC Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 h-32 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">BTC</span>
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 dark:text-orange-400 font-bold">₿</span>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {balancesLoading ? '...' : btcBalance}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('balance')}</p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <ActionButton
                icon={Send}
                label={t('send')}
                onClick={() => setShowSend(true)}
              />
              <ActionButton
                icon={Download}
                label={t('receive')}
                onClick={() => setShowReceive(true)}
              />
              <ActionButton
                icon={ArrowLeftRight}
                label={t('swap')}
                onClick={() => setShowSwap(true)}
                primary
              />
              <ActionButton
                icon={QrCode}
                label={t('scanQR')}
                onClick={() => setShowQRScanner(true)}
              />
            </div>
          </div>
        )}

        {/* Loans Tab (formerly Savings) */}
        {activeTab === 'savings' && (
          <div className="space-y-6">
            {/* Supplied BTC */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t('supplied')}</span>
                </div>
                <button
                  onClick={() => setShowSupply(true)}
                  className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline"
                >
                  + {t('supply')}
                </button>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {supplied} BTC
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ${typeof vaultBalance === 'number' ? vaultBalance.toFixed(2) : '0.00'}
              </p>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{t('adjustedAPY')}</span>
                  <span className="text-green-600 dark:text-green-400 font-semibold">
                    {moonwellAPY.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Borrowed USDC */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t('borrowed')}</span>
                </div>
                <button
                  onClick={() => setShowBorrow(true)}
                  className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline"
                >
                  + {t('borrow')}
                </button>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {borrowed.toFixed(2)} USDC
              </p>
              <div className="mt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{t('healthFactor')}</span>
                  <span className={`font-semibold ${
                    healthFactor >= 2 ? 'text-green-600' : 
                    healthFactor >= 1.5 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {healthFactor.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{t('availableToBorrow')}</span>
                  <span className="text-gray-900 dark:text-white font-semibold">
                    ${availableToBorrow.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

{/* How it works */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t('howItWorks')}</h3>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>• {t('supplyBTCInfo')}</li>
                <li>• {t('borrowUSDCInfo')}</li>
                <li>• {t('healthFactorInfo')}</li>
                <li>• {t('wellRewardsInfo')}</li>
              </ul>
            </div>
          </div>
        )}

        {/* Contacts Tab */}
        {activeTab === 'contacts' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
	  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('contacts')}</h2>
              <button
                onClick={() => setShowAddContact(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                + {t('addContact')}
              </button>
            </div>

            {contacts.length === 0 ? (
              <div className="text-center py-12">
		<User className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-2">{t('noContacts')}</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  {t('addContactsDesc')}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {contacts.map((contact) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    onDelete={handleDeleteContact}
                    onSend={(address) => {
                      setShowSend(true);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      {showSend && <SendModal onClose={() => setShowSend(false)} t={t} contacts={contacts} usdcBalance={usdcBalance} btcBalance={btcBalance} />}
      {showReceive && <ReceiveModal onClose={() => setShowReceive(false)} address={address} t={t} />}
      {showSwap && <SwapModal onClose={() => setShowSwap(false)} address={address} t={t} usdcBalance={usdcBalance} btcBalance={btcBalance} />}
      {showQRScanner && <QRScanner onClose={() => setShowQRScanner(false)} onScan={(address) => {
        setShowQRScanner(false);
        setShowSend(true);
      }} t={t} />}
      {showAddContact && <AddContactModal onClose={() => setShowAddContact(false)} onAdd={handleAddContact} t={t} />}
      {showSupply && <SupplyModal onClose={() => setShowSupply(false)} t={t} btcBalance={btcBalance} />}
      {showBorrow && <BorrowModal onClose={() => setShowBorrow(false)} t={t} maxBorrow={availableToBorrow} />}
      {showSupplyUSDC && <SupplyUSDCModal onClose={() => setShowSupplyUSDC(false)} t={t} usdcBalance={usdcBalance} />}
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-4 border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
        active
          ? 'border-blue-600 text-blue-600 dark:text-blue-400'
          : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
      }`}
    >
      <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
      <span className="font-medium text-sm sm:text-base">{label}</span>
    </button>
  );
}

function ActionButton({ icon: Icon, label, onClick, primary = false }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-4 rounded-xl transition-colors ${
        primary
          ? 'bg-blue-600 text-white hover:bg-blue-700'
          : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
      }`}
    >
      <Icon className="w-6 h-6 mb-2" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
