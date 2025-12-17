import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { QrCode, CheckCircle, AlertTriangle } from 'lucide-react';

// Helper function to extract serial number from URL (same as in QRScanner)
const extractSerialNumber = (qrCodeText: string): string => {
  try {
    // Try to parse as URL using JavaScript URL constructor
    const url = new URL(qrCodeText);
    
    // Get the last segment of the pathname
    const pathSegments = url.pathname.split('/').filter(segment => segment.length > 0);
    const serialNumber = pathSegments[pathSegments.length - 1];
    
    // Check if hostname matches expected domain and log warning if not
    if (url.hostname !== 'rehla-trees-planting.com') {
      console.warn(`QR Code scanned from unexpected domain: ${url.hostname}. Expected: rehla-trees-planting.com`);
    }
    
    // Return the serial number (last path segment)
    return serialNumber || qrCodeText; // Fallback to original text if no path segments
    
  } catch (error) {
    // If it's not a valid URL, return the original text as-is
    console.log('QR Code is not a URL, returning as-is:', qrCodeText);
    return qrCodeText;
  }
};

/**
 * Test component to demonstrate URL parsing functionality
 * This shows how the QR scanner will parse different types of QR codes
 */
export const QRParserTest: React.FC = () => {
  const [testInput, setTestInput] = useState('');
  const [results, setResults] = useState<Array<{
    input: string;
    output: string;
    isUrl: boolean;
    isExpectedDomain: boolean;
  }>>([]);

  // Test cases for demonstration
  const testCases = [
    'https://rehla-trees-planting.com/00001',
    'https://rehla-trees-planting.com/tree/ABC123',
    'https://rehla-trees-planting.com/plant/XYZ789',
    'https://example.com/other123',
    'SOME-CODE',
    '12345',
    'not-a-url',
    'https://rehla-trees-planting.com/',
    'https://rehla-trees-planting.com/path/to/deep/level/456',
  ];

  const handleTestInput = () => {
    if (!testInput.trim()) return;

    const result = extractSerialNumber(testInput.trim());
    const isUrl = testInput.startsWith('http');
    const isExpectedDomain = testInput.includes('rehla-trees-planting.com');

    setResults(prev => [{
      input: testInput.trim(),
      output: result,
      isUrl,
      isExpectedDomain,
    }, ...prev.slice(0, 9)]); // Keep last 10 results

    setTestInput('');
  };

  const runTestCases = () => {
    const testResults = testCases.map(input => {
      const result = extractSerialNumber(input);
      const isUrl = input.startsWith('http');
      const isExpectedDomain = input.includes('rehla-trees-planting.com');
      
      return {
        input,
        output: result,
        isUrl,
        isExpectedDomain,
      };
    });

    setResults(testResults);
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-primary">QR Parser Test</h1>
        <p className="text-muted-foreground">
          Test the URL parsing logic that extracts serial numbers from QR codes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Test URL Parsing
            </CardTitle>
            <CardDescription>
              Enter a QR code string to test the parsing logic
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-input">QR Code String</Label>
              <div className="flex gap-2">
                <Input
                  id="test-input"
                  placeholder="Enter QR code string..."
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleTestInput()}
                />
                <Button onClick={handleTestInput} disabled={!testInput.trim()}>
                  Parse
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Quick Test Cases</Label>
              <Button onClick={runTestCases} variant="outline" className="w-full">
                Run All Test Cases
              </Button>
            </div>

            <div className="space-y-2">
              <Button onClick={clearResults} variant="outline" className="w-full" disabled={results.length === 0}>
                Clear Results
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Parsing Results</CardTitle>
              <Badge variant="secondary">{results.length} results</Badge>
            </div>
            <CardDescription>
              See how different QR code strings are parsed
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <QrCode className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No results yet. Test some QR code strings above.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {results.map((result, index) => (
                  <div
                    key={`${result.input}-${index}`}
                    className="p-3 bg-muted/50 rounded-lg space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Input:</span>
                      <code className="text-sm font-mono bg-background px-2 py-1 rounded">
                        {result.input}
                      </code>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Output:</span>
                      <code className="text-sm font-mono bg-primary/10 text-primary px-2 py-1 rounded font-semibold">
                        {result.output}
                      </code>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      {result.isUrl ? (
                        <Badge variant="outline" className="text-green-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Valid URL
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-blue-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Non-URL
                        </Badge>
                      )}
                      
                      {result.isUrl && !result.isExpectedDomain && (
                        <Badge variant="outline" className="text-orange-600">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Unexpected Domain
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Expected Behavior */}
      <Card>
        <CardHeader>
          <CardTitle>Expected Behavior</CardTitle>
          <CardDescription>
            How the QR scanner will parse different types of QR codes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-green-600">✅ Valid URLs (rehla-trees-planting.com)</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li><code>https://rehla-trees-planting.com/00001</code> → <strong>00001</strong></li>
                  <li><code>https://rehla-trees-planting.com/tree/ABC123</code> → <strong>ABC123</strong></li>
                  <li><code>https://rehla-trees-planting.com/plant/XYZ789</code> → <strong>XYZ789</strong></li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-orange-600">⚠️ Valid URLs (other domains)</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li><code>https://example.com/other123</code> → <strong>other123</strong></li>
                  <li><code>https://other-site.com/path/456</code> → <strong>456</strong></li>
                  <li className="text-xs text-orange-500">(Warning logged to console)</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-blue-600">ℹ️ Non-URL strings</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li><code>SOME-CODE</code> → <strong>SOME-CODE</strong></li>
                  <li><code>12345</code> → <strong>12345</strong></li>
                  <li><code>not-a-url</code> → <strong>not-a-url</strong></li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-red-600">❌ Edge cases</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li><code>https://rehla-trees-planting.com/</code> → <strong>original URL</strong></li>
                  <li><code>invalid-url</code> → <strong>invalid-url</strong></li>
                  <li><code>empty string</code> → <strong>empty string</strong></li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration Note */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Integration:</strong> This parsing logic is now integrated into the QRScanner component. 
          When you scan a QR code, it will automatically extract the serial number from URLs or return 
          the original text if it's not a URL. The component will log warnings to the console for 
          unexpected domains.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default QRParserTest;
