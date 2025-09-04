import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../../contexts/GameContext';
import { useAuth } from '../../contexts/AuthContext';
import MonacoEditor from '../game/MonacoEditor';
import ProblemPanel from '../game/ProblemPanel';
import GameStatus from '../game/GameStatus';
import ChatPanel from '../game/ChatPanel';
import { Eye, Users, ArrowLeft, Play, Trophy, Clock } from 'lucide-react';
import axios from 'axios';

interface PlayerCode {
  playerId: string;
  username: string;
  code: string;
  language: string;
  lastUpdate: number;
}

const Spectator: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { socket, spectateGame, currentGame } = useGame();
  const { user } = useAuth();
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [playerCodes, setPlayerCodes] = useState<Map<string, PlayerCode>>(new Map());
  const [gameData, setGameData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [spectatorCount, setSpectatorCount] = useState(0);

  useEffect(() => {
    if (gameId) {
      fetchGameDetails();
      spectateGame(gameId);
    }
  }, [gameId]);

  useEffect(() => {
    if (!socket) return;

    const handlePlayerCodeUpdate = (data: any) => {
      setPlayerCodes(prev => new Map(prev.set(data.playerId, {
        playerId: data.playerId,
        username: data.username,
        code: data.code,
        language: data.language || 'javascript',
        lastUpdate: data.timestamp
      })));
    };

    const handleSpectatorJoined = (data: any) => {
      setCurrentGame(data);
      setLoading(false);
      if (data.players && data.players.length > 0 && !selectedPlayer) {
        setSelectedPlayer(data.players[0].userId);
      }
    };

    const handleGameState = (data: any) => {
      setGameData(data);
      setLoading(false);
    };

    const handleSpectatorUpdate = (data: any) => {
      setSpectatorCount(data.count);
    };

    socket.on('playerCodeUpdate', handlePlayerCodeUpdate);
    socket.on('spectatorJoined', handleSpectatorJoined);
    socket.on('gameState', handleGameState);
    socket.on('spectatorUpdate', handleSpectatorUpdate);

    return () => {
      socket.off('playerCodeUpdate', handlePlayerCodeUpdate);
      socket.off('spectatorJoined', handleSpectatorJoined);
      socket.off('gameState', handleGameState);
      socket.off('spectatorUpdate', handleSpectatorUpdate);
    };
  }, [socket, selectedPlayer]);

  const fetchGameDetails = async () => {
    try {
      const response = await axios.get(`/api/games/${gameId}`);
      setGameData(response.data);
      
      if (response.data.players && response.data.players.length > 0) {
        setSelectedPlayer(response.data.players[0].userId || response.data.players[0].username);
      }
    } catch (error) {
      console.error('Error fetching game details:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPlayerCode = () => {
    const playerCode = playerCodes.get(selectedPlayer);
    return playerCode?.code || '// Waiting for player to start coding...';
  };

  const getCurrentLanguage = () => {
    const playerCode = playerCodes.get(selectedPlayer);
    return playerCode?.language || 'javascript';
  };

  const getSelectedPlayerName = () => {
    const player = gameData?.players?.find((p: any) => 
      p.userId === selectedPlayer || p.username === selectedPlayer
    );
    return player?.username || 'Unknown Player';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading game...</p>
        </div>
      </div>
    );
  }

  if (!gameData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">
            <Trophy className="h-16 w-16 mx-auto mb-3" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Game Not Found</h2>
          <p className="text-gray-400 mb-6">The game you're looking for doesn't exist or has ended.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg font-medium transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col overflow-hidden">
      {/* Spectator Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-700 rounded"
              title="Back to Dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-purple-400" />
              <h1 className="text-xl font-semibold text-white">
                Spectating: {gameData.problemId?.title || 'Coding Challenge'}
              </h1>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Users className="h-4 w-4" />
              <span>{spectatorCount} watching</span>
            </div>
          </div>

          <GameStatus game={gameData} status={gameData.status} />
        </div>

        {/* Player Tabs */}
        <div className="flex items-center gap-2 mt-4">
          <span className="text-sm text-gray-400 mr-2">Watching:</span>
          {gameData.players?.map((player: any) => (
            <button
              key={player.userId || player.username}
              onClick={() => setSelectedPlayer(player.userId || player.username)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                selectedPlayer === (player.userId || player.username)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
              }`}
            >
              {player.isBot && <div className="h-2 w-2 bg-orange-400 rounded-full"></div>}
              <span>{player.username}</span>
              <span className="text-xs opacity-75">({player.rating})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Spectator Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Problem Panel */}
        <div className="w-1/4 bg-gray-800 border-r border-gray-700 overflow-y-auto">
          <ProblemPanel problem={gameData.problemId} />
        </div>

        {/* Code Viewer */}
        <div className="flex-1 flex flex-col">
          {/* Editor Header */}
          <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h3 className="text-white font-medium">
                  {getSelectedPlayerName()}'s Code
                </h3>
                <span className="text-sm text-gray-400">
                  Language: {getCurrentLanguage()}
                </span>
              </div>
              
              {playerCodes.has(selectedPlayer) && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Live</span>
                </div>
              )}
            </div>
          </div>

          {/* Monaco Editor (Read-only) */}
          <div className="flex-1">
            <MonacoEditor
              value={getCurrentPlayerCode()}
              onChange={() => {}} // Read-only
              language={getCurrentLanguage()}
              theme="vs-dark"
              readonly={true}
            />
          </div>

          {/* Player Stats */}
          <div className="h-20 bg-gray-800 border-t border-gray-700 px-4 py-3">
            <div className="flex justify-between items-center h-full">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-400">
                    {gameData.scores?.get(selectedPlayer) || 0}%
                  </div>
                  <div className="text-xs text-gray-400">Score</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-bold text-green-400">
                    {gameData.submissions?.filter((s: any) => s.playerId === selectedPlayer).length || 0}
                  </div>
                  <div className="text-xs text-gray-400">Submissions</div>
                </div>

                <div className="text-center">
                  <div className="text-lg font-bold text-purple-400">
                    {getCurrentLanguage().toUpperCase()}
                  </div>
                  <div className="text-xs text-gray-400">Language</div>
                </div>
              </div>

              {gameData.status === 'in-progress' && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-400">
                    {playerCodes.has(selectedPlayer) 
                      ? `Last update: ${new Date(playerCodes.get(selectedPlayer)!.lastUpdate).toLocaleTimeString()}`
                      : 'No recent activity'
                    }
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Spectator Info Panel */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          {/* Live Scores */}
          <div className="border-b border-gray-700 p-4">
            <h3 className="text-white font-medium mb-3 flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Live Scores
            </h3>
            <div className="space-y-2">
              {gameData.players?.map((player: any, index: number) => {
                const score = gameData.scores?.get(player.userId) || 0;
                const isSelected = selectedPlayer === (player.userId || player.username);
                
                return (
                  <div
                    key={player.userId || player.username}
                    className={`p-3 rounded-lg transition-colors cursor-pointer ${
                      isSelected ? 'bg-blue-900/50 border border-blue-500' : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                    onClick={() => setSelectedPlayer(player.userId || player.username)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-yellow-500 text-black' :
                          index === 1 ? 'bg-gray-500 text-white' :
                          'bg-blue-600 text-white'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="text-white text-sm font-medium flex items-center gap-1">
                            {player.username}
                            {player.isBot && <div className="h-2 w-2 bg-orange-400 rounded-full"></div>}
                          </div>
                          <div className="text-xs text-gray-400">{player.rating} rating</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-400">{score}%</div>
                        <div className="text-xs text-gray-400">
                          {gameData.submissions?.filter((s: any) => s.playerId === player.userId).length || 0} runs
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chat Panel */}
          <div className="flex-1">
            <ChatPanel gameId={gameId || ''} />
          </div>

          {/* Spectator Actions */}
          <div className="border-t border-gray-700 p-4">
            <div className="space-y-3">
              <button
                onClick={() => navigate('/play')}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Play className="h-4 w-4" />
                Join a Game
              </button>
              
              <button
                onClick={() => navigate('/leaderboard')}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Trophy className="h-4 w-4" />
                View Rankings
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-700 text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                <Eye className="h-4 w-4" />
                <span>{spectatorCount} spectators</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Spectator;