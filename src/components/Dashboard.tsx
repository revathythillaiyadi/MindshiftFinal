import { LogOut, Brain } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ChatBot } from './ChatBot';
import { ProgressTracker } from './ProgressTracker';
import { StreaksAndAchievements } from './StreaksAndAchievements';
import { MoodTracker } from './MoodTracker';

export function Dashboard() {
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-pink-400 opacity-10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-400 opacity-10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-400 opacity-10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <nav className="relative bg-white/60 backdrop-blur-md border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-semibold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
              Mindshift
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-700">{profile?.display_name || 'User'}</p>
              <p className="text-xs text-gray-500">{profile?.email}</p>
            </div>
            <button
              onClick={signOut}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors active:scale-95"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </nav>

      <div className="relative max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="space-y-6">
          <div className="h-[600px]">
            <ChatBot />
          </div>

          <StreaksAndAchievements />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProgressTracker />
            <MoodTracker />
          </div>
        </div>
      </div>
    </div>
  );
}
