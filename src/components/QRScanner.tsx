import React, { useEffect, useRef, useState } from 'react';
import Modal from './Modal';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, AlertCircle, Loader2 } from 'lucide-react';

interface QRScannerProps {
  onClose: () => void;
  onScan: (result: string) => void;
  t: (key: string) => string;
}

export default function QRScanner({ onClose, onScan, t }: QRScannerProps) {
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hasStarted = useRef(false);
  const qrCodeRegionId = 'unified-qr-scanner';

  useEffect(() => {
    console.log('QR Scanner mounted');
    if (!hasStarted.current) {
      hasStarted.current = true;
      startScanner();
    }

    return () => {
      console.log('QR Scanner unmounting');
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    console.log('Starting unified QR scanner...');
    try {
      const scanner = new Html5Qrcode(qrCodeRegionId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false
      });
      
      scannerRef.current = scanner;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      await scanner.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          console.log('✓ QR Code scanned:', decodedText);
          onScan(decodedText);
          stopScanner();
        },
        (errorMessage) => {
          // Normal scanning errors, ignore
        }
      );
      
      console.log('✓ Scanner started successfully');
      setIsScanning(true);
      setIsLoading(false);
    } catch (err: any) {
      console.error('Scanner start error:', err);
      setIsLoading(false);
      setError('Unable to access camera. Please check permissions.');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  return (
    <Modal onClose={onClose}>
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
        {t('scanQR')}
      </h2>

      {error ? (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-4">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-800 dark:text-red-300 mb-2">{error}</p>
            <p className="text-xs text-red-700 dark:text-red-400">
              Make sure to allow camera access when prompted.
            </p>
          </div>
        </div>
      ) : (
        <>
          {isLoading && (
            <div className="flex items-center justify-center py-12 mb-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
              <span className="ml-3 text-gray-600 dark:text-gray-400">Starting camera...</span>
            </div>
          )}
          
          <div 
            id={qrCodeRegionId}
            className="w-full mb-4"
          />
          
          {isScanning && (
            <div className="flex flex-col items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Camera className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-center">Point your camera at a QR code</span>
            </div>
          )}
        </>
      )}

      <button
        onClick={onClose}
        className="w-full py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors hover:bg-gray-300 dark:hover:bg-gray-600"
      >
        {t('cancel')}
      </button>
    </Modal>
  );
}
