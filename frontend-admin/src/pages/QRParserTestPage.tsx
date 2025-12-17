import React from 'react';
import QRParserTest from '@/components/QRParserTest';

/**
 * Test page for QR Parser functionality
 * This page demonstrates the URL parsing logic that extracts serial numbers
 */
const QRParserTestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <QRParserTest />
    </div>
  );
};

export default QRParserTestPage;
