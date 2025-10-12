import { useState, useEffect } from 'react';
import { Smile, Frown, Meh, SmilePlus, Heart } from 'lucide-react';
import { supabase, MoodLog } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const moods = [
  { value: 1, label: 'Very Low', icon: Frown, color: '#FF6B6B' },
  { value: 2, label: 'Low', icon: Frown, color: '#FFA07A' },
  { value: 3, label: 'Okay', icon: Meh, color: '#FFD93D' },
  { value: 4, label: 'Good', icon: Smile, color: '#A8D5BA' },
  { value: 5, label: 'Great', icon: Heart, color: '#6BCF7F' },
];

export function MoodTracker() {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [recentMoods, setRecentMoods] = useState<MoodLog[]>([]);
  const [showForm, setShowForm] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadRecentMoods();
    }
  }, [user]);

  const loadRecentMoods = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('mood_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(7);

    if (data) {
      setRecentMoods(data);
    }
  };

  const saveMood = async () => {
    if (!user || selectedMood === null) return;

    const mood = moods.find((m) => m.value === selectedMood);
    if (!mood) return;

    await supabase.from('mood_logs').insert({
      user_id: user.id,
      mood_value: selectedMood,
      mood_label: mood.label,
      notes: notes.trim() || null,
    });

    setSelectedMood(null);
    setNotes('');
    setShowForm(false);
    loadRecentMoods();
  };

  const averageMood = recentMoods.length > 0
    ? recentMoods.reduce((sum, log) => sum + log.mood_value, 0) / recentMoods.length
    : 0;

  const averageMoodData = moods.find((m) => m.value === Math.round(averageMood));

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#B4C7E7] to-[#A8D5BA] rounded-xl flex items-center justify-center">
            <SmilePlus className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Mood Tracker</h3>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-sm font-medium text-[#A8D5BA] hover:text-[#B4C7E7] transition-colors"
          >
            Log Mood
          </button>
        )}
      </div>

      {showForm ? (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-3">How are you feeling?</p>
            <div className="flex justify-between gap-2">
              {moods.map((mood) => {
                const Icon = mood.icon;
                const isSelected = selectedMood === mood.value;
                return (
                  <button
                    key={mood.value}
                    onClick={() => setSelectedMood(mood.value)}
                    className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${
                      isSelected
                        ? 'bg-gradient-to-br from-[#A8D5BA]/20 to-[#B4C7E7]/20 shadow-md'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <Icon
                      className="w-6 h-6"
                      style={{ color: isSelected ? mood.color : '#9CA3AF' }}
                    />
                    <span className="text-xs text-gray-600 text-center">{mood.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 mb-2 block">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What's contributing to this mood?"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A8D5BA] focus:border-transparent text-sm resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowForm(false);
                setSelectedMood(null);
                setNotes('');
              }}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={saveMood}
              disabled={selectedMood === null}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-[#A8D5BA] to-[#B4C7E7] text-white rounded-xl hover:shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium"
            >
              Save Mood
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {recentMoods.length > 0 && (
            <div className="bg-gradient-to-br from-[#B4C7E7]/10 to-[#A8D5BA]/10 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">7-Day Average</p>
                  <p className="text-lg font-bold text-gray-800">{averageMoodData?.label || 'N/A'}</p>
                </div>
                {averageMoodData && (
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${averageMoodData.color}20` }}
                  >
                    <averageMoodData.icon className="w-6 h-6" style={{ color: averageMoodData.color }} />
                  </div>
                )}
              </div>
            </div>
          )}

          {recentMoods.length > 0 ? (
            <div>
              <p className="text-sm font-medium text-gray-600 mb-3">Recent Moods</p>
              <div className="flex justify-between items-end gap-2 h-24">
                {recentMoods.slice(0, 7).reverse().map((log) => {
                  const mood = moods.find((m) => m.value === log.mood_value);
                  const height = (log.mood_value / 5) * 100;
                  return (
                    <div key={log.id} className="flex-1 flex flex-col items-center gap-2">
                      <div className="relative w-full h-20 flex items-end">
                        <div
                          className="w-full rounded-lg transition-all"
                          style={{
                            height: `${Math.max(height, 15)}%`,
                            backgroundColor: mood?.color || '#9CA3AF',
                            opacity: 0.7,
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(log.created_at).getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">Start tracking your mood to see patterns</p>
          )}
        </div>
      )}
    </div>
  );
}
