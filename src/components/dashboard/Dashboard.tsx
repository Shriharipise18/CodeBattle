import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useGame } from '../../contexts/GameContext';
import { Play, Clock, Target, Trophy, TrendingUp, Users } from 'lucide-react';
import axios from 'axios';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { isInQueue, queuePosition, joinQueue, leaveQueue } = useGame();
  const [recentGames, setRecentGames] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [gamesRes, leaderboardRes] = await Promise.all([
          axios.get('/api/games/history?limit=5'),
          axios.get('/api/games/leaderboard/top?limit=10')
        ]);

        setRecentGames(gamesRes.data.games);
        setLeaderboard(leaderboardRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleQuickPlay = () => {
    if (isInQueue) {
      leaveQueue();
    } else {
      joinQueue({
        difficulty: 'medium',
        gameMode: 'ranked'
      });
    }
  };

  const winRate = user?.gamesPlayed ? Math.round((user.gamesWon / user.gamesPlayed) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user?.username}!
          </h1>
          <p className="text-gray-400">Ready for your next coding challenge?</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Play className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-white font-semibold">Quick Play</h3>
            </div>
            <button
              onClick={handleQuickPlay}
              className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${
                isInQueue
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isInQueue ? 'Leave Queue' : 'Find Match'}
            </button>
            {isInQueue && (
              <p className="text-sm text-gray-400 mt-2">
                Position: {queuePosition}
              </p>
            )}
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-white font-semibold">Rating</h3>
            </div>
            <div className="text-2xl font-bold text-white">{user?.rating}</div>
            <div className="text-sm text-gray-400">Current ranking</div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-white font-semibold">Win Rate</h3>
            </div>
            <div className="text-2xl font-bold text-white">{winRate}%</div>
            <div className="text-sm text-gray-400">{user?.gamesWon}/{user?.gamesPlayed} games</div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 bg-orange-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-white font-semibold">Games Played</h3>
            </div>
            <div className="text-2xl font-bold text-white">{user?.gamesPlayed}</div>
            <div className="text-sm text-gray-400">Total matches</div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Games */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-white">Recent Games</h2>
              </div>
              
              <div className="p-6">
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse h-16 bg-gray-700 rounded-lg"></div>
                    ))}
                  </div>
                ) : recentGames.length > 0 ? (
                  <div className="space-y-3">
                    {recentGames.map((game: any, index) => (
                      <div key={index} className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-white font-medium">{game.problemId?.title || 'Unknown Problem'}</h3>
                            <p className="text-gray-400 text-sm">
                              {game.problemId?.difficulty} • {new Date(game.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-medium ${
                              game.winner?.toString() === user?.id ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {game.winner?.toString() === user?.id ? 'Won' : 'Lost'}
                            </div>
                            <div className="text-gray-400 text-sm">
                              {Math.round((game.finalScores?.find((s: any) => s.playerId === user?.id)?.score || 0))}%
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    <Clock className="h-12 w-12 mx-auto mb-3 text-gray-600" />
                    <p>No recent games</p>
                    <p className="text-sm">Start playing to see your match history!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Top Players */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">Top Players</h2>
            </div>
            
            <div className="p-6">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse h-12 bg-gray-700 rounded-lg"></div>
                  ))}
                </div>
              ) : leaderboard.length > 0 ? (
                <div className="space-y-3">
                  {leaderboard.slice(0, 5).map((player: any, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-yellow-500 text-black' :
                        index === 1 ? 'bg-gray-400 text-black' :
                        index === 2 ? 'bg-orange-600 text-white' :
                        'bg-gray-600 text-white'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-medium">{player.username}</div>
                        <div className="text-gray-400 text-sm">{player.rating} rating</div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-400 text-sm">{player.winRate}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <Users className="h-12 w-12 mx-auto mb-3 text-gray-600" />
                  <p>No players yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;