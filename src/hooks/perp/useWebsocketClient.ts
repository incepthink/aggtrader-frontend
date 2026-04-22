"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import {
  WebSocketClient,
  KatanaPerpsTickerEvent,
} from "@katanaperps/katana-perps-sdk";
import { writeTicker } from "@/store/perpTickerStore";

export function useKumaWebSocket(market: string = "BTC-USD") {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsClientRef = useRef<WebSocketClient | null>(null);

  useEffect(() => {
    const sandbox = process.env.NEXT_PUBLIC_KATANA_PERPS_SANDBOX === "true";
    const wsClient = new WebSocketClient({ sandbox });
    wsClientRef.current = wsClient;

    let isCancelled = false;

    wsClient.onConnect(() => {
      setIsConnected(true);
      setError(null);
    });

    wsClient.onMessage((event) => {
      if (event.type === "tickers") {
        const tickerEvent = event as KatanaPerpsTickerEvent;
        if (tickerEvent.data.market === market) {
          // RAF-batched write — no React setState here
          writeTicker(market, tickerEvent.data);
        }
      }
    });

    wsClient.onDisconnect(() => {
      setIsConnected(false);
    });

    wsClient.onError((err) => {
      console.error("Katana Perps WebSocket error:", err);
      setError(err.message || "WebSocket error occurred");
      setIsConnected(false);
    });

    const connectAndSubscribe = async () => {
      try {
        await wsClient.connect();
        if (isCancelled) return;
        wsClient.subscribePublic([{ name: "tickers" }], [market]);
      } catch (err: any) {
        if (!isCancelled) {
          console.error("Katana Perps WebSocket connection failed:", err);
          setError(err.message || "WebSocket connection failed");
          setIsConnected(false);
        }
      }
    };

    connectAndSubscribe();

    return () => {
      isCancelled = true;
      if (wsClient.isConnected) {
        wsClient.disconnect();
      }
    };
  }, [market]);

  return useMemo(
    () => ({ isConnected, error, wsClient: wsClientRef.current }),
    [isConnected, error],
  );
}
