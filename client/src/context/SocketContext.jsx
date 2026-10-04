import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      const newSocket = io(window.location.origin, {
        transports: ['websocket', 'polling'],
      });

      newSocket.on('connect', () => {
        setConnected(true);
        newSocket.emit('join:user', user._id);
      });

      newSocket.on('disconnect', () => {
        setConnected(false);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [isAuthenticated, user?._id]);

  const joinCenter = (centerId) => {
    if (socket) socket.emit('join:center', centerId);
  };

  const leaveCenter = (centerId) => {
    if (socket) socket.emit('leave:center', centerId);
  };

  return (
    <SocketContext.Provider value={{ socket, connected, joinCenter, leaveCenter }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
};
