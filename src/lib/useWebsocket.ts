import { useEffect, useRef } from 'react';
import { getToken } from './auth';
import { getApiBaseUrl } from './api';

export type WSMessage = {
  event: string;
  data: any;
};

export function useWebSocket(onEvent: (event: string, data: any) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);
  useEffect(() => {
    function connect() {
      const token = getToken();
      if (!token) return;

      const baseUrl = getApiBaseUrl().replace(/\/$/, '');
      const wsUrl = baseUrl
        .replace('https://', 'wss://')
        .replace('http://', 'ws://');

      const ws = new WebSocket(`${wsUrl}/ws?token=${token}`);

      ws.onopen = () => {
        console.log('✅ WebSocket connected');
        retriesRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const parsed: WSMessage = JSON.parse(event.data);
          onEventRef.current(parsed.event, parsed.data);
        } catch {
          // mensagem inválida, ignora
        }
      };

      ws.onclose = (event) => {
        console.log('🔴 WebSocket disconnected', event.code);
        if (event.code === 4001) return;

        retriesRef.current++;
        const delay = Math.min(1000 * Math.pow(2, retriesRef.current), 30000);
        console.log(`🔄 Reconnecting em ${delay / 1000}s...`);
        setTimeout(connect, delay);
      };

      ws.onerror = () => {};

      wsRef.current = ws;
    }

    connect();

    return () => {
      wsRef.current?.close(1000, 'Component unmounted');
    };
  }, []);
}
