# Gharsa Tree Scan - Frontend

This is the React frontend for the Gharsa Tree Scan application that connects to a Strapi backend to display tree information when users scan QR codes.

## Features

✅ **Dynamic Routing**: Automatically extracts serial numbers from URL paths (e.g., `/00003`)
✅ **Arabic RTL Support**: Full right-to-left layout with Arabic fonts (Cairo & Tajawal)
✅ **API Integration**: Connects to Strapi backend at `http://localhost:1337`
✅ **Error Handling**: Graceful error messages and retry functionality
✅ **Loading States**: Beautiful loading spinners during data fetch
✅ **Responsive Design**: Mobile-friendly layout with modern UI
✅ **Image Support**: Displays tree and planter images from Strapi
✅ **Map Integration**: Links to Google Maps for location viewing

## How It Works

1. **QR Code Scanning**: When users scan a QR code with a URL like `http://localhost:8082/00003`
2. **Route Detection**: React Router extracts the serial number (`00003`) from the URL path
3. **API Request**: Frontend fetches tree data from Strapi using the serial number
4. **Data Display**: Shows tree information in a beautiful Arabic interface

## API Endpoints

- **Tree Data**: `GET http://localhost:1337/api/trees?filters[serial_number][$eq]=SERIAL&populate=*`
- **Media Files**: `http://localhost:1337/uploads/FILENAME`

## Data Fields Displayed

- حالة الشجرة (Tree Status)
- زُرعت بواسطة (Planted By)
- الرقم التسلسلي (Serial Number)
- تاريخ الزراعة (Planting Date)
- الموقع (Location)
- المدينة (City) - if available
- نوع الشجرة (Tree Type) - if available
- ملاحظات (Notes) - if available
- صورة الشجرة (Tree Image) - if available
- صورة الزارع (Planter Image) - if available

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Testing

1. Start the Strapi backend on `http://localhost:1337`
2. Start this frontend on `http://localhost:5173` (or configured port)
3. Visit `http://localhost:5173/00003` to see tree data
4. Or visit `http://localhost:5173/` and click "عرض بيانات الشجرة"

## File Structure

```
src/
├── components/
│   ├── TreeDataPage.tsx    # Main tree data display component
│   ├── LandingPage.tsx     # Landing page with project info
│   └── ui/                 # Reusable UI components
├── lib/
│   └── api.ts              # API service functions
├── pages/
│   └── Index.tsx           # Main page with routing logic
└── App.tsx                 # App component with React Router setup
```

## Arabic Typography

The app uses Google Fonts for beautiful Arabic typography:
- **Cairo**: Primary font for headings and UI elements
- **Tajawal**: Secondary font for body text
- **RTL Support**: Full right-to-left layout with proper text alignment

## Error Handling

- **Network Errors**: Shows "حدث خطأ أثناء تحميل البيانات" with retry button
- **Not Found**: Shows "لم يتم العثور على بيانات لهذه الشجرة 🌿" 
- **Loading States**: Animated spinner with "جاري تحميل بيانات الشجرة..." message

## Browser Support

- Modern browsers with ES6+ support
- Mobile-responsive design
- Arabic language support
- RTL layout support