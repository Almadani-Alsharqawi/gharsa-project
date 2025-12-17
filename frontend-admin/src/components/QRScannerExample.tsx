import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import QRScanner from './QRScanner';
import { QrCode, CheckCircle, AlertCircle, Info, Camera, Settings } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

/**
 * Example usage component demonstrating the modern QR Scanner implementation
 * This shows how to integrate the QRScanner component with proper error handling
 * and different configuration options.
 */
export const QRScannerExample: React.FC = () => {
  const [scannedResults, setScannedResults] = useState<string[]>([]);
  const [manualInput, setManualInput] = useState('');
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);

  // Handle successful QR code scan
  const handleQRResult = (result: string) => {
    const timestamp = new Date();
    setScannedResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
    setLastScanTime(timestamp);
    
    toast({
      title: "QR Code Scanned Successfully!",
      description: `Detected: ${result}`,
    });
  };

  // Handle QR scan errors
  const handleQRError = (error: string) => {
    toast({
      title: "QR Scan Error",
      description: error,
      variant: "destructive",
    });
  };

  // Handle manual input submission
  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      handleQRResult(manualInput.trim());
      setManualInput('');
    }
  };

  // Clear all results
  const clearResults = () => {
    setScannedResults([]);
    setLastScanTime(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-primary">QR Scanner Example</h1>
        <p className="text-muted-foreground">
          Modern QR code scanning with camera access, device selection, and error handling
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              QR Code Scanner
            </CardTitle>
            <CardDescription>
              Use your device camera to scan QR codes with modern web APIs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Basic Scanner */}
            <div className="space-y-2">
              <Label>Basic Scanner</Label>
              <QRScanner
                onResult={handleQRResult}
                onError={handleQRError}
                buttonText="Scan QR Code"
                className="w-full"
              />
            </div>

            <Separator />

            {/* Advanced Scanner with all features */}
            <div className="space-y-2">
              <Label>Advanced Scanner (All Features)</Label>
              <QRScanner
                onResult={handleQRResult}
                onError={handleQRError}
                buttonText="Advanced Scan"
                showCameraSelection={true}
                showTorchToggle={true}
                className="w-full"
              />
            </div>

            <Separator />

            {/* Manual Input Fallback */}
            <div className="space-y-2">
              <Label htmlFor="manual-input">Manual Input (Fallback)</Label>
              <div className="flex gap-2">
                <Input
                  id="manual-input"
                  placeholder="Enter QR code manually"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
                />
                <Button onClick={handleManualSubmit} disabled={!manualInput.trim()}>
                  Add
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Display */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                Scan Results
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={clearResults}
                disabled={scannedResults.length === 0}
              >
                Clear All
              </Button>
            </div>
            <CardDescription>
              {scannedResults.length > 0 
                ? `${scannedResults.length} QR codes scanned`
                : 'No QR codes scanned yet'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {scannedResults.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <QrCode className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Scan a QR code to see results here</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {scannedResults.map((result, index) => (
                  <div
                    key={`${result}-${index}`}
                    className="flex items-center gap-2 p-2 bg-muted/50 rounded-md"
                  >
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <code className="text-sm font-mono flex-1 break-all">{result}</code>
                    <Badge variant="secondary" className="text-xs">
                      #{index + 1}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feature Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Scanner Features
          </CardTitle>
          <CardDescription>
            Modern QR scanner implementation with comprehensive features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-primary">Browser APIs</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  MediaDevices.getUserMedia with proper constraints
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Camera device enumeration and selection
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Proper lifecycle management and cleanup
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  HTTPS requirement enforcement
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-primary">QR Detection</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  ZXing library for accurate QR detection
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  QR codes only (optimized performance)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Real-time continuous scanning
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Automatic scan stopping after detection
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-primary">Mobile Features</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Rear camera preference for QR scanning
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Torch/flashlight toggle support
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Orientation change handling
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Touch-friendly interface
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-primary">Error Handling</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Permission denied handling
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  No camera found detection
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Camera in use by another app
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  User-friendly error messages
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Production Deployment Notice */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Production Deployment:</strong> This QR scanner requires HTTPS in production. 
          Make sure to serve your application over a secure connection (https://) when deploying 
          to ensure camera access works properly. Localhost is allowed for development.
        </AlertDescription>
      </Alert>

      {/* Browser Compatibility */}
      <Card>
        <CardHeader>
          <CardTitle>Browser Compatibility</CardTitle>
          <CardDescription>
            Tested and working on modern browsers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
                <span className="text-blue-600 font-bold">Chrome</span>
              </div>
              <p className="text-sm text-muted-foreground">✓ Full Support</p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto">
                <span className="text-orange-600 font-bold">Firefox</span>
              </div>
              <p className="text-sm text-muted-foreground">✓ Full Support</p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
                <span className="text-blue-600 font-bold">Safari</span>
              </div>
              <p className="text-sm text-muted-foreground">✓ iOS 11+</p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto">
                <span className="text-green-600 font-bold">Android</span>
              </div>
              <p className="text-sm text-muted-foreground">✓ Chrome/Firefox</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QRScannerExample;
