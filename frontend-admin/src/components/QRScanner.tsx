import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BrowserMultiFormatReader, BarcodeFormat } from '@zxing/browser';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, X, Flashlight, FlashlightOff, RotateCcw, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Types for better type safety
interface QRScannerProps {
  onResult: (result: string) => void;
  onError?: (error: string) => void;
  className?: string;
  buttonText?: string;
  showCameraSelection?: boolean;
  showTorchToggle?: boolean;
}

// Helper function to extract serial number from URL
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

interface CameraDevice {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
  isBackCamera?: boolean;
}

interface ScanState {
  isScanning: boolean;
  isInitializing: boolean;
  error: string | null;
  hasPermission: boolean;
  isTorchOn: boolean;
}

// Main QR Scanner Component
export const QRScanner: React.FC<QRScannerProps> = ({
  onResult,
  onError,
  className = '',
  buttonText = 'مسح رمز QR',
  showCameraSelection = true,
  showTorchToggle = true,
}) => {
  // State management
  const [isOpen, setIsOpen] = useState(false);
  const [scanState, setScanState] = useState<ScanState>({
    isScanning: false,
    isInitializing: false,
    error: null,
    hasPermission: false,
    isTorchOn: false,
  });
  const [availableCameras, setAvailableCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');

  // Refs for video element and ZXing reader
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const isScanningRef = useRef(false);

  // Initialize ZXing reader with QR code only configuration
  const initializeReader = useCallback(() => {
    if (readerRef.current) {
      // Clean up existing reader
      readerRef.current = null;
    }

    const reader = new BrowserMultiFormatReader();
    
    // Configure ZXing to only detect QR codes for better performance
    // Note: ZXing browser version handles QR detection automatically
    readerRef.current = reader;
  }, []);

  // Check if HTTPS is required (camera access requires secure context)
  const checkSecureContext = useCallback(() => {
    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      const error = 'Camera access requires HTTPS. Please use a secure connection.';
      setScanState(prev => ({ ...prev, error }));
      onError?.(error);
      return false;
    }
    return true;
  }, [onError]);

  // Enumerate available cameras
  const enumerateCameras = useCallback(async () => {
    try {
      // Request permission first to get device labels
      await navigator.mediaDevices.getUserMedia({ video: true });
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.slice(0, 8)}`,
          kind: device.kind,
          isBackCamera: device.label.toLowerCase().includes('back') || 
                       device.label.toLowerCase().includes('rear') ||
                       device.label.toLowerCase().includes('environment'),
        }))
        .sort((a, b) => {
          // Prioritize back cameras for QR scanning
          if (a.isBackCamera && !b.isBackCamera) return -1;
          if (!a.isBackCamera && b.isBackCamera) return 1;
          return 0;
        });

      setAvailableCameras(videoDevices);
      
      // Auto-select back camera if available, otherwise first camera
      const backCamera = videoDevices.find(camera => camera.isBackCamera);
      if (backCamera) {
        setSelectedCameraId(backCamera.deviceId);
      } else if (videoDevices.length > 0) {
        setSelectedCameraId(videoDevices[0].deviceId);
      }

      return videoDevices;
    } catch (error) {
      console.error('Error enumerating cameras:', error);
      setScanState(prev => ({ 
        ...prev, 
        error: 'Unable to access camera devices. Please check permissions.' 
      }));
      return [];
    }
  }, []);

  // Start camera stream with proper constraints
  const startCamera = useCallback(async (deviceId?: string) => {
    if (!checkSecureContext()) return;

    setScanState(prev => ({ ...prev, isInitializing: true, error: null }));

    try {
      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Camera constraints with modern best practices
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          facingMode: deviceId ? undefined : 'environment', // Prefer rear camera
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, max: 60 },
        },
        audio: false, // No audio needed for QR scanning
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Bind stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(console.error);
      }

      setScanState(prev => ({ 
        ...prev, 
        isInitializing: false, 
        isScanning: true, 
        hasPermission: true,
        error: null 
      }));

      // Start QR code detection
      startQRDetection();

    } catch (error: any) {
      console.error('Camera access error:', error);
      
      let errorMessage = 'Unable to access camera. ';
      
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Camera permission denied. Please allow camera access and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera found. Please connect a camera and try again.';
      } else if (error.name === 'NotReadableError') {
        errorMessage += 'Camera is already in use by another application.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage += 'Camera constraints cannot be satisfied.';
      } else {
        errorMessage += 'Please check your camera and try again.';
      }

      setScanState(prev => ({ 
        ...prev, 
        isInitializing: false, 
        error: errorMessage,
        hasPermission: false 
      }));
      
      onError?.(errorMessage);
    }
  }, [checkSecureContext, onError]);

  // Start QR code detection using ZXing
  const startQRDetection = useCallback(async () => {
    if (!readerRef.current || !videoRef.current || isScanningRef.current) return;

    isScanningRef.current = true;

    try {
      // Continuously decode frames
      const result = await readerRef.current.decodeFromVideoDevice(
        selectedCameraId || undefined,
        videoRef.current,
        (result, error) => {
          if (result && isScanningRef.current) {
            const rawText = result.getText();
            console.log('QR Code detected (raw):', rawText);
            
            // Extract serial number from URL or return as-is
            const serialNumber = extractSerialNumber(rawText);
            console.log('Extracted serial number:', serialNumber);
            
            // Stop scanning to prevent multiple detections
            isScanningRef.current = false;
            setScanState(prev => ({ ...prev, isScanning: false }));
            
            // Call the result handler with the extracted serial number
            onResult(serialNumber);
            
            // Close dialog and show success
            setIsOpen(false);
            toast({
              title: "تم مسح رمز QR بنجاح",
              description: `الرقم التسلسلي: ${serialNumber}`,
            });
          }
          
          if (error && error.name !== 'NotFoundException') {
            console.warn('QR detection error:', error);
          }
        }
      );
    } catch (error) {
      console.error('QR detection failed:', error);
      if (isScanningRef.current) {
        setScanState(prev => ({ 
          ...prev, 
          error: 'Failed to start QR code detection' 
        }));
      }
    }
  }, [selectedCameraId, onResult]);

  // Stop camera and cleanup
  const stopCamera = useCallback(() => {
    isScanningRef.current = false;
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }

    if (readerRef.current) {
      // Clean up existing reader
      readerRef.current = null;
    }

    setScanState(prev => ({ 
      ...prev, 
      isScanning: false, 
      isInitializing: false,
      isTorchOn: false 
    }));
  }, []);

  // Toggle torch/flashlight (if supported)
  const toggleTorch = useCallback(async () => {
    if (!streamRef.current) return;

    try {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack && 'getCapabilities' in videoTrack) {
        const capabilities = videoTrack.getCapabilities() as any;
        if (capabilities.torch) {
          await videoTrack.applyConstraints({
            advanced: [{ torch: !scanState.isTorchOn }] as any
          });
          setScanState(prev => ({ ...prev, isTorchOn: !prev.isTorchOn }));
        } else {
          throw new Error('Torch not supported');
        }
      } else {
        throw new Error('Video track not available');
      }
    } catch (error) {
      console.warn('Torch toggle failed:', error);
      toast({
        title: "المصباح غير متاح",
        description: "التحكم في المصباح غير مدعوم على هذا الجهاز.",
        variant: "destructive",
      });
    }
  }, [scanState.isTorchOn]);

  // Handle camera selection change
  const handleCameraChange = useCallback((deviceId: string) => {
    setSelectedCameraId(deviceId);
    if (scanState.isScanning) {
      stopCamera();
      setTimeout(() => startCamera(deviceId), 100);
    }
  }, [scanState.isScanning, stopCamera, startCamera]);

  // Initialize component
  useEffect(() => {
    initializeReader();
    
    if (isOpen) {
      enumerateCameras();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, initializeReader, enumerateCameras, stopCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Handle dialog close
  const handleDialogClose = useCallback((open: boolean) => {
    if (!open) {
      stopCamera();
    }
    setIsOpen(open);
  }, [stopCamera]);

  // Start scanning when dialog opens
  const handleStartScan = useCallback(() => {
    if (selectedCameraId) {
      startCamera(selectedCameraId);
    } else if (availableCameras.length > 0) {
      startCamera(availableCameras[0].deviceId);
    } else {
      startCamera();
    }
  }, [selectedCameraId, availableCameras, startCamera]);

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={`flex items-center gap-2 bg-gradient-sky hover:bg-accent border-border/50 ${className}`}
        >
          <Camera className="w-4 h-4" />
          {buttonText}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-lg backdrop-nature border-0">
        <DialogHeader>
          <DialogTitle className="text-primary">قارئ رمز QR</DialogTitle>
          <DialogDescription>
            ضع رمز QR داخل إطار الكاميرا للمسح
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Error Display */}
          {scanState.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{scanState.error}</AlertDescription>
            </Alert>
          )}

          {/* Camera Selection */}
          {showCameraSelection && availableCameras.length > 1 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">اختر الكاميرا</label>
              <Select value={selectedCameraId} onValueChange={handleCameraChange}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الكاميرا" />
                </SelectTrigger>
                <SelectContent>
                  {availableCameras.map((camera) => (
                    <SelectItem key={camera.deviceId} value={camera.deviceId}>
                      {camera.label} {camera.isBackCamera ? '(موصى به)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Video Display */}
          <div className="relative bg-black rounded-lg overflow-hidden">
            {!scanState.isScanning && !scanState.isInitializing ? (
              <div className="text-center py-12 text-white">
                <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-sm opacity-75">الكاميرا غير مفعلة</p>
            </div>
          ) : (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-auto max-h-96 object-cover"
                  playsInline
                  muted
                  autoPlay
                />
                
                {/* Scanning overlay */}
                {scanState.isScanning && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-4 border-2 border-green-400 rounded-lg animate-pulse" />
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                      جاري المسح...
                    </div>
                  </div>
                )}

                {/* Loading overlay */}
                {scanState.isInitializing && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2" />
                      <p className="text-sm">جاري تهيئة الكاميرا...</p>
                    </div>
              </div>
                )}

                {/* Control buttons */}
                <div className="absolute top-2 left-2 flex gap-2">
                  {showTorchToggle && scanState.isScanning && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={toggleTorch}
                      className="bg-black bg-opacity-50 hover:bg-opacity-70"
                    >
                      {scanState.isTorchOn ? (
                        <FlashlightOff className="w-4 h-4" />
                      ) : (
                        <Flashlight className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                  
              <Button
                    size="sm"
                variant="destructive"
                    onClick={stopCamera}
                    className="bg-black bg-opacity-50 hover:bg-opacity-70"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
              </>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            {!scanState.isScanning && !scanState.isInitializing ? (
              <Button 
                onClick={handleStartScan} 
                className="bg-gradient-hero hover:opacity-90 flex-1"
                disabled={!scanState.hasPermission && availableCameras.length === 0}
              >
                <Camera className="w-4 h-4 ml-2" />
                تشغيل الكاميرا
              </Button>
            ) : (
              <Button 
                onClick={stopCamera} 
                variant="outline" 
                className="flex-1"
              >
                <X className="w-4 h-4 ml-2" />
                إيقاف المسح
              </Button>
            )}
          </div>

          {/* Instructions */}
          <div className="text-xs text-muted-foreground text-center">
            <p>• تأكد من وجود إضاءة جيدة للمسح الأفضل</p>
            <p>• أمسك رمز QR بثبات داخل الإطار</p>
            <p>• استخدم الكاميرا الخلفية للحصول على أفضل النتائج</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Export default for easier imports
export default QRScanner;