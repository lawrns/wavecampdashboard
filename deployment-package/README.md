# Heiwa Booking Widget - Web Component Deployment Package

## Overview

This deployment package contains the complete Heiwa Booking Widget WordPress plugin with Web Component integration. The widget provides a seamless booking experience for surf camps with complete CSS isolation from WordPress themes.

## Package Contents

```
deployment-package/
├── heiwa-booking-widget/
│   ├── heiwa-booking-widget.php     # Main plugin file
│   ├── readme.txt                   # WordPress.org documentation
│   ├── assets/
│   │   └── build/
│   │       ├── heiwa-widget.tailwind.css    # Compiled styles
│   │       └── heiwa-widget.surf.css        # Surf enhancements
│   └── dist/
│       └── heiwa-widget.web.js              # Web Component bundle
└── README.md                                # This file
```

## Installation Instructions

### 1. Upload to WordPress

1. Download or extract the `heiwa-booking-widget` folder
2. Upload the entire folder to `/wp-content/plugins/` on your WordPress site
3. Activate the plugin through **WordPress Admin > Plugins**

### 2. Configure API Settings

Navigate to **Settings > Heiwa Widget** and configure:

- **API Endpoint**: `https://your-heiwa-api-domain.com/api`
- **API Key**: Your secure API authentication key

### 3. Add to Pages

Use the shortcode on any page or post:

```php
[heiwa_booking]
```

Advanced usage with customization:

```php
[heiwa_booking position="left" trigger_text="Book Now" primary_color="#10b981"]
```

## Configuration Options

### Shortcode Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `position` | `right` | Widget position: `right`, `left`, `center` |
| `trigger_text` | `Book Your Surf Trip` | Button text |
| `primary_color` | `#f97316` | Brand color (hex format) |
| `max_guests` | `10` | Maximum guests per booking |

### WordPress Settings

Configure through **WordPress Admin > Settings > Heiwa Widget**:

- **API Endpoint**: Heiwa Admin API URL
- **API Key**: Authentication key (store securely)
- **Default Position**: Global default position
- **Primary Color**: Global brand color
- **Trigger Text**: Global button text

## Security Notes

- Store API keys securely (environment variables preferred)
- The widget uses HTTPS for all API communications
- All shortcode inputs are sanitized and escaped
- WordPress nonces are used for AJAX requests

## Browser Compatibility

- **Chrome**: 80+
- **Firefox**: 75+
- **Safari**: 13+
- **Edge**: 80+

Unsupported browsers show a user-friendly message.

## Troubleshooting

### Widget Not Loading

1. Check browser console for JavaScript errors
2. Verify API endpoint and key configuration
3. Ensure WordPress 5.0+ and PHP 7.4+
4. Clear browser cache and WordPress caches

### Styling Issues

1. Clear browser cache and WordPress caches
2. Verify CSS files exist in `assets/build/`
3. Check for custom CSS conflicts in theme
4. Shadow DOM isolation prevents most conflicts

### API Connection Problems

1. Verify API endpoint URL (no trailing slash)
2. Check API key permissions
3. Review server CORS configuration
4. Check network tab for failed requests

## Feature Flags

### Rollback Capability

If issues occur, disable Web Components and use fallback:

```php
// In wp-config.php
define('HEIWA_WIDGET_USE_WEBC', false);
```

Or through WordPress options (advanced users only).

## Performance

- **Bundle Size**: ~1.9MB (gzipped: ~400KB)
- **Initial Load**: <100ms
- **CSS Isolation**: Zero theme conflicts
- **Caching**: Automatic asset caching

## Support

For technical support:

- **GitHub Issues**: Report bugs and request features
- **WordPress Forum**: Community support
- **Email**: support@heiwa.house

## Version History

### 2.0.0
- Complete Web Component rewrite
- Shadow DOM CSS isolation
- Enhanced performance and accessibility
- Comprehensive error handling
- Telemetry and monitoring

### 1.x.x (Legacy)
- UMD bundle approach
- Limited theme compatibility
- Higher maintenance overhead

## License

This plugin is licensed under GPL v2 or later.

---

**Heiwa House** - Premium Surf Camp Booking Platform



