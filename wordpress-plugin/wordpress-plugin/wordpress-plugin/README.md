# Heiwa Booking Widget WordPress Plugin

A WordPress plugin that provides a consolidated booking widget for Heiwa House surf camps using modern web components and React.

## Recent Fix: Session Header Conflict

**Issue**: `session_start()` errors when headers already sent
**Root Cause**: Custom element registration running before DOM ready
**Fix**: Deferred custom element registration until DOMContentLoaded

## Usage
[heiwa_booking] - Basic booking widget
[heiwa_booking type="landing"] - Landing page with booking widget
[heiwa_booking type="premium"] - Premium demo experience
