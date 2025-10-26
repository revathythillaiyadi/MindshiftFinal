import { useState, useEffect, useRef } from 'react';
import { BookOpen, Mic, MicOff, Trash2, Edit3, X, Settings, Save, Menu, Plus, ChevronLeft } from 'lucide-react';
import { supabase, JournalEntry } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface JournalProps {
  onOpenSettings?: () => void;
}

type ViewMode = 'list' | 'new' | 'view';

export function Journal({ onOpenSettings }: JournalProps = {}) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(null);
  const [title, setTitle] = useState('');
  const [rawTextContent, setRawTextContent] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingContent, setEditingContent] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadJournalEntries();
    }
  }, [user]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setRawTextContent(prev => prev + finalTranscript);
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      stopAudioVisualization();
    };
  }, []);

  const loadJournalEntries = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading journal entries:', error);
      return;
    }

    setEntries(data || []);
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      visualizeAudio();

      if (recognitionRef.current) {
        recognitionRef.current.start();
      }

      setIsRecording(true);
    } catch (error) {
      console.error('Error starting voice recording:', error);
      alert('Unable to access microphone. Please check permissions.');
    }
  };

  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    stopAudioVisualization();
    setIsRecording(false);
    setAudioLevel(0);
  };

  const visualizeAudio = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

    const updateLevel = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(average / 255);

      animationFrameRef.current = requestAnimationFrame(updateLevel);
    };

    updateLevel();
  };

  const stopAudioVisualization = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  const saveEntry = async () => {
    if (!user || !rawTextContent.trim()) return;

    setIsSaving(true);

    const entryTitle = title.trim() || new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .insert({
          user_id: user.id,
          title: entryTitle,
          raw_text_content: rawTextContent.trim(),
          content: rawTextContent.trim(),
          entry_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (error) throw error;

      setEntries(prev => [data, ...prev]);
      setTitle('');
      setRawTextContent('');
      setViewMode('list');
    } catch (error) {
      console.error('Error saving entry:', error);
      alert('Failed to save entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteEntry = async (entryId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', user.id);

      if (error) throw error;

      setEntries(prev => prev.filter(e => e.id !== entryId));
      setShowDeleteConfirm(false);
      setViewMode('list');
      setCurrentEntry(null);
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Failed to delete entry. Please try again.');
    }
  };

  const updateEntryTitle = async (entryId: string, newTitle: string) => {
    if (!user || !newTitle.trim()) return;

    try {
      const { error } = await supabase
        .from('journal_entries')
        .update({ title: newTitle.trim() })
        .eq('id', entryId)
        .eq('user_id', user.id);

      if (error) throw error;

      setEntries(prev => prev.map(e => e.id === entryId ? { ...e, title: newTitle.trim() } : e));
      if (currentEntry?.id === entryId) {
        setCurrentEntry(prev => prev ? { ...prev, title: newTitle.trim() } : null);
      }
      setEditingTitle(false);
    } catch (error) {
      console.error('Error updating title:', error);
      alert('Failed to update title. Please try again.');
    }
  };

  const updateEntryContent = async (entryId: string, newContent: string) => {
    if (!user || !newContent.trim()) return;

    try {
      const { error } = await supabase
        .from('journal_entries')
        .update({
          raw_text_content: newContent.trim(),
          content: newContent.trim()
        })
        .eq('id', entryId)
        .eq('user_id', user.id);

      if (error) throw error;

      setEntries(prev => prev.map(e => e.id === entryId ? { ...e, raw_text_content: newContent.trim(), content: newContent.trim() } : e));
      if (currentEntry?.id === entryId) {
        setCurrentEntry(prev => prev ? { ...prev, raw_text_content: newContent.trim(), content: newContent.trim() } : null);
      }
      setEditingContent(false);
    } catch (error) {
      console.error('Error updating content:', error);
      alert('Failed to update content. Please try again.');
    }
  };

  const viewEntry = (entry: JournalEntry) => {
    setCurrentEntry(entry);
    setViewMode('view');
  };

  const startNewEntry = () => {
    setTitle('');
    setRawTextContent('');
    setCurrentEntry(null);
    setViewMode('new');
  };

  return (
    <div className="flex h-full bg-gradient-to-br from-pink-50 via-blue-50 to-cyan-50">
      {showSidebar && (
        <div className="w-72 bg-white/90 backdrop-blur-sm border-r border-gray-200 flex flex-col shadow-lg">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-pink-600" />
              My Journal
            </h2>
            <button
              onClick={() => setShowSidebar(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all"
              title="Hide sidebar"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="p-4 border-b border-gray-200">
            <button
              onClick={startNewEntry}
              className="w-full px-4 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 active:scale-95 transition-all font-medium flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Entry
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            <h3 className="text-sm font-semibold text-gray-600 px-3 py-2">Contents</h3>
            <div className="space-y-2">
              {entries.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No entries yet</p>
              ) : (
                entries.map((entry) => (
                  <div
                    key={entry.id}
                    className={`group p-3 rounded-xl cursor-pointer transition-all ${
                      currentEntry?.id === entry.id
                        ? 'bg-gradient-to-r from-pink-100 to-blue-100 border-2 border-pink-300'
                        : 'hover:bg-gray-50 border border-gray-200'
                    }`}
                    onClick={() => viewEntry(entry)}
                  >
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {entry.title || 'Untitled Entry'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(entry.created_at!).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {onOpenSettings && (
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={onOpenSettings}
                className="w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 flex flex-col">
        {!showSidebar && (
          <div className="p-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
            <button
              onClick={() => setShowSidebar(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all"
              title="Show sidebar"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        )}

        {viewMode === 'list' && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <BookOpen className="w-24 h-24 text-pink-500 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Welcome to Your Journal</h2>
              <p className="text-gray-600 mb-8">
                Start documenting your thoughts, feelings, and experiences.
              </p>
              <button
                onClick={startNewEntry}
                className="px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl hover:shadow-lg transform hover:-translate-y-0.5 active:scale-95 transition-all font-medium text-lg flex items-center justify-center gap-2 mx-auto"
              >
                <Plus className="w-6 h-6" />
                Create Your First Entry
              </button>
            </div>
          </div>
        )}

        {viewMode === 'new' && (
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border-2 border-pink-200 p-8">
              <div className="mb-6">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Entry Title (optional - defaults to date/time)"
                  className="w-full px-4 py-3 text-2xl font-bold border-b-2 border-gray-200 focus:border-pink-500 focus:outline-none transition-all"
                />
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-700">Your Thoughts</h3>
                  <button
                    onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                    className={`px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all ${
                      isRecording
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-pink-500 text-white hover:bg-pink-600'
                    }`}
                  >
                    {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    {isRecording ? 'Stop Recording' : 'Record Voice'}
                  </button>
                </div>

                {isRecording && (
                  <div className="mb-4 p-4 bg-red-50 rounded-xl border border-red-200">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-red-400 to-red-600 transition-all duration-100"
                            style={{ width: `${audioLevel * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium text-red-600">Recording...</span>
                    </div>
                  </div>
                )}

                <textarea
                  ref={textAreaRef}
                  value={rawTextContent}
                  onChange={(e) => setRawTextContent(e.target.value)}
                  placeholder="Start typing or use voice recording..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:outline-none transition-all min-h-96 resize-none text-lg"
                  disabled={isRecording}
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={saveEntry}
                  disabled={!rawTextContent.trim() || isSaving}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 active:scale-95 transition-all font-medium text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <Save className="w-5 h-5" />
                  {isSaving ? 'Saving...' : 'Save Entry'}
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className="px-6 py-4 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'view' && currentEntry && (
          <div className="flex-1 overflow-y-auto p-8">
            <div
              className="max-w-4xl mx-auto bg-gradient-to-br from-pink-50 to-blue-50 rounded-2xl shadow-2xl border-4 border-pink-300 p-12 relative"
              style={{
                backgroundImage: `repeating-linear-gradient(transparent, transparent 31px, #e5e7eb 31px, #e5e7eb 32px)`,
                lineHeight: '32px'
              }}
            >
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute left-12 top-0 bottom-0 w-0.5 bg-pink-300"></div>
              </div>

              <div className="relative">
                {editingTitle ? (
                  <div className="mb-8">
                    <input
                      type="text"
                      defaultValue={currentEntry.title || ''}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          updateEntryTitle(currentEntry.id, e.currentTarget.value);
                        } else if (e.key === 'Escape') {
                          setEditingTitle(false);
                        }
                      }}
                      className="w-full px-4 py-2 text-3xl font-bold border-2 border-pink-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
                      style={{ fontFamily: "'Caveat', cursive" }}
                      autoFocus
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={(e) => {
                          const input = e.currentTarget.parentElement?.previousElementSibling as HTMLInputElement;
                          if (input) updateEntryTitle(currentEntry.id, input.value);
                        }}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingTitle(false)}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-8 flex items-start justify-between">
                    <h1
                      className="text-4xl font-bold text-gray-900"
                      style={{ fontFamily: "'Caveat', cursive" }}
                    >
                      {currentEntry.title || 'Untitled Entry'}
                    </h1>
                    <button
                      onClick={() => setEditingTitle(true)}
                      className="p-2 hover:bg-pink-200 rounded-lg transition-all"
                      title="Edit Title"
                    >
                      <Edit3 className="w-5 h-5 text-pink-700" />
                    </button>
                  </div>
                )}

                <p className="text-sm text-gray-600 mb-8" style={{ fontFamily: "'Caveat', cursive" }}>
                  {new Date(currentEntry.created_at!).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>

                {editingContent ? (
                  <div className="mb-8">
                    <textarea
                      defaultValue={currentEntry.raw_text_content || currentEntry.content || ''}
                      className="w-full px-4 py-3 text-xl border-2 border-pink-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600 min-h-96"
                      style={{ fontFamily: "'Caveat', cursive" }}
                      autoFocus
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={(e) => {
                          const textarea = e.currentTarget.parentElement?.previousElementSibling as HTMLTextAreaElement;
                          if (textarea) updateEntryContent(currentEntry.id, textarea.value);
                        }}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingContent(false)}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-8 relative group">
                    <p
                      className="text-xl text-gray-800 whitespace-pre-wrap"
                      style={{ fontFamily: "'Caveat', cursive" }}
                    >
                      {currentEntry.raw_text_content || currentEntry.content || 'No content'}
                    </p>
                    <button
                      onClick={() => setEditingContent(true)}
                      className="absolute -right-2 -top-2 p-2 bg-white hover:bg-pink-200 rounded-lg shadow-lg transition-all opacity-0 group-hover:opacity-100"
                      title="Edit Content"
                    >
                      <Edit3 className="w-5 h-5 text-pink-700" />
                    </button>
                  </div>
                )}

                <div className="flex gap-4 pt-6 border-t border-pink-300">
                  <button
                    onClick={() => setViewMode('list')}
                    className="px-6 py-3 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition-all font-medium"
                  >
                    Back to List
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all font-medium flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Entry
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showDeleteConfirm && currentEntry && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Delete Entry?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{currentEntry.title || 'this entry'}"? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => deleteEntry(currentEntry.id)}
                className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all font-medium"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
