import React from 'react';
import { Clock, Users, Trophy, Bot } from 'lucide-react';

interface GameStatusProps {
  game: any;
  status: string;
}

const GameStatus: React.FC<GameStatusProps> = ({ game, status }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'text-yellow-400 bg-yellow-900/30';
      case 'starting': return 'text-orange-400 bg-orange-900/30';
      case 'in-progress': return 'text-green-400 bg-green-900/30';
      case 'finished': return 'text-gray-400 bg-gray-700';
      default: return 'text-gray-400 bg-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'waiting': return 'Waiting for players';
      case 'starting': return 'Game starting...';
      case 'in-progress': return 'In progress';
      case 'finished': return 'Game finished';
      default: return 'Unknown';
    }
  };

  return (
    <div className="flex items-center gap-6">
      {/* Game Status */}
      <div className="flex items-center gap-2">
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
          {getStatusText(status)}
        </div>
      </div>

      {/* Players */}
      <div className="flex items-center gap-3">
        <Users className="h-4 w-4 text-gray-400" />
        <div className="flex items-center gap-2">
          {game.players?.map((player: any, index: number) => (
            <div key={index} className="flex items-center gap-1 text-sm">
              {player.isBot && <Bot className="h-3 w-3 text-orange-400" />}
              <span className="text-white font-medium">{player.username}</span>
              <span className="text-gray-400">({player.rating})</span>
              {index < game.players.length - 1 && (
                <span className="text-gray-500 mx-2">vs</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Current Scores */}
      {status === 'in-progress' && game.scores && (
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-400" />
          <div className="flex items-center gap-3 text-sm">
            {Array.from(game.scores.entries()).map(([playerId, score]) => {
              const player = game.players?.find((p: any) => p.userId === playerId);
              return (
                <span key={playerId} className="text-white">
                  {player?.username}: <span className="text-blue-400 font-bold">{score}%</span>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameStatus;