import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Trophy, Medal, Crown, TrendingUp, Users, Calendar } from 'lucide-react';
import axios from 'axios';

interface LeaderboardPlayer {
  rank: number;
  username: string;
  rating: number;
  gamesPlayed: number;
  winRate: number;
}

const Leaderboard: React.FC = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all');

  useEffect(() => {
    fetchLeaderboard();
  }, [timeFilter]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/games/leaderboard/top?limit=50&period=${timeFilter}`);
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-5 w-5 text-yellow-400" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Medal className="h-5 w-5 text-orange-600" />;
      default: return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-400">#{rank}</span>;
    }
  };

  const getRankBackground = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30';
      case 2: return 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/30';
      case 3: return 'bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/30';
      default: return 'bg-gray-800 border-gray-700';
    }
  };

  const getUserRank = () => {
    return leaderboard.findIndex(player => player.username === user?.username) + 1;
  };

  const formatRating = (rating: number) => {
    if (rating >= 2400) return { text: 'Grandmaster', color: 'text-red-400' };
    if (rating >= 2100) return { text: 'International Master', color: 'text-purple-400' };
    if (rating >= 1900) return { text: 'Master', color: 'text-blue-400' };
    if (rating >= 1600) return { text: 'Expert', color: 'text-green-400' };
    if (rating >= 1200) return { text: 'Specialist', color: 'text-yellow-400' };
    return { text: 'Newbie', color: 'text-gray-400' };
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="h-8 w-8 text-yellow-400" />
            <h1 className="text-4xl font-bold text-white">Leaderboard</h1>
          </div>
          <p className="text-gray-400 text-lg">Top competitive programmers in the arena</p>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-8">
          <div className="flex items-center gap-4">
            <label className="text-white font-medium">Time Period:</label>
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'All Time' },
                { value: 'month', label: 'This Month' },
                { value: 'week', label: 'This Week' }
              ].map(filter => (
                <button
                  key={filter.value}
                  onClick={() => setTimeFilter(filter.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    timeFilter === filter.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Your Rank Card */}
        {user && !loading && (
          <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-xl border border-blue-500/30 p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">{user.username.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold">{user.username}</h3>
                  <p className={`text-sm ${formatRating(user.rating).color}`}>
                    {formatRating(user.rating).text}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">#{getUserRank() || '--'}</div>
                <div className="text-sm text-gray-400">{user.rating} rating</div>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top Players
            </h2>
          </div>

          {loading ? (
            <div className="p-6">
              <div className="space-y-3">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="animate-pulse h-16 bg-gray-700 rounded-lg"></div>
                ))}
              </div>
            </div>
          ) : leaderboard.length > 0 ? (
            <div className="divide-y divide-gray-700">
              {leaderboard.map((player, index) => (
                <div
                  key={player.username}
                  className={`px-6 py-4 transition-colors hover:bg-gray-700/50 ${getRankBackground(player.rank)} ${
                    player.username === user?.username ? 'ring-2 ring-blue-500/50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className="w-8 flex justify-center">
                        {getRankIcon(player.rank)}
                      </div>

                      {/* Player Info */}
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-white ${
                          player.rank === 1 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                          player.rank === 2 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                          player.rank === 3 ? 'bg-gradient-to-r from-orange-500 to-red-500' :
                          'bg-gradient-to-r from-blue-500 to-purple-600'
                        }`}>
                          {player.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-semibold">{player.username}</span>
                            {player.username === user?.username && (
                              <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">You</span>
                            )}
                          </div>
                          <span className={`text-sm ${formatRating(player.rating).color}`}>
                            {formatRating(player.rating).text}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <div className="text-xl font-bold text-white">{player.rating}</div>
                        <div className="text-xs text-gray-400">Rating</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-green-400">{player.winRate}%</div>
                        <div className="text-xs text-gray-400">Win Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-blue-400">{player.gamesPlayed}</div>
                        <div className="text-xs text-gray-400">Games</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-12">
              <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-600" />
              <p className="text-lg">No players on the leaderboard yet</p>
              <p className="text-sm">Be the first to compete and claim the top spot!</p>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        {!loading && leaderboard.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-3">
                <Crown className="h-6 w-6 text-yellow-400" />
                <h3 className="text-white font-semibold">Top Player</h3>
              </div>
              <div className="text-2xl font-bold text-white">{leaderboard[0]?.username}</div>
              <div className="text-sm text-gray-400">{leaderboard[0]?.rating} rating</div>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-3">
                <TrendingUp className="h-6 w-6 text-green-400" />
                <h3 className="text-white font-semibold">Highest Rating</h3>
              </div>
              <div className="text-2xl font-bold text-white">
                {Math.max(...leaderboard.map(p => p.rating))}
              </div>
              <div className="text-sm text-gray-400">Peak performance</div>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-3">
                <Users className="h-6 w-6 text-blue-400" />
                <h3 className="text-white font-semibold">Total Players</h3>
              </div>
              <div className="text-2xl font-bold text-white">{leaderboard.length}</div>
              <div className="text-sm text-gray-400">Active competitors</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;