import React from 'react';
import QRScannerExample from '@/components/QRScannerExample';

/**
 * Test page for QR Scanner functionality
 * This page demonstrates the modern QR scanner implementation
 * with all features and proper error handling.
 */
const QRTestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <QRScannerExample />
    </div>
  );
};

export default QRTestPage;
