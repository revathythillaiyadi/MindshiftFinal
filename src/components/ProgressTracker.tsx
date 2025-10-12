import { useState, useEffect } from 'react';
import { TrendingUp, Calendar, MessageCircle, SmilePlus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type Stats = {
  totalMessages: number;
  totalMoods: number;
  weekActivity: number[];
};

export function ProgressTracker() {
  const [stats, setStats] = useState<Stats>({
    totalMessages: 0,
    totalMoods: 0,
    weekActivity: [0, 0, 0, 0, 0, 0, 0],
  });
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    if (!user) return;

    const { data: messages } = await supabase
      .from('chat_messages')
      .select('created_at')
      .eq('user_id', user.id);

    const { data: moods } = await supabase
      .from('mood_logs')
      .select('created_at')
      .eq('user_id', user.id);

    const weekActivity = Array(7).fill(0);
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6);

    messages?.forEach((msg) => {
      const msgDate = new Date(msg.created_at);
      if (msgDate >= sevenDaysAgo) {
        const dayIndex = Math.floor((msgDate.getTime() - sevenDaysAgo.getTime()) / (1000 * 60 * 60 * 24));
        if (dayIndex >= 0 && dayIndex < 7) {
          weekActivity[dayIndex]++;
        }
      }
    });

    setStats({
      totalMessages: messages?.length || 0,
      totalMoods: moods?.length || 0,
      weekActivity,
    });
  };

  const maxActivity = Math.max(...stats.weekActivity, 1);
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const today = new Date().getDay();

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800">Your Progress</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-pink-100 to-pink-50 rounded-2xl p-4 cursor-pointer hover:shadow-md transition-all active:scale-[0.98]">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="w-4 h-4 text-pink-500" />
            <span className="text-xs font-medium text-gray-600">Reflections</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.totalMessages}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl p-4 cursor-pointer hover:shadow-md transition-all active:scale-[0.98]">
          <div className="flex items-center gap-2 mb-2">
            <SmilePlus className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-medium text-gray-600">Mood Logs</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.totalMoods}</p>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-600">This Week</span>
        </div>
        <div className="flex justify-between items-end gap-2 h-24">
          {stats.weekActivity.map((count, index) => {
            const height = (count / maxActivity) * 100;
            const isToday = index === today;
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="relative w-full h-20 flex items-end">
                  <div
                    className={`w-full rounded-lg transition-all hover:scale-105 cursor-pointer ${
                      isToday
                        ? 'bg-gradient-to-t from-pink-500 via-purple-500 to-blue-500'
                        : 'bg-gradient-to-t from-pink-300 via-purple-300 to-blue-300 opacity-60'
                    }`}
                    style={{ height: `${Math.max(height, 8)}%` }}
                  >
                    {count > 0 && (
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-600">
                        {count}
                      </div>
                    )}
                  </div>
                </div>
                <span className={`text-xs font-medium ${isToday ? 'text-pink-500' : 'text-gray-400'}`}>
                  {days[index]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
