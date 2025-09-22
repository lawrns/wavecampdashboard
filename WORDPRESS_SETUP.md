# WordPress Setup Guide

WordPress has been installed in the `/wordpress/` subdirectory and is configured to be accessible at `http://localhost:3000/wordpress/`.

## Current Status
✅ WordPress files extracted to `public/wordpress/`
✅ Basic configuration files created (`wp-config.php`, `.htaccess`)
✅ Next.js routing configured to handle `/wordpress/` requests

## Next Steps to Complete Setup

### 1. Database Setup
You need to create a MySQL/MariaDB database for WordPress:

```sql
CREATE DATABASE wordpress_db;
CREATE USER 'wordpress_user'@'localhost' IDENTIFIED BY 'wordpress_password';
GRANT ALL PRIVILEGES ON wordpress_db.* TO 'wordpress_user'@'localhost';
FLUSH PRIVILEGES;
```

Or if using Docker:
```bash
# If you have Docker, you can run a MySQL container
docker run --name wordpress-db -e MYSQL_ROOT_PASSWORD=rootpassword -e MYSQL_DATABASE=wordpress_db -e MYSQL_USER=wordpress_user -e MYSQL_PASSWORD=wordpress_password -p 3306:3306 -d mysql:8.0
```

### 2. Update Database Configuration
Edit `public/wordpress/wp-config.php` and update the database settings to match your actual database:

```php
define( 'DB_NAME', 'your_actual_database_name' );
define( 'DB_USER', 'your_database_username' );
define( 'DB_PASSWORD', 'your_database_password' );
define( 'DB_HOST', 'localhost' ); // or your database host
```

### 3. Generate WordPress Security Keys
Visit https://api.wordpress.org/secret-key/1.1/salt/ and replace the placeholder values in `wp-config.php`:

```php
define( 'AUTH_KEY', 'your-generated-key-here' );
define( 'SECURE_AUTH_KEY', 'your-generated-key-here' );
// ... and so on for all 8 keys
```

### 4. Access WordPress
1. Start your Next.js development server: `npm run dev`
2. Visit `http://localhost:3000/wordpress/` in your browser
3. Follow the WordPress installation wizard
4. Complete the setup by providing:
   - Site title
   - Admin username and password
   - Site URL (should be `http://localhost:3000/wordpress/`)

### 5. Install the Booking Widget Plugin
After WordPress is set up, you can install the Heiwa Booking Widget plugin:

1. Go to WordPress Admin → Plugins → Add New Plugin
2. Upload the plugin from `public/wordpress-plugin/heiwa-booking-widget/`
3. Activate the plugin
4. Configure it with your Supabase connection details

## Troubleshooting

### WordPress Not Loading
- Check that your database is running and accessible
- Verify the database credentials in `wp-config.php`
- Check browser developer tools for any JavaScript errors

### Permalink Issues
- Ensure the `.htaccess` file exists and has the correct rewrite rules
- WordPress should automatically handle permalink updates

### Plugin Installation Issues
- Make sure the plugin files are properly uploaded
- Check file permissions on the WordPress installation

## Security Notes
- The current setup enables debugging (`WP_DEBUG = true`)
- File editing is disabled in admin for security
- Remember to disable debug mode in production
- Use strong, unique passwords for WordPress admin

## Development Workflow
- WordPress files are in `public/wordpress/`
- Plugin development files are in `public/wordpress-plugin/`
- Make sure to commit WordPress core files if you modify them
- Plugin files should be developed in the `wordpress-plugin/` directory and then copied to the WordPress installation
