import React, { useState, useEffect } from 'react';
import { Trophy, Award, Star, Zap, Target, Crown, Medal, TrendingUp } from 'lucide-react';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  requirement: number;
  currentProgress: number;
  unlocked: boolean;
}

interface LeaderboardUser {
  id: string;
  name: string;
  points: number;
  level: number;
  badges: number;
  avatar?: string;
}

export default function Gamification() {
  const [activeTab, setActiveTab] = useState<'badges' | 'leaderboard'>('badges');
  const [userPoints, setUserPoints] = useState(1250);
  const [userLevel, setUserLevel] = useState(5);

  const badges: Badge[] = [
    {
      id: 'first-ticket',
      name: 'First Step',
      description: 'Create your first ticket',
      icon: Ticket,
      color: 'bg-blue-500',
      requirement: 1,
      currentProgress: 1,
      unlocked: true,
    },
    {
      id: 'ticket-master',
      name: 'Ticket Master',
      description: 'Resolve 10 tickets',
      icon: Star,
      color: 'bg-yellow-500',
      requirement: 10,
      currentProgress: 7,
      unlocked: false,
    },
    {
      id: 'asset-guardian',
      name: 'Asset Guardian',
      description: 'Add 20 assets to the system',
      icon: Award,
      color: 'bg-green-500',
      requirement: 20,
      currentProgress: 15,
      unlocked: false,
    },
    {
      id: 'speed-demon',
      name: 'Speed Demon',
      description: 'Resolve a ticket in under 1 hour',
      icon: Zap,
      color: 'bg-orange-500',
      requirement: 1,
      currentProgress: 1,
      unlocked: true,
    },
    {
      id: 'team-player',
      name: 'Team Player',
      description: 'Help 5 different users',
      icon: Users,
      color: 'bg-purple-500',
      requirement: 5,
      currentProgress: 3,
      unlocked: false,
    },
    {
      id: 'perfectionist',
      name: 'Perfectionist',
      description: 'Get 10 perfect satisfaction ratings',
      icon: Target,
      color: 'bg-pink-500',
      requirement: 10,
      currentProgress: 8,
      unlocked: false,
    },
    {
      id: 'travel-pro',
      name: 'Travel Pro',
      description: 'Plan 5 successful trips',
      icon: MapPin,
      color: 'bg-indigo-500',
      requirement: 5,
      currentProgress: 3,
      unlocked: false,
    },
    {
      id: 'legend',
      name: 'Legend',
      description: 'Reach level 10',
      icon: Crown,
      color: 'bg-yellow-600',
      requirement: 10,
      currentProgress: 5,
      unlocked: false,
    },
  ];

  const leaderboard: LeaderboardUser[] = [
    { id: '1', name: 'John Smith', points: 2500, level: 8, badges: 12 },
    { id: '2', name: 'Sarah Johnson', points: 2200, level: 7, badges: 10 },
    { id: '3', name: 'Mike Brown', points: 1800, level: 6, badges: 9 },
    { id: '4', name: 'You', points: userPoints, level: userLevel, badges: badges.filter(b => b.unlocked).length },
    { id: '5', name: 'Emma Davis', points: 1100, level: 5, badges: 7 },
    { id: '6', name: 'Chris Wilson', points: 900, level: 4, badges: 6 },
    { id: '7', name: 'Lisa Anderson', points: 750, level: 4, badges: 5 },
    { id: '8', name: 'Tom Martinez', points: 600, level: 3, badges: 4 },
  ].sort((a, b) => b.points - a.points);

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-orange-600';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5" />;
    if (rank === 2) return <Medal className="w-5 h-5" />;
    if (rank === 3) return <Award className="w-5 h-5" />;
    return <span className="text-sm font-semibold">{rank}</span>;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Achievements & Rankings
        </h3>

        {/* User Stats */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{userPoints}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Points</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">Level {userLevel}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {Math.floor((userPoints % 500) / 5)}% to next
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('badges')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'badges'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Badges ({badges.filter(b => b.unlocked).length}/{badges.length})
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'leaderboard'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Leaderboard
        </button>
      </div>

      {/* Content */}
      {activeTab === 'badges' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {badges.map((badge) => {
            const Icon = badge.icon;
            const progress = Math.min((badge.currentProgress / badge.requirement) * 100, 100);

            return (
              <div
                key={badge.id}
                className={`relative p-4 rounded-lg border-2 transition-all ${
                  badge.unlocked
                    ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 opacity-75'
                }`}
              >
                {badge.unlocked && (
                  <div className="absolute top-2 right-2">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  </div>
                )}

                <div className={`${badge.color} w-12 h-12 rounded-full flex items-center justify-center mb-3 mx-auto ${
                  !badge.unlocked && 'opacity-50'
                }`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                <h4 className="font-semibold text-sm text-center text-gray-900 dark:text-white mb-1">
                  {badge.name}
                </h4>
                <p className="text-xs text-center text-gray-600 dark:text-gray-400 mb-3">
                  {badge.description}
                </p>

                {!badge.unlocked && (
                  <div>
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                      <span>{badge.currentProgress}/{badge.requirement}</span>
                      <span>{Math.floor(progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className={`${badge.color} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((user, index) => {
            const rank = index + 1;
            const isCurrentUser = user.name === 'You';

            return (
              <div
                key={user.id}
                className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                  isCurrentUser
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                    : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {/* Rank */}
                <div className={`w-8 flex items-center justify-center ${getRankColor(rank)}`}>
                  {getRankIcon(rank)}
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                  {user.name.charAt(0)}
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {user.name}
                    {isCurrentUser && (
                      <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                        You
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Level {user.level} • {user.badges} badges
                  </div>
                </div>

                {/* Points */}
                <div className="text-right">
                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {user.points.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">points</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Missing imports - add these at the top
import { Ticket, Users, MapPin } from 'lucide-react';
