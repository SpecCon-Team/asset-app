# QR Code Auto-Open Test

## How QR Codes Automatically Open the Web App

When you generate a QR code for an asset, it contains a URL like this:

```
https://speccon-team.github.io/asset-app/#/checkout/scan?qr=ASSET:CODE:ID
```

### How It Works:

1. **Phone Camera Scans QR Code**: When you scan the QR code with your phone's camera app
2. **Detects URL**: The phone recognizes it's a URL
3. **Shows Notification**: Your phone shows a notification/link
4. **Tap to Open**: You tap the notification
5. **Browser Opens**: Your phone's browser automatically opens the URL
6. **Web App Loads**: The Asset App loads at the scanner page
7. **Auto-Fills Data**: The QR code data is automatically extracted from the URL and filled in
8. **Auto-Scans**: The scanner automatically processes the QR code data

## Testing the QR Code

### Option 1: Use the Test Page

1. Open: `http://localhost:5173/asset-app/qr-test.html` (local) or `https://speccon-team.github.io/asset-app/qr-test.html` (production)
2. You'll see a QR code displayed
3. Scan it with your phone camera
4. It should automatically open the Asset App scanner page

### Option 2: Generate a Real QR Code

1. Go to: `/checkout/qr/generate` in the app
2. Select an asset
3. Click "Generate QR Code"
4. Download or print the QR code
5. Scan with your phone camera
6. It will automatically open the scanner page with the asset data

## Example QR Code Format

The QR code contains a URL like:
```
https://speccon-team.github.io/asset-app/#/checkout/scan?qr=ASSET:LAPTOP001:abc123
```

Where:
- `ASSET` = Asset type identifier
- `LAPTOP001` = Asset code
- `abc123` = Asset ID

## Troubleshooting

### Phone doesn't open the app automatically:
- Make sure you're scanning with the phone's built-in camera app (not a third-party scanner)
- Tap the notification that appears when the QR code is detected
- Some phones require you to tap "Open in browser" or similar

### Localhost QR codes don't work on phone:
- Make sure your phone and computer are on the same WiFi network
- The QR code generator automatically replaces `localhost` with your local network IP (e.g., `192.168.1.100`)
- Test by opening the IP address in your phone's browser first

### Production QR codes:
- Production QR codes use `https://speccon-team.github.io/asset-app`
- These work from anywhere with internet access
- No special network setup required

