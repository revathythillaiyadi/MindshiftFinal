import { useState, useEffect, useRef } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, Calendar, Mic, MicOff, Trash2, Edit3, Check, X, Settings, Save, History } from 'lucide-react';
import { supabase, JournalEntry } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface JournalProps {
  onOpenSettings?: () => void;
}

export function Journal({ onOpenSettings }: JournalProps = {}) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(null);
  const [content, setContent] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isRecording, setIsRecording] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const recordedTextRef = useRef<string>('');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadJournalEntries();
    }
  }, [user]);

  useEffect(() => {
    const entryForDate = entries.find(e => e.entry_date === selectedDate);
    if (entryForDate) {
      setCurrentEntry(entryForDate);
      setContent(entryForDate.content);
      setTempTitle(entryForDate.title);
    } else {
      setCurrentEntry(null);
      setContent('');
      setTempTitle('');
    }
  }, [selectedDate, entries]);

  useEffect(() => {
    if (currentEntry && content !== currentEntry.content) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      autoSaveTimerRef.current = setTimeout(() => {
        saveEntry();
      }, 2000);
    }
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [content]);

  const loadJournalEntries = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('entry_date', { ascending: false });

    if (data && !error) {
      setEntries(data);
    }
  };

  const saveEntry = async () => {
    if (!user || !content.trim()) return;

    setIsSaving(true);

    if (currentEntry) {
      const { error } = await supabase
        .from('journal_entries')
        .update({
          content: content.trim(),
          title: tempTitle || `Journal - ${new Date(selectedDate).toLocaleDateString()}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentEntry.id);

      if (!error) {
        setLastSaved(new Date());
        await loadJournalEntries();
      }
    } else {
      const { data, error } = await supabase
        .from('journal_entries')
        .insert({
          user_id: user.id,
          entry_date: selectedDate,
          content: content.trim(),
          title: tempTitle || `Journal - ${new Date(selectedDate).toLocaleDateString()}`,
        })
        .select()
        .single();

      if (data && !error) {
        setCurrentEntry(data);
        setLastSaved(new Date());
        await loadJournalEntries();
      }
    }

    setIsSaving(false);
  };

  const deleteEntry = async (entryId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', entryId)
      .eq('user_id', user.id);

    if (!error) {
      setEntries(prev => prev.filter(e => e.id !== entryId));

      if (currentEntry?.id === entryId) {
        setCurrentEntry(null);
        setContent('');
        setSelectedDate(new Date().toISOString().split('T')[0]);
      }

      setShowDeleteConfirm(false);
      setDeleteEntryId(null);
    }
  };

  const updateEntryTitleInSidebar = async (entryId: string, newTitle: string) => {
    if (!user || !newTitle.trim()) {
      setEditingEntryId(null);
      return;
    }

    const { error } = await supabase
      .from('journal_entries')
      .update({ title: newTitle.trim() })
      .eq('id', entryId)
      .eq('user_id', user.id);

    if (!error) {
      setEditingEntryId(null);
      await loadJournalEntries();
    }
  };

  const updateEntryTitle = async () => {
    if (!currentEntry || !tempTitle.trim()) {
      setEditingTitle(false);
      return;
    }

    const { error } = await supabase
      .from('journal_entries')
      .update({ title: tempTitle.trim() })
      .eq('id', currentEntry.id);

    if (!error) {
      setEditingTitle(false);
      await loadJournalEntries();
    }
  };

  const changeDate = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate);
    if (direction === 'prev') {
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

  const startRecording = async () => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      const startingText = content;
      recordedTextRef.current = '';

      recognition.onresult = (event: any) => {
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
          recordedTextRef.current += finalTranscript;
        }

        const displayText = recordedTextRef.current + interimTranscript;
        setContent(startingText + (startingText ? ' ' : '') + displayText);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      alert('Could not start speech recognition. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      recordedTextRef.current = '';
    }
  };

  return (
    <div className="flex h-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className={`${showSidebar ? 'w-72' : 'w-16'} bg-white/80 backdrop-blur-sm border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-blue-50 rounded-xl transition-all active:scale-95"
            title="Toggle History"
          >
            <History className="w-5 h-5 text-blue-600" />
            {showSidebar && <span className="text-sm font-medium text-gray-700">History</span>}
          </button>
        </div>

        {showSidebar && (
          <div className="flex-1 overflow-y-auto p-2">
            <div className="space-y-2">
              {entries.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No entries yet</p>
              ) : (
                entries.map((entry) => (
                  <div
                    key={entry.id}
                    className={`group relative p-3 rounded-xl cursor-pointer transition-all ${
                      currentEntry?.id === entry.id
                        ? 'bg-gradient-to-r from-blue-100 to-cyan-100 border-2 border-blue-300'
                        : 'hover:bg-gray-50 border border-gray-200'
                    }`}
                    onClick={() => {
                      setSelectedDate(entry.entry_date);
                      setCurrentEntry(entry);
                      setContent(entry.content);
                      setTempTitle(entry.title);
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {editingEntryId === entry.id ? (
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                updateEntryTitleInSidebar(entry.id, editTitle);
                              } else if (e.key === 'Escape') {
                                setEditingEntryId(null);
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full px-2 py-1 text-xs border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                        ) : (
                          <>
                            <p className="text-sm font-medium text-gray-900 truncate">{entry.title}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(entry.entry_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                          </>
                        )}
                      </div>

                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {editingEntryId === entry.id ? (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateEntryTitleInSidebar(entry.id, editTitle);
                              }}
                              className="p-1 hover:bg-green-100 text-green-600 rounded transition-all"
                              title="Save"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingEntryId(null);
                              }}
                              className="p-1 hover:bg-red-100 text-red-600 rounded transition-all"
                              title="Cancel"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingEntryId(entry.id);
                                setEditTitle(entry.title);
                              }}
                              className="p-1 hover:bg-blue-100 text-blue-600 rounded transition-all"
                              title="Edit Title"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteEntryId(entry.id);
                                setShowDeleteConfirm(true);
                              }}
                              className="p-1 hover:bg-red-100 text-red-600 rounded transition-all"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full">
        <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-blue-600" />
                <h1 className="text-2xl font-semibold text-gray-900">My Journal</h1>
              </div>
              <div className="flex items-center gap-2">
                {onOpenSettings && (
                  <button
                    onClick={onOpenSettings}
                    className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-all active:scale-95"
                    title="Settings"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                )}
                {currentEntry && (
                  <>
                    <button
                      onClick={() => saveEntry()}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setDeleteEntryId(currentEntry.id);
                        setShowDeleteConfirm(true);
                      }}
                      className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-all active:scale-95"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => changeDate('prev')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                  title="Previous Day"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-lg">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="bg-transparent text-gray-900 font-medium outline-none cursor-pointer"
                  />
                </div>
                <button
                  onClick={() => changeDate('next')}
                  disabled={selectedDate === new Date().toISOString().split('T')[0]}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Next Day"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {lastSaved && (
                <span className="text-xs text-gray-500">
                  Last saved: {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </div>

            {currentEntry && (
              <div className="mt-4 flex items-center gap-2">
                {editingTitle ? (
                  <>
                    <input
                      type="text"
                      value={tempTitle}
                      onChange={(e) => setTempTitle(e.target.value)}
                      className="flex-1 px-3 py-1 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Entry title"
                      autoFocus
                    />
                    <button
                      onClick={updateEntryTitle}
                      className="p-1 hover:bg-green-100 text-green-600 rounded transition-all"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingTitle(false);
                        setTempTitle(currentEntry.title);
                      }}
                      className="p-1 hover:bg-red-100 text-red-600 rounded transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <>
                    <h2 className="text-lg font-medium text-gray-800">{currentEntry.title}</h2>
                    <button
                      onClick={() => setEditingTitle(true)}
                      className="p-1 hover:bg-gray-100 text-gray-500 rounded transition-all"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-8 min-h-full">
            <textarea
              ref={textAreaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`What's on your mind today, ${new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}?`}
              className="w-full h-full min-h-[500px] p-4 bg-transparent border-none outline-none resize-none text-gray-900"
              style={{
                fontFamily: "'Kalam', 'Patrick Hand', 'Comic Sans MS', cursive",
                fontSize: '1.125rem',
                lineHeight: '2.25rem',
                letterSpacing: '0.01em',
              }}
            />
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm border-t border-gray-200 p-4">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all active:scale-95 ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isRecording ? (
                <>
                  <MicOff className="w-5 h-5" />
                  <span>Stop Recording</span>
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  <span>Start Recording</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {showDeleteConfirm && deleteEntryId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Journal Entry?</h3>
            <p className="text-gray-600 mb-6">
              This will permanently delete this journal entry. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteEntryId(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteEntry(deleteEntryId)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
