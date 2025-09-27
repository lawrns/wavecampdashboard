// Build script for Web Component bundle
const { build } = require("esbuild");

async function buildWebComponent() {
  try {
    await build({
      entryPoints: ["src/web-component.tsx"],
      bundle: true,
      format: "iife",
      outfile: "heiwa-react-widget/assets/build/heiwa-widget.web.js",
      jsx: "automatic",
      external: ["react", "react-dom"], // React will be provided by WordPress
      define: { 
        "process.env.NODE_ENV": '"production"',
        global: "window"
      },
      minify: true,
      sourcemap: true,
      target: ["chrome90", "firefox88", "safari14", "edge90"], // Modern browser support
      loader: {
        ".css": "text",
        ".svg": "dataurl",
        ".png": "dataurl",
        ".jpg": "dataurl",
      },
      banner: {
        js: `/**
 * Heiwa Booking Widget Web Component
 * Version: 2.0.0
 * Isolated React widget for WordPress integration
 */`
      }
    });

    console.log("✅ Built Web Component: heiwa-react-widget/assets/build/heiwa-widget.web.js");
  } catch (error) {
    console.error("❌ Web Component build failed:", error);
    process.exit(1);
  }
}

buildWebComponent();
