import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuthStore } from './useAuthStore';

export const useSocket = (topic: string, onMessage: (msg: any) => void) => {
  const clientRef = useRef<Client | null>(null);
  const onMessageRef = useRef(onMessage);
  const token = useAuthStore(state => state.token);

  // Keep the callback ref up to date
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!token) return;

    const client = new Client({
      webSocketFactory: () => new SockJS('/ws-stomp'),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      onConnect: () => {
        console.log('Connected to WS');
        client.subscribe(topic, (message) => {
          if (onMessageRef.current) {
            onMessageRef.current(JSON.parse(message.body));
          }
        });
      },
      onStompError: (frame) => {
        console.error('WS Error', frame);
      }
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [token, topic]);

  const sendMessage = (destination: string, body: any) => {
    if (clientRef.current && clientRef.current.connected) {
      clientRef.current.publish({
        destination,
        body: JSON.stringify(body)
      });
    }
  };

  return { sendMessage };
};
