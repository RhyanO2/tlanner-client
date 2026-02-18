import { useEffect, useRef } from 'react';
import { getToken } from './auth';
import { getApiBaseUrl } from './api';

export type WSMessage = {
  event: string;
  data: any;
};

type WSListener = (event: string, data: any) => void;

const listeners = new Set<WSListener>();
let sharedSocket: WebSocket | null = null;
let reconnectTimer: number | null = null;
let retries = 0;
let closedByClient = false;

function dispatchRealtimeEvent(event: string, data: any) {
  window.dispatchEvent(
    new CustomEvent('tlanner:realtime-event', {
      detail: { event, data },
    }),
  );
}

function notifyListeners(event: string, data: any) {
  listeners.forEach((listener) => {
    listener(event, data);
  });
}

function clearReconnectTimer() {
  if (reconnectTimer !== null) {
    window.clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function scheduleReconnect() {
  if (listeners.size === 0 || reconnectTimer !== null) return;

  retries += 1;
  const delay = Math.min(1000 * Math.pow(2, retries), 30000);
  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null;
    connectSharedSocket();
  }, delay);
}

function connectSharedSocket() {
  if (sharedSocket || listeners.size === 0) return;

  const token = getToken();
  if (!token) return;

  const baseUrl = getApiBaseUrl().replace(/\/$/, '');
  const wsUrl = baseUrl
    .replace('https://', 'wss://')
    .replace('http://', 'ws://');

  const socket = new WebSocket(`${wsUrl}/ws?token=${token}`);
  sharedSocket = socket;

  socket.onopen = () => {
    retries = 0;
    closedByClient = false;
  };

  socket.onmessage = (event) => {
    try {
      const parsed: WSMessage = JSON.parse(event.data);
      dispatchRealtimeEvent(parsed.event, parsed.data);
      notifyListeners(parsed.event, parsed.data);
    } catch {
      // mensagem inválida, ignora
    }
  };

  socket.onclose = (event) => {
    sharedSocket = null;

    if (closedByClient || event.code === 4001) {
      closedByClient = false;
      return;
    }

    scheduleReconnect();
  };

  socket.onerror = () => {};
}

function disconnectSharedSocketIfIdle() {
  if (listeners.size > 0) return;

  clearReconnectTimer();

  if (!sharedSocket) return;

  closedByClient = true;
  sharedSocket.close(1000, 'No subscribers');
  sharedSocket = null;
}

export function useWebSocket(onEvent: (event: string, data: any) => void) {
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    const listener: WSListener = (event, data) => {
      onEventRef.current(event, data);
    };

    listeners.add(listener);
    connectSharedSocket();

    return () => {
      listeners.delete(listener);
      disconnectSharedSocketIfIdle();
    };
  }, []);
}
