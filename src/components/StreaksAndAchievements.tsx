import { useState, useEffect } from 'react';
import { Flame, Trophy, Target, Plus, CheckCircle2, Circle } from 'lucide-react';
import { supabase, Achievement, Goal } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function StreaksAndAchievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const { user, profile } = useAuth();

  useEffect(() => {
    if (user) {
      loadAchievements();
      loadGoals();
    }
  }, [user]);

  const loadAchievements = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', user.id)
      .order('earned_at', { ascending: false })
      .limit(3);

    if (data) {
      setAchievements(data);
    }
  };

  const loadGoals = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('completed', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(5);

    if (data) {
      setGoals(data);
    }
  };

  const addGoal = async () => {
    if (!user || !newGoalTitle.trim()) return;

    await supabase.from('goals').insert({
      user_id: user.id,
      title: newGoalTitle.trim(),
    });

    setNewGoalTitle('');
    setShowAddGoal(false);
    loadGoals();
  };

  const toggleGoal = async (goal: Goal) => {
    await supabase
      .from('goals')
      .update({
        completed: !goal.completed,
        completed_at: !goal.completed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', goal.id);

    loadGoals();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center animate-pulse">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Streak</h3>
              <p className="text-xs text-gray-500">Keep it going!</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-800">{profile?.current_streak || 0}</p>
            <p className="text-xs text-gray-500">days</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-2xl p-4 cursor-pointer hover:shadow-md transition-all active:scale-[0.98]">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Longest Streak</span>
            <span className="text-lg font-bold text-gray-800">{profile?.longest_streak || 0} days</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Recent Achievements</h3>
        </div>

        {achievements.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Start your journey to unlock achievements</p>
        ) : (
          <div className="space-y-3">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">{achievement.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{achievement.title}</p>
                  <p className="text-xs text-gray-500 truncate">{achievement.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Goals</h3>
          </div>
          <button
            onClick={() => setShowAddGoal(true)}
            className="w-8 h-8 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 rounded-lg flex items-center justify-center hover:shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 text-white" />
          </button>
        </div>

        {showAddGoal && (
          <div className="mb-4 flex gap-2">
            <input
              type="text"
              value={newGoalTitle}
              onChange={(e) => setNewGoalTitle(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addGoal()}
              placeholder="Enter your goal..."
              className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent text-sm active:scale-[0.99]"
              autoFocus
            />
            <button
              onClick={addGoal}
              className="px-4 py-2 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white rounded-xl hover:shadow-md transition-all active:scale-95 text-sm font-medium"
            >
              Add
            </button>
          </div>
        )}

        {goals.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Set your first goal to get started</p>
        ) : (
          <div className="space-y-2">
            {goals.map((goal) => (
              <div
                key={goal.id}
                onClick={() => toggleGoal(goal)}
                className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl cursor-pointer transition-all group active:scale-[0.98]"
              >
                {goal.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-pink-500 flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-300 group-hover:text-pink-500 transition-colors flex-shrink-0" />
                )}
                <span className={`text-sm flex-1 ${goal.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                  {goal.title}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
