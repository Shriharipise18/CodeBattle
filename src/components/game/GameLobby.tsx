import React, { useState, useEffect } from 'react';
import { useGame } from '../../contexts/GameContext';
import { Play, Users, Clock, Settings, Bot } from 'lucide-react';
import axios from 'axios';

const GameLobby: React.FC = () => {
  const { isInQueue, queuePosition, joinQueue, leaveQueue } = useGame();
  const [preferences, setPreferences] = useState({
    difficulty: 'medium',
    gameMode: 'ranked',
    language: 'javascript'
  });
  const [activeGames, setActiveGames] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchActiveGames();
    const interval = setInterval(fetchActiveGames, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveGames = async () => {
    try {
      const response = await axios.get('/api/games/active/list');
      setActiveGames(response.data);
    } catch (error) {
      console.error('Error fetching active games:', error);
    }
  };

  const handleJoinQueue = () => {
    setLoading(true);
    joinQueue(preferences);
    setTimeout(() => setLoading(false), 1000);
  };

  const handleLeaveQueue = () => {
    leaveQueue();
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Game Lobby</h1>
          <p className="text-gray-400 text-lg">Choose your battle and prove your coding skills</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Matchmaking Section */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Quick Match
                </h2>
              </div>

              <div className="p-6">
                {/* Game Preferences */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Difficulty
                    </label>
                    <select
                      value={preferences.difficulty}
                      onChange={(e) => setPreferences(prev => ({ ...prev, difficulty: e.target.value }))}
                      disabled={isInQueue}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Game Mode
                    </label>
                    <select
                      value={preferences.gameMode}
                      onChange={(e) => setPreferences(prev => ({ ...prev, gameMode: e.target.value }))}
                      disabled={isInQueue}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="ranked">Ranked</option>
                      <option value="casual">Casual</option>
                      <option value="practice">Practice vs AI</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Language
                    </label>
                    <select
                      value={preferences.language}
                      onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
                      disabled={isInQueue}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                      <option value="c">C</option>
                    </select>
                  </div>
                </div>

                {/* Queue Status or Join Button */}
                {isInQueue ? (
                  <div className="text-center">
                    <div className="bg-blue-900/30 border border-blue-500 rounded-xl p-6 mb-4">
                      <div className="animate-pulse mb-3">
                        <Clock className="h-8 w-8 text-blue-400 mx-auto" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Searching for opponent...
                      </h3>
                      <p className="text-gray-400">
                        Queue position: {queuePosition}
                      </p>
                      <div className="mt-4">
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleLeaveQueue}
                      className="bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                    >
                      Cancel Search
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <button
                      onClick={handleJoinQueue}
                      disabled={loading}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 px-8 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-3 mx-auto"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <Play className="h-6 w-6" />
                          Find Match
                        </>
                      )}
                    </button>
                    
                    <p className="text-gray-400 mt-3">
                      {preferences.difficulty} • {preferences.gameMode} • {preferences.language}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active Games (Spectate) */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Users className="h-5 w-5" />
                Live Games
              </h2>
            </div>

            <div className="p-6">
              {activeGames.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {activeGames.map((game: any) => (
                    <div key={game.gameId} className="bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="text-white font-medium text-sm">{game.problemId?.title}</h4>
                          <p className="text-gray-400 text-xs">{game.problemId?.difficulty}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          game.status === 'in-progress' ? 'bg-green-600 text-white' :
                          game.status === 'starting' ? 'bg-yellow-600 text-white' :
                          'bg-gray-600 text-gray-300'
                        }`}>
                          {game.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          {game.players.map((player: any, i: number) => (
                            <span key={i} className="flex items-center gap-1">
                              {player.isBot && <Bot className="h-3 w-3" />}
                              {player.username}
                              {i < game.players.length - 1 && <span className="mx-1">vs</span>}
                            </span>
                          ))}
                        </div>
                        
                        <button className="text-blue-400 hover:text-blue-300 text-xs font-medium">
                          Watch
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <Users className="h-12 w-12 mx-auto mb-3 text-gray-600" />
                  <p>No active games</p>
                  <p className="text-sm">Be the first to start a match!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameLobby;