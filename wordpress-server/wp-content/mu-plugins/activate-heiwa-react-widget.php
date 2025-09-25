<?php
/**
 * Auto-activate Heiwa React Widget Plugin
 */

// Activate the Heiwa React Widget plugin
add_action('plugins_loaded', function() {
    if (!is_plugin_active('heiwa-react-widget/heiwa-react-widget.php')) {
        activate_plugin('heiwa-react-widget/heiwa-react-widget.php');
        error_log('🔧 Auto-activated Heiwa React Widget plugin');
    }
});
