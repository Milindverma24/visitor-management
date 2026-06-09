import { useEffect, useState } from 'react';

export const useWebSocket = () => {
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Determine WS protocol based on current HTTP protocol
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use the backend port (proxy might not support WS out of the box in dev without config, 
    // so we directly connect to 8001 or rely on Vite's proxy if configured for WS)
    // Here we'll try to connect to the explicit backend port since it's a known URL format
    const wsUrl = import.meta.env.VITE_WS_URL || `${protocol}//localhost:8001/ws/live`;
    
    let ws: WebSocket;
    let reconnectTimer: NodeJS.Timeout;

    const connect = () => {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        console.log("WebSocket connected to", wsUrl);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
        } catch (e) {
          console.error("Invalid WS message format", event.data);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log("WebSocket disconnected. Retrying in 3s...");
        reconnectTimer = setTimeout(connect, 3000);
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        ws.close();
      };
    };

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) {
        ws.onclose = null; // Prevent reconnect on deliberate unmount
        ws.close();
      }
    };
  }, []);

  return { lastMessage, isConnected };
};
