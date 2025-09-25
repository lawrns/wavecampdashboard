import { build } from "esbuild";
import path from "path";
import fs from "fs";

async function main() {
  const projectRoot = process.cwd();
  const outFile = path.join(projectRoot, "wordpress-server/wp-content/plugins/heiwa-booking-widget/assets/build/heiwa-widget.umd.js");
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
    }
  });

  // Post-build patch: map dynamic requires to WP globals
  try {
    let code = fs.readFileSync(outFile, "utf8");
    // Regex replacements for simple cases
    code = code.replace(/require\(["']react["']\)/g, "window.React")
               .replace(/require\(["']react-dom["']\)/g, "window.ReactDOM")
               .replace(/F\(["']react["']\)/g, "window.React")
               .replace(/F\(["']react-dom["']\)/g, "window.ReactDOM")
               .replace(/F\(["']react-dom\/client["']\)/g, "window.ReactDOM")
               .replace(/F\(["']react\/jsx-runtime["']\)/g, "window.React");
    // String replacements for paths with slashes (avoid TS regex literal parsing issues)
    code = code.split('require("react/jsx-runtime")').join('window.React');
    code = code.split("require('react/jsx-runtime')").join('window.React');
    code = code.split('require("react-dom/client")').join('window.ReactDOM');
    code = code.split("require('react-dom/client')").join('window.ReactDOM');
    // Since we're not using createPortal anymore, remove these replacements
    // code = code.replace(/createPortal/g, 'window.ReactDOM.createPortal');
    // code = code.replace(/require\(["']react-dom["']\)\.createPortal/g, 'window.ReactDOM.createPortal');
    fs.writeFileSync(outFile, code);
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

