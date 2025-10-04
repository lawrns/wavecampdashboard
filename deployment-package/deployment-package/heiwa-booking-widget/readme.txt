=== Heiwa Booking Widget (Web Component) ===

Contributors: Heiwa House
Tags: booking, widget, surf, camp, reservation, web-component
Requires at least: 5.0
Tested up to: 6.4
Stable tag: 2.0.0
Requires PHP: 7.4
License: GPL v2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

A modern, isolated booking widget for surf camps using Web Components and Shadow DOM technology.

== Description ==

The Heiwa Booking Widget provides a seamless booking experience for surf camp websites. Unlike traditional plugins that can conflict with WordPress themes, this widget uses Web Components with Shadow DOM isolation to ensure consistent styling and behavior regardless of your WordPress setup.

### Key Features

* **CSS Isolation**: Shadow DOM prevents theme/plugin conflicts
* **Performance Optimized**: <100ms initial load, <120KB bundle
* **Accessibility Compliant**: WCAG AA compliant with keyboard navigation
* **Mobile Responsive**: Works perfectly on all devices
* **Stripe Integration**: Secure payment processing
* **Bank Transfer Support**: Alternative payment method
* **Error Resilient**: Graceful fallbacks and error recovery

### Technical Benefits

* No React/JavaScript conflicts with WordPress
* Isolated styling prevents theme interference
* Modern Web Components architecture
* Comprehensive error boundaries
* Built-in performance optimizations

== Installation ==

1. Upload the `heiwa-booking-widget` folder to `/wp-content/plugins/`
2. Activate the plugin through the WordPress admin
3. Configure API settings in **Heiwa Widget > Settings**
4. Use the shortcode `[heiwa_booking]` on any page or post

== Configuration ==

### Required Settings

1. **API Endpoint**: URL of your Heiwa Admin API (e.g., `https://api.heiwa.house`)
2. **API Key**: Secure authentication key for API access

### Optional Settings

* **Default Position**: Widget trigger button position (right/left/center)
* **Primary Color**: Brand color for the widget (#hex format)
* **Trigger Text**: Custom text for the booking button
* **Maximum Guests**: Limit per booking (1-20)

== Usage ==

### Basic Usage
```
[heiwa_booking]
```

### Advanced Usage
```
[heiwa_booking position="left" trigger_text="Book Your Adventure" primary_color="#10b981" max_guests="8"]
```

### Shortcode Parameters

* `position` - Button position: "right" (default), "left", or "center"
* `trigger_text` - Custom button text (default: "Book Your Surf Trip")
* `primary_color` - Brand color in hex format (default: "#f97316")
* `max_guests` - Maximum guests per booking (default: 10)

== API Configuration ==

### Environment Variables (Recommended for Production)

Add to your `wp-config.php` or server environment:

```php
// Most secure - environment variables
putenv('HEIWA_ADMIN_API_BASE=https://api.heiwa.house');
putenv('HEIWA_ADMIN_API_KEY=your-secure-api-key-here');

// Alternative - constants
define('HEIWA_ADMIN_API_BASE', 'https://api.heiwa.house');
define('HEIWA_ADMIN_API_KEY', 'your-secure-api-key-here');
```

### WordPress Options (Development Only)

Configure through **WordPress Admin > Heiwa Widget > Settings**:

- API Endpoint: `https://api.heiwa.house`
- API Key: Your authentication key

**⚠️ Warning**: Avoid storing API keys in WordPress options for production sites.

== Technical Details ==

### Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Dependencies

- WordPress 5.0+
- PHP 7.4+
- Modern browser with Custom Elements v1 support

### File Structure

```
heiwa-booking-widget/
├── heiwa-booking-widget.php     # Main plugin file
├── assets/
│   ├── build/
│   │   ├── heiwa-widget.tailwind.css    # Compiled styles
│   │   └── heiwa-widget.surf.css        # Surf enhancements
│   └── dist/
│       └── heiwa-widget.web.js          # Web Component bundle
├── admin/                         # Admin interface (future)
└── readme.txt                     # This file
```

== Troubleshooting ==

### Widget Not Loading

1. Check browser console for JavaScript errors
2. Verify API endpoint and key configuration
3. Ensure WordPress 5.0+ and PHP 7.4+
4. Check file permissions on plugin directory

### Styling Issues

1. Clear browser cache and WordPress caches
2. Verify CSS files exist in `assets/build/`
3. Check for custom CSS conflicts in theme
4. Shadow DOM isolation should prevent most conflicts

### API Connection Problems

1. Verify API endpoint URL (no trailing slash)
2. Check API key permissions
3. Review server CORS configuration
4. Check network tab for failed requests

### Performance Issues

1. Enable browser caching for static assets
2. Verify bundle size < 120KB
3. Check initial load time < 100ms
4. Monitor Core Web Vitals

== Development ==

### Building the Widget

The widget bundle is pre-built. For development:

```bash
# Install dependencies
npm install

# Build CSS
npm run build:widget:css

# Build JavaScript bundle
npm run build:widget:web

# Copy to WordPress
cp dist/heiwa-widget.web.js wordpress-server/wp-content/plugins/heiwa-booking-widget/
```

### Testing

```bash
# Unit tests
npm run test:unit

# E2E tests
npm run test

# Playwright UI tests
npm run test:ui
```

== Changelog ==

= 2.0.0 =
* Complete rewrite using Web Components
* Shadow DOM CSS isolation
* Improved performance and accessibility
* Enhanced error handling and recovery

== Frequently Asked Questions ==

= Can I customize the widget appearance? =

Yes! The widget supports extensive customization:
- Primary color via shortcode or settings
- Trigger button text and position
- Responsive design adapts to container

= Does it work with my theme? =

Yes! Shadow DOM isolation prevents theme conflicts. The widget maintains consistent appearance regardless of WordPress theme.

= Is it mobile-friendly? =

Absolutely! Fully responsive design with touch-optimized interactions and mobile keyboard support.

= What payment methods are supported? =

- Stripe (credit/debit cards)
- Bank transfer/wire payments

= Can I use it on multiple sites? =

Yes, with appropriate API key configuration for each site.

= How do I update the widget? =

Replace the plugin files and clear any caches. The Web Component architecture ensures reliable updates.

== Support ==

For technical support or feature requests:

- **GitHub Issues**: Report bugs and request features
- **Documentation**: Check inline code comments
- **Community**: WordPress.org support forums

== Security ==

- All API communications use HTTPS
- Sensitive data never stored in WordPress
- WordPress security best practices followed
- Regular security updates and monitoring

== License ==

This plugin is licensed under the GPL v2 or later.

```
Heiwa Booking Widget Web Component
Copyright (C) 2024 Heiwa House

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.
```
