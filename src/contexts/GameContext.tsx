import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import io, { Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface GameContextType {
  socket: Socket | null;
  currentGame: any;
  gameStatus: string;
  isInQueue: boolean;
  queuePosition: number;
  joinQueue: (preferences: any) => void;
  leaveQueue: () => void;
  joinGame: (gameId: string) => void;
  spectateGame: (gameId: string) => void;
  submitCode: (code: string, language: string) => void;
  sendChatMessage: (message: string) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentGame, setCurrentGame] = useState<any>(null);
  const [gameStatus, setGameStatus] = useState('idle');
  const [isInQueue, setIsInQueue] = useState(false);
  const [queuePosition, setQueuePosition] = useState(0);

  // Initialize socket connection
  useEffect(() => {
    if (user && token) {
      const newSocket = io('http://localhost:3001', {
        auth: { token }
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
        setSocket(newSocket);
      });

      newSocket.on('queueJoined', (data) => {
        setIsInQueue(true);
        setQueuePosition(data.position);
      });

      newSocket.on('queueLeft', () => {
        setIsInQueue(false);
        setQueuePosition(0);
      });

      newSocket.on('gameState', (gameState) => {
        setCurrentGame(gameState);
        setGameStatus(gameState.status);
      });

      newSocket.on('gameStarting', (data) => {
        setGameStatus('starting');
        setCurrentGame(prevGame => ({ ...prevGame, ...data }));
      });

      newSocket.on('gameStarted', (data) => {
        setGameStatus('in-progress');
        setIsInQueue(false);
      });

      newSocket.on('gameEnded', (data) => {
        setGameStatus('finished');
        setCurrentGame(prevGame => ({ ...prevGame, ...data }));
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setSocket(null);
      });

      return () => {
        newSocket.close();
      };
    }
  }, [user, token]);

  const joinQueue = (preferences: any) => {
    if (socket) {
      socket.emit('joinQueue', preferences);
    }
  };

  const leaveQueue = () => {
    if (socket) {
      socket.emit('leaveQueue');
    }
  };

  const joinGame = (gameId: string) => {
    if (socket) {
      socket.emit('joinGame', gameId);
    }
  };

  const spectateGame = (gameId: string) => {
    if (socket) {
      socket.emit('spectateGame', gameId);
    }
  };

  const submitCode = (code: string, language: string) => {
    if (socket && currentGame) {
      socket.emit('submitCode', {
        gameId: currentGame.id,
        code,
        language
      });
    }
  };

  const sendChatMessage = (message: string) => {
    if (socket && currentGame) {
      socket.emit('chatMessage', {
        gameId: currentGame.id,
        message
      });
    }
  };

  return (
    <GameContext.Provider value={{
      socket,
      currentGame,
      gameStatus,
      isInQueue,
      queuePosition,
      joinQueue,
      leaveQueue,
      joinGame,
      spectateGame,
      submitCode,
      sendChatMessage
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};