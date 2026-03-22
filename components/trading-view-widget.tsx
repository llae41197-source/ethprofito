"use client";

import { useEffect, useId, useRef } from "react";

type TradingViewWidgetProps = {
  symbol: string;
  height?: number;
};

declare global {
  interface Window {
    TradingView?: {
      widget: new (config: Record<string, unknown>) => unknown;
    };
  }
}

export function TradingViewWidget({ symbol, height = 440 }: TradingViewWidgetProps) {
  const id = useId().replace(/:/g, "");
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const existing = document.querySelector(
      'script[src="https://s3.tradingview.com/tv.js"]'
    ) as HTMLScriptElement | null;

    const injectWidget = () => {
      if (!window.TradingView || !containerRef.current) {
        return;
      }

      containerRef.current.innerHTML = "";

      new window.TradingView.widget({
        autosize: true,
        symbol,
        interval: "30",
        timezone: "America/New_York",
        theme: "dark",
        style: "1",
        locale: "en",
        enable_publishing: false,
        hide_top_toolbar: false,
        allow_symbol_change: true,
        calendar: false,
        container_id: id
      });
    };

    if (existing) {
      injectWidget();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = injectWidget;
    document.body.appendChild(script);
  }, [id, symbol]);

  return <div id={id} ref={containerRef} className="tv-frame" style={{ height }} />;
}
