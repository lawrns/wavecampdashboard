import { build } from "esbuild";
import path from "path";
import fs from "fs";

async function main() {
  const projectRoot = process.cwd();
  const outFile = path.join(projectRoot, "heiwa-react-widget/assets/build/heiwa-widget.umd.js");
  const outDir = path.dirname(outFile);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  await build({
    entryPoints: [path.join(projectRoot, "src/wordpress/widget-bridge.tsx")],
    bundle: true,
    format: "iife",
    platform: "browser",
    outfile: outFile,
    sourcemap: false,
    minify: true,
    jsx: "transform",
    jsxFactory: "React.createElement",
    jsxFragment: "React.Fragment",
    external: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react-dom/client"
    ],
    loader: {
      ".css": "text",
      ".svg": "dataurl",
      ".png": "dataurl",
      ".jpg": "dataurl",
      ".jpeg": "dataurl",
      ".webp": "dataurl"
    },
    globalName: "HeiwaWidgetBundle",
    define: {
      // Ensure we use the WordPress-provided React instance
      'process.env.NODE_ENV': '"production"'
    }
  });

  // Enhanced post-build patch: ensure proper React instance mapping
  try {
    let code = fs.readFileSync(outFile, "utf8");

    // Wrap the entire bundle to ensure React instance consistency
    const wrappedCode = `
(function(global) {
  'use strict';

  // Ensure we're using WordPress-provided React
  if (typeof global.React === 'undefined' || typeof global.ReactDOM === 'undefined') {
    console.error('HeiwaWidget: React or ReactDOM not available on window');
    return;
  }

  // Store references to ensure consistent React instance
  const React = global.React;
  const ReactDOM = global.ReactDOM;
  const createElement = React.createElement;
  const useReducer = React.useReducer;
  const useCallback = React.useCallback;
  const useEffect = React.useEffect;
  const useState = React.useState;

  // Patch the bundle code to use our React references
  ${code.replace(/window\.React/g, 'React').replace(/window\.ReactDOM/g, 'ReactDOM')}

})(window);`;

    // Additional replacements for esbuild patterns
    let finalCode = wrappedCode
      .replace(/require\(["']react["']\)/g, "React")
      .replace(/require\(["']react-dom["']\)/g, "ReactDOM")
      .replace(/require\(["']react\/jsx-runtime["']\)/g, "React")
      .replace(/require\(["']react-dom\/client["']\)/g, "ReactDOM")
      // Handle esbuild's function call patterns
      .replace(/\w+\(["']react["']\)/g, "React")
      .replace(/\w+\(["']react-dom["']\)/g, "ReactDOM")
      .replace(/\w+\(["']react\/jsx-runtime["']\)/g, "React")
      .replace(/\w+\(["']react-dom\/client["']\)/g, "ReactDOM");

    fs.writeFileSync(outFile, finalCode);
  } catch (e) {
    console.warn("Post-build patch failed:", e);
  }

  // Copy surf enhancements CSS for WP enqueue
  const surfCssSrc = path.join(projectRoot, "src/components/BookingWidget/styles/surf-enhancements.css");
  const surfCssDest = path.join(outDir, "heiwa-widget.surf.css");
  try {
    if (fs.existsSync(surfCssSrc)) {
      fs.copyFileSync(surfCssSrc, surfCssDest);
    }
  } catch (e) {
    console.warn("Couldn't copy surf CSS:", e);
  }

  console.log("✅ Built UMD:", outFile);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

