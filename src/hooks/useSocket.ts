import { useEffect } from 'react';
import { socketService } from '../services/socket';

export const useSocket = (token?: string) => {
  useEffect(() => {
    if (token) {
      socketService.connect(token);
    }

    return () => {
      socketService.disconnect();
    };
  }, [token]);

  const emit = (event: string, data: any) => {
    socketService.emit(event, data);
  };

  const on = (event: string, callback: (data: any) => void) => {
    socketService.on(event, callback);
  };

  const off = (event: string) => {
    socketService.off(event);
  };

  return {
    emit,
    on,
    off,
    isConnected: socketService.isConnected(),
  };
};