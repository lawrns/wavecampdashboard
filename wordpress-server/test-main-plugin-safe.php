<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Test Main Plugin Safe Loading</h1>";

try {
    require_once 'wp-load.php';
    echo "<p>✓ WordPress loaded</p>";
    
    // Test loading the main plugin file
    $plugin_file = WP_PLUGIN_DIR . '/heiwa-booking-widget/heiwa-booking-widget.php';
    echo "<p>Main plugin file exists: " . (file_exists($plugin_file) ? 'YES' : 'NO') . "</p>";
    
    if (file_exists($plugin_file)) {
        echo "<p>Testing plugin file syntax...</p>";
        
        // Test syntax by including the file
        ob_start();
        $error = null;
        try {
            include_once $plugin_file;
            echo "<p>✓ Plugin file included successfully</p>";
        } catch (ParseError $e) {
            $error = "Parse Error: " . $e->getMessage();
        } catch (Error $e) {
            $error = "Fatal Error: " . $e->getMessage();
        } catch (Exception $e) {
            $error = "Exception: " . $e->getMessage();
        }
        $output = ob_get_clean();
        
        if ($error) {
            echo "<p>❌ Error loading plugin: $error</p>";
            return;
        }
        
        echo "<p>Plugin class exists: " . (class_exists('Heiwa_Booking_Widget') ? 'YES' : 'NO') . "</p>";
        
        if (class_exists('Heiwa_Booking_Widget')) {
            echo "<p>Creating plugin instance...</p>";
            $plugin = Heiwa_Booking_Widget::get_instance();
            echo "<p>✓ Plugin instance created</p>";
            
            echo "<p>Calling plugin init...</p>";
            $plugin->init();
            echo "<p>✓ Plugin init completed</p>";
            
            echo "<p>Shortcode exists: " . (shortcode_exists('heiwa_booking') ? 'YES' : 'NO') . "</p>";
            
            if (shortcode_exists('heiwa_booking')) {
                echo "<p>Testing shortcode...</p>";
                $output = do_shortcode('[heiwa_booking]');
                echo "<p>Shortcode output length: " . strlen($output) . " characters</p>";
                
                if (strlen($output) > 0) {
                    echo "<h3>Shortcode Output Preview:</h3>";
                    echo "<div style='border: 1px solid #ccc; padding: 10px; background: #f9f9f9; max-height: 200px; overflow: auto;'>";
                    echo htmlspecialchars(substr($output, 0, 500)) . (strlen($output) > 500 ? '...' : '');
                    echo "</div>";
                    
                    // Check if it contains React widget container
                    if (strpos($output, 'heiwa-react-widget-container') !== false) {
                        echo "<p>✅ Output contains React widget container</p>";
                    } else {
                        echo "<p>⚠️ Output does not contain React widget container</p>";
                    }
                } else {
                    echo "<p>❌ Shortcode returned empty output</p>";
                }
            }
        }
        
        echo "<h3>Plugin Dependencies Check:</h3>";
        $required_files = array(
            'includes/class-shortcode.php',
            'includes/class-api-connector.php',
        );
        
        foreach ($required_files as $file) {
            $file_path = WP_PLUGIN_DIR . '/heiwa-booking-widget/' . $file;
            $exists = file_exists($file_path);
            echo "<p>$file: " . ($exists ? '✓ EXISTS' : '❌ MISSING') . "</p>";
        }
        
        echo "<h3>React Build Files Check:</h3>";
        $build_files = array(
            'assets/build/widget-entry.js',
            'assets/build/widget-styles.css'
        );
        
        foreach ($build_files as $file) {
            $file_path = WP_PLUGIN_DIR . '/heiwa-booking-widget/' . $file;
            $exists = file_exists($file_path);
            echo "<p>$file: " . ($exists ? '✓ EXISTS' : '❌ MISSING') . "</p>";
        }
    }
    
} catch (Exception $e) {
    echo "<p>✗ Exception: " . $e->getMessage() . "</p>";
    echo "<p>Stack trace:</p><pre>" . $e->getTraceAsString() . "</pre>";
} catch (Error $e) {
    echo "<p>✗ Fatal Error: " . $e->getMessage() . "</p>";
    echo "<p>Stack trace:</p><pre>" . $e->getTraceAsString() . "</pre>";
}

echo "<p>Test complete</p>";
?>
