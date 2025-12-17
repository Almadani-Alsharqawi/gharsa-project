# Modern QR Scanner Component

A comprehensive, production-ready QR code scanner component for React applications using modern web APIs and best practices.

## Features

### 🎥 Browser APIs (MediaDevices & MediaStream)
- Uses `navigator.mediaDevices.getUserMedia` with proper constraints
- Optimized for QR scanning with `facingMode: 'environment'`
- Ideal resolution settings (1280x720) with 30fps frame rate
- Proper lifecycle management with track cleanup on unmount

### 📱 Video Integration
- Binds MediaStream to `<video>` element via `srcObject`
- Autoplay with proper user interaction handling
- Mirroring support for front camera usage
- Responsive video display with proper aspect ratio

### 🔍 QR Code Detection
- Uses ZXing (@zxing/browser) for accurate QR detection
- Continuously decodes frames in real-time
- Optimized for QR codes only (better performance)
- Automatic scan stopping after successful detection

### 🔒 Permissions & Security
- Detects and handles permission errors (NotAllowedError, NotFoundError, etc.)
- Enforces HTTPS requirement (allows localhost for development)
- User-friendly error messages with actionable guidance
- Graceful fallback to manual input

### ⚡ Performance
- Prevents multiple concurrent scans using ref flags
- Proper cleanup of tracks when scanning stops
- Memory-efficient video stream management
- Optimized ZXing configuration for QR codes only

### 📱 Mobile-Friendly Features
- Prefers rear camera on mobile devices
- Handles orientation changes gracefully
- Torch/flashlight toggle support (when available)
- Touch-friendly interface design

### 🎛️ Device Selection
- Enumerates available cameras using `navigator.mediaDevices.enumerateDevices`
- Allows user to select front/back cameras
- Auto-selects rear camera when available
- Shows camera labels and recommendations

### 🛠️ Error Handling & UX
- Comprehensive error handling for all camera access scenarios
- Fallback to manual QR code input
- Clear scanning state indicators (loading, success, error)
- Toast notifications for user feedback

## Usage

### Basic Usage

```tsx
import QRScanner from '@/components/QRScanner';

function MyComponent() {
  const handleQRResult = (result: string) => {
    console.log('QR Code detected:', result);
  };

  const handleQRError = (error: string) => {
    console.error('QR Scan error:', error);
  };

  return (
    <QRScanner
      onResult={handleQRResult}
      onError={handleQRError}
    />
  );
}
```

### Advanced Usage

```tsx
import QRScanner from '@/components/QRScanner';

function MyComponent() {
  const handleQRResult = (result: string) => {
    console.log('QR Code detected:', result);
  };

  return (
    <QRScanner
      onResult={handleQRResult}
      onError={(error) => console.error(error)}
      buttonText="Scan QR Code"
      showCameraSelection={true}
      showTorchToggle={true}
      className="w-full"
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onResult` | `(result: string) => void` | **Required** | Callback when QR code is successfully scanned |
| `onError` | `(error: string) => void` | `undefined` | Callback when an error occurs |
| `className` | `string` | `''` | Additional CSS classes for the trigger button |
| `buttonText` | `string` | `'Scan QR Code'` | Text displayed on the trigger button |
| `showCameraSelection` | `boolean` | `true` | Whether to show camera selection dropdown |
| `showTorchToggle` | `boolean` | `true` | Whether to show torch/flashlight toggle button |

## Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full Support | All features work perfectly |
| Firefox | ✅ Full Support | All features work perfectly |
| Safari | ✅ iOS 11+ | Works on modern iOS devices |
| Android Chrome | ✅ Full Support | All features including torch |
| Android Firefox | ✅ Full Support | All features work |

## Production Deployment

### HTTPS Requirement
The QR scanner requires HTTPS in production environments. Camera access is only available in secure contexts:

- ✅ `https://yourdomain.com` - Works
- ✅ `http://localhost` - Works (development only)
- ❌ `http://yourdomain.com` - Will fail

### Environment Variables
No special environment variables are required. The component automatically detects the environment and provides appropriate error messages.

## Error Handling

The component handles various error scenarios:

### Permission Errors
- **NotAllowedError**: User denied camera permission
- **NotFoundError**: No camera found on device
- **NotReadableError**: Camera is in use by another application
- **OverconstrainedError**: Camera constraints cannot be satisfied

### Security Errors
- **HTTPS Required**: Automatically detected and user-friendly message shown
- **Secure Context**: Validates secure context before attempting camera access

### Device Errors
- **No Camera**: Graceful fallback to manual input
- **Camera Busy**: Clear error message with retry option
- **Unsupported Features**: Torch toggle gracefully disabled if not supported

## Performance Considerations

### Memory Management
- Proper cleanup of MediaStream tracks on component unmount
- ZXing reader cleanup to prevent memory leaks
- Video element cleanup when scanning stops

### Scanning Optimization
- QR codes only detection (faster than multi-format)
- Automatic scan stopping after successful detection
- Debounced error handling to prevent spam

### Mobile Optimization
- Prefers rear camera for better QR scanning
- Responsive video sizing
- Touch-friendly control buttons
- Orientation change handling

## Development

### Testing
1. Start the development server: `npm run dev`
2. Navigate to the QR test page: `/qr-test`
3. Test with various QR codes
4. Test camera switching and torch functionality
5. Test error scenarios (deny permissions, etc.)

### Debugging
- Check browser console for detailed error messages
- Use browser dev tools to inspect camera constraints
- Test on different devices and browsers
- Verify HTTPS requirement in production

## Dependencies

- `@zxing/browser`: QR code detection library
- `react`: React framework
- `lucide-react`: Icons
- `@radix-ui/*`: UI components (Dialog, Select, Alert, etc.)

## License

This component is part of the tree-scan-scribe project and follows the same license terms.
