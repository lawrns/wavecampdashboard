"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { StandaloneWidget } from "@/components/BookingWidget/StandaloneWidget";

export default function EmbedWidgetPage() {
  const params = useSearchParams();

  const config = useMemo(() => {
    const wpOrigin = params.get("wpOrigin") || "http://localhost:3006";
    const ajaxUrl = params.get("ajaxUrl") || `${wpOrigin}/wp-admin/admin-ajax.php`;
    const restBase = params.get("restBase") || `${wpOrigin}/wp-json/heiwa/v1`;
    const primaryColor = params.get("primaryColor") || "#f97316";
    const triggerText = params.get("triggerText") || "BOOK NOW";

    return {
      ajaxUrl,
      restBase,
      nonce: params.get("nonce") || "wp_rest_nonce_embed",
      pluginUrl: params.get("pluginUrl") || `${wpOrigin}/wp-content/plugins/heiwa-booking-widget/`,
      buildId: "react-widget-1757864064024",
      settings: {
        apiEndpoint: params.get("apiEndpoint") || `${typeof window !== "undefined" ? window.location.origin : ""}/api`,
        apiKey: params.get("apiKey") || "heiwa_wp_test_key_2024_secure_deployment",
        position: params.get("position") || "right",
        primaryColor,
        triggerText,
      },
    } as any;
  }, [params]);

  useEffect(() => {
    (window as any).heiwaWidgetConfig = config;

    // Remove any global demo/open buttons from root layout if present
    const removeDemoButtons = () => {
      const nodes = Array.from(document.querySelectorAll('button, a, div, span')) as HTMLElement[];
      nodes.forEach((el) => {
        const txt = (el.textContent || '').trim().toLowerCase();
        if (txt.includes('open booking widget')) {
          el.remove();
        }
      });
    };

    removeDemoButtons();

    // Observe future additions
    const mo = new MutationObserver(() => removeDemoButtons());
    mo.observe(document.documentElement, { childList: true, subtree: true });

    return () => mo.disconnect();
  }, [config]);

  return (
    <div className="heiwa-embed-container">
      <StandaloneWidget
        config={config}
        containerId="heiwa-embed-widget"
        className="wordpress-integration-embed"
      />
      <style jsx global>{`
        html, body, #__next {
          height: 100%;
          margin: 0;
          padding: 0;
          background: transparent;
        }
        .heiwa-embed-container {
          min-height: 100vh;
          background: transparent;
        }
      `}</style>
    </div>
  );
}

