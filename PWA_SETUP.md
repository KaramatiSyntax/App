# PWA Setup Guide for Turrani Esports

This guide explains the Progressive Web App (PWA) setup for the Turrani Esports application.

## Features Implemented

### 1. Web App Manifest (`/public/manifest.json`)
- **App Name**: Turrani Esports
- **Short Name**: Turrani
- **Display Mode**: Standalone (app-like experience)
- **Theme Colors**: Dark theme with blue accent (#077385)
- **Icons**: Multiple sizes for different devices
- **Shortcuts**: Quick access to Matches, Events, and Wallet
- **Screenshots**: App previews for app stores

### 2. Service Worker (`/public/sw.js`)
- **Caching Strategy**: 
  - Static assets: Cache-first
  - API requests: Network-first with cache fallback
  - Navigation: Network-first with cache fallback
- **Offline Support**: Graceful offline experience
- **Background Sync**: Sync pending data when connection restores
- **Push Notifications**: Handle incoming notifications
- **Update Management**: Automatic cache cleanup and updates

### 3. PWA Components

#### ServiceWorkerRegistration (`/components/ServiceWorkerRegistration.jsx`)
- Registers and manages the service worker
- Shows update notifications
- Displays offline status indicator
- Handles notification permissions

#### PWAInstallPrompt (`/components/PWAInstallPrompt.jsx`)
- Custom install prompt for better UX
- Prevents default browser install prompt
- Shows app benefits and install button

#### usePWA Hook (`/lib/hooks/usePWA.js`)
- Custom hook for PWA functionality
- Installation status management
- Online/offline status
- Notification handling

## Installation Instructions

### For Users
1. **Automatic Prompt**: The app will show an install prompt when criteria are met
2. **Manual Installation**:
   - **Chrome/Edge**: Click the install icon in the address bar
   - **Firefox**: Click the install icon in the address bar
   - **Safari**: Use "Add to Home Screen" from the share menu

### For Developers

#### Prerequisites
- HTTPS connection (required for service workers)
- Valid manifest file
- Service worker registration

#### Testing PWA Features
1. **Installation**: Use browser dev tools to test install prompt
2. **Offline Mode**: Use dev tools to simulate offline network
3. **Updates**: Modify service worker to test update flow
4. **Notifications**: Test push notifications in dev tools

## PWA Checklist

### ✅ Implemented
- [x] Web App Manifest
- [x] Service Worker with caching
- [x] Offline functionality
- [x] Install prompt
- [x] Push notifications
- [x] App icons (multiple sizes)
- [x] Theme colors
- [x] Splash screen support
- [x] Background sync
- [x] Update notifications

### 🔧 Configuration

#### Manifest Properties
```json
{
  "name": "Turrani Esports",
  "short_name": "Turrani",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#077385",
  "orientation": "portrait-primary"
}
```

#### Service Worker Features
- Static file caching
- API response caching
- Offline fallback pages
- Background sync
- Push notification handling

## Browser Support

### Fully Supported
- Chrome (Android & Desktop)
- Edge (Windows)
- Firefox (Android & Desktop)
- Safari (iOS 11.3+)

### Partially Supported
- Samsung Internet
- UC Browser

## Performance Optimizations

### Caching Strategy
1. **Static Assets**: Cache-first for immediate loading
2. **API Responses**: Network-first for fresh data
3. **Navigation**: Network-first with offline fallback

### Bundle Optimization
- Service worker is lightweight and efficient
- Manifest includes only necessary properties
- Icons are optimized for different screen densities

## Security Considerations

### HTTPS Requirement
- Service workers require HTTPS
- Manifest must be served over HTTPS
- Push notifications require secure context

### Content Security Policy
- Service worker respects CSP headers
- Manifest is served with appropriate headers

## Troubleshooting

### Common Issues

1. **Service Worker Not Registering**
   - Check HTTPS requirement
   - Verify file path is correct
   - Check browser console for errors

2. **Install Prompt Not Showing**
   - Ensure all PWA criteria are met
   - Check manifest validity
   - Verify service worker is active

3. **Offline Mode Not Working**
   - Check service worker caching
   - Verify offline fallback pages
   - Test with dev tools offline mode

### Debug Commands
```javascript
// Check service worker status
navigator.serviceWorker.getRegistrations()

// Check cache contents
caches.keys().then(keys => console.log(keys))

// Force service worker update
navigator.serviceWorker.getRegistration().then(reg => reg.update())
```

## Future Enhancements

### Planned Features
- [ ] Advanced offline data sync
- [ ] Background task processing
- [ ] Enhanced push notification categories
- [ ] App shortcuts for quick actions
- [ ] Share target API integration

### Performance Improvements
- [ ] Image optimization and lazy loading
- [ ] Critical CSS inlining
- [ ] Service worker code splitting
- [ ] Advanced caching strategies

## Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [PWA Builder](https://www.pwabuilder.com/)

## Support

For technical support or questions about the PWA implementation, please refer to the development team or create an issue in the project repository. 

