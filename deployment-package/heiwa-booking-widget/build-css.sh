#!/bin/bash
# Heiwa Booking Widget - CSS Build Script
# Combines modular CSS files into a single widget.css for production deployment

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CSS_DIR="$SCRIPT_DIR/assets/css"
OUTPUT_FILE="$CSS_DIR/widget.css"

echo "🏗️  Building Heiwa Booking Widget CSS..."
echo "📂 Source directory: $CSS_DIR"
echo "📄 Output file: $OUTPUT_FILE"

# Check if source files exist
if [ ! -f "$CSS_DIR/base.css" ]; then
    echo "❌ Error: base.css not found in $CSS_DIR"
    exit 1
fi

if [ ! -f "$CSS_DIR/components.css" ]; then
    echo "❌ Error: components.css not found in $CSS_DIR"
    exit 1
fi

if [ ! -f "$CSS_DIR/layout.css" ]; then
    echo "❌ Error: layout.css not found in $CSS_DIR"
    exit 1
fi

if [ ! -f "$CSS_DIR/utilities.css" ]; then
    echo "❌ Error: utilities.css not found in $CSS_DIR"
    exit 1
fi

# Create header comment
cat > "$OUTPUT_FILE" << 'EOF'
/*!
 * Heiwa Booking Widget - Combined Styles
 * Generated from modular CSS architecture
 *
 * Build Date: $(date)
 * Source Files:
 * - base.css (Foundation layer)
 * - components.css (Component layer)
 * - layout.css (Layout layer)
 * - utilities.css (Utilities layer)
 *
 * Author: Heiwa House Development Team
 * Version: 2.0.0
 */

EOF

# Append each CSS file with section headers
echo "/* ===========================================" >> "$OUTPUT_FILE"
echo "   BASE LAYER - Foundation & Design Tokens" >> "$OUTPUT_FILE"
echo "   =========================================== */" >> "$OUTPUT_FILE"
cat "$CSS_DIR/base.css" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "/* ===========================================" >> "$OUTPUT_FILE"
echo "   COMPONENTS LAYER - UI Components" >> "$OUTPUT_FILE"
echo "   =========================================== */" >> "$OUTPUT_FILE"
cat "$CSS_DIR/components.css" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "/* ===========================================" >> "$OUTPUT_FILE"
echo "   LAYOUT LAYER - Positioning & Structure" >> "$OUTPUT_FILE"
echo "   =========================================== */" >> "$OUTPUT_FILE"
cat "$CSS_DIR/layout.css" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "/* ===========================================" >> "$OUTPUT_FILE"
echo "   UTILITIES LAYER - Overrides & Animations" >> "$OUTPUT_FILE"
echo "   =========================================== */" >> "$OUTPUT_FILE"
cat "$CSS_DIR/utilities.css" >> "$OUTPUT_FILE"

# Add build completion comment
echo "" >> "$OUTPUT_FILE"
echo "/* Build completed successfully */" >> "$OUTPUT_FILE"

# Get file size and line count
FILE_SIZE=$(wc -c < "$OUTPUT_FILE")
LINE_COUNT=$(wc -l < "$OUTPUT_FILE")

echo "✅ Build completed successfully!"
echo "📊 Output statistics:"
echo "   - File size: $(($FILE_SIZE / 1024))KB ($FILE_SIZE bytes)"
echo "   - Lines: $LINE_COUNT"
echo "   - Location: $OUTPUT_FILE"

echo ""
echo "🎯 Next steps:"
echo "   1. Test the combined widget.css file"
echo "   2. Update deployment scripts to use single file if preferred"
echo "   3. Consider minification for production"

# Optional: Create minified version
if command -v csso >/dev/null 2>&1; then
    echo ""
    echo "🔧 Creating minified version..."
    csso "$OUTPUT_FILE" --output "$CSS_DIR/widget.min.css"
    MIN_SIZE=$(wc -c < "$CSS_DIR/widget.min.css")
    echo "✅ Minified version created: $(($MIN_SIZE / 1024))KB saved"
elif command -v cleancss >/dev/null 2>&1; then
    echo ""
    echo "🔧 Creating minified version..."
    cleancss "$OUTPUT_FILE" -o "$CSS_DIR/widget.min.css"
    MIN_SIZE=$(wc -c < "$CSS_DIR/widget.min.css")
    echo "✅ Minified version created: $(($MIN_SIZE / 1024))KB saved"
else
    echo ""
    echo "💡 Tip: Install 'csso' or 'clean-css' for automatic minification"
    echo "   npm install -g csso"
    echo "   # or"
    echo "   npm install -g clean-css-cli"
fi
