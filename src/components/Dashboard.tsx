import { LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ChatBot } from './ChatBot';
import { ProgressTracker } from './ProgressTracker';
import { StreaksAndAchievements } from './StreaksAndAchievements';
import { MoodTracker } from './MoodTracker';

export function Dashboard() {
  const { profile, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F9F6] via-[#FBF8F3] to-[#F0F4F8]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#A8D5BA] opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#B4C7E7] opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#E8D5B5] opacity-5 rounded-full blur-3xl"></div>
      </div>

      <nav className="relative bg-white/60 backdrop-blur-md border-b border-gray-100 px-6 py-4">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="text-2xl font-semibold bg-gradient-to-r from-[#A8D5BA] to-[#B4C7E7] bg-clip-text text-transparent">
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
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </nav>

      <div className="relative max-w-[1800px] mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <div className="h-[600px]">
              <ChatBot />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ProgressTracker />
              <MoodTracker />
            </div>
          </div>

          <div className={`
            lg:col-span-4
            fixed lg:relative inset-0 lg:inset-auto
            bg-[#F5F9F6]/95 lg:bg-transparent
            backdrop-blur-lg lg:backdrop-blur-none
            z-50 lg:z-auto
            transition-transform duration-300
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}>
            <div className="h-full overflow-y-auto p-6 lg:p-0">
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-xl bg-white hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <StreaksAndAchievements />
            </div>
          </div>
        </div>
      </div>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
