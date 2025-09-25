// Use WordPress-provided React globals to avoid bundling/react duplication
const React = (window as any).React;
const ReactDOM = (window as any).ReactDOM;
import { StandaloneWidget } from "@/components/BookingWidget/StandaloneWidget";

export type HeiwaWidgetConfig = any;
export type HeiwaWidgetContainer = string | HTMLElement;

function resolveContainer(target: HeiwaWidgetContainer): HTMLElement | null {
  if (typeof target === "string") return document.getElementById(target);
  return (target as HTMLElement) || null;
}

function mount(target: HeiwaWidgetContainer, config?: HeiwaWidgetConfig) {
  const el = resolveContainer(target);
  if (!el) {
    console.error("HeiwaWidget: container not found", target);
    return null;
  }
  const cfg = config || (window as any).heiwaWidgetConfig || {};
  const containerId = el.id || "heiwa-widget";
  const root = ReactDOM.createRoot(el);
  root.render(React.createElement(StandaloneWidget, { containerId, config: cfg, className: "wordpress-integration" }));
  return root;
}

function initHeiwaWidget(containerId: string, config?: HeiwaWidgetConfig) {
  // Backwards-compat global, maps to mount
  return mount(containerId, config);
}

// Expose globals for WordPress
;(window as any).HeiwaWidget = { mount };
;(window as any).initHeiwaWidget = initHeiwaWidget;

