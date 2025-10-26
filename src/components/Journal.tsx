import { useState, useEffect, useRef } from 'react';
import { BookOpen, Send, ChevronLeft, ChevronRight, Calendar, Mic, MicOff, Trash2, Edit3, Check, X } from 'lucide-react';
import { supabase, ChatMessage, ChatSession } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const reflectiveResponses = [
  "I see.",
  "Mmm.",
  "Tell me more about that.",
  "I hear you.",
  "Go on.",
  "That sounds important.",
  "I'm listening.",
];

const journalPrompts = [
  "What are three feelings that have been present for you today, and where do you feel them in your body?",
  "Describe one interaction today that lingered in your mind, and what unsaid thing made it stick.",
  "If this day had a color and a texture, what would they be, and why?",
  "What's something you noticed today that you usually overlook?",
  "Write about a moment today when you felt most like yourself.",
  "What are you carrying today that isn't yours to carry?",
  "Describe a sensation you felt today without naming the emotion.",
];

export function Journal() {
  const [entries, setEntries] = useState<ChatSession[]>([]);
  const [currentEntry, setCurrentEntry] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isRecording, setIsRecording] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadJournalEntries();
    }
  }, [user]);

  useEffect(() => {
    if (currentEntry) {
      loadMessages(currentEntry.id);
    }
  }, [currentEntry]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadJournalEntries = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('journal_mode', 'journal')
      .order('entry_date', { ascending: false });

    if (data) {
      setEntries(data);
      const todayEntry = data.find(e => e.entry_date === selectedDate);
      if (todayEntry) {
        setCurrentEntry(todayEntry);
      }
    }
  };

  const loadMessages = async (sessionId: string) => {
    if (!user) return;

    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', user.id)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data);
    }
  };

  const createNewEntry = async () => {
    if (!user) return;

    const prompt = journalPrompts[Math.floor(Math.random() * journalPrompts.length)];

    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: user.id,
        title: `Journal - ${new Date().toLocaleDateString()}`,
        journal_mode: 'journal',
        entry_date: selectedDate,
      })
      .select()
      .single();

    if (data && !error) {
      setCurrentEntry(data);
      setEntries(prev => [data, ...prev]);

      setTimeout(async () => {
        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          user_id: user.id,
          session_id: data.id,
          role: 'assistant',
          content: prompt,
          reframed_content: null,
          is_journal_entry: true,
          created_at: new Date().toISOString(),
        };

        setMessages([assistantMsg]);

        await supabase.from('chat_messages').insert({
          user_id: user.id,
          session_id: data.id,
          role: 'assistant',
          content: prompt,
          is_journal_entry: true,
        });
      }, 500);
    }
  };

  const generateJournalResponse = (userMessage: string, messageHistory: ChatMessage[]): string => {
    const lowerMessage = userMessage.toLowerCase();
    const userMessageCount = messageHistory.filter(m => m.role === 'user').length;

    if (lowerMessage.includes('advice') || lowerMessage.includes('help me') || lowerMessage.includes('what should')) {
      return "I hear you, but in this mode, I'm simply here to listen without suggesting anything.";
    }

    const words = userMessage.split(' ').length;

    if (words < 5) {
      return reflectiveResponses[Math.floor(Math.random() * reflectiveResponses.length)];
    }

    const sentences = userMessage.split(/[.!?]+/).filter(s => s.trim().length > 0);

    if (sentences.length === 0) {
      return reflectiveResponses[Math.floor(Math.random() * reflectiveResponses.length)];
    }

    const lastSentences = sentences.slice(-2).join('. ');

    if (lowerMessage.includes('feel') || lowerMessage.includes('felt')) {
      const emotionWords = ['frustrated', 'anxious', 'excited', 'sad', 'happy', 'angry', 'overwhelmed', 'grateful', 'confused', 'tired', 'stressed'];
      const detectedEmotion = emotionWords.find(e => lowerMessage.includes(e));
      if (detectedEmotion) {
        return `It sounds like you're feeling a lot of ${detectedEmotion} over that.`;
      }
      return "I hear the emotion in what you're sharing.";
    }

    if (userMessageCount > 3 && Math.random() > 0.6) {
      return reflectiveResponses[Math.floor(Math.random() * reflectiveResponses.length)];
    }

    const summaryStarters = [
      "So ",
      "It sounds like ",
      "What I'm hearing is ",
    ];

    const starter = summaryStarters[Math.floor(Math.random() * summaryStarters.length)];
    const summary = lastSentences.toLowerCase()
      .replace(/^i\s/g, 'you ')
      .replace(/\si\s/g, ' you ')
      .replace(/\sme\s/g, ' you ')
      .replace(/\smy\s/g, ' your ')
      .replace(/^my\s/g, 'your ');

    return `${starter}${summary}`;
  };

  const generateSummary = (msgs: ChatMessage[]): string => {
    const userMessages = msgs.filter(m => m.role === 'user');
    if (userMessages.length === 0) return '';

    const themes: string[] = [];
    const emotions = ['anxious', 'stressed', 'happy', 'sad', 'frustrated', 'grateful', 'overwhelmed', 'excited', 'worried', 'calm', 'angry', 'peaceful'];

    userMessages.forEach(msg => {
      const lowerContent = msg.content.toLowerCase();
      emotions.forEach(emotion => {
        if (lowerContent.includes(emotion) && !themes.includes(emotion)) {
          themes.push(emotion);
        }
      });
    });

    if (themes.length > 0) {
      return `Today you explored feelings of ${themes.slice(0, 3).join(', ')}. Your words reveal a journey through these emotions.`;
    }

    return `Today you took time to reflect and express yourself. Your thoughts are noted and valued.`;
  };

  const handleSend = async () => {
    if (!input.trim() || !user || loading || !currentEntry) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      user_id: user.id,
      session_id: currentEntry.id,
      role: 'user',
      content: userMessage,
      reframed_content: null,
      is_journal_entry: true,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);

    await supabase.from('chat_messages').insert({
      user_id: user.id,
      session_id: currentEntry.id,
      role: 'user',
      content: userMessage,
      is_journal_entry: true,
    });

    setTimeout(async () => {
      const responseContent = generateJournalResponse(userMessage, messages);

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        user_id: user.id,
        session_id: currentEntry.id,
        role: 'assistant',
        content: responseContent,
        reframed_content: null,
        is_journal_entry: true,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMsg]);

      await supabase.from('chat_messages').insert({
        user_id: user.id,
        session_id: currentEntry.id,
        role: 'assistant',
        content: responseContent,
        is_journal_entry: true,
      });

      const allMessages = [...messages, userMsg, assistantMsg];
      const summary = generateSummary(allMessages);

      await supabase
        .from('chat_sessions')
        .update({
          updated_at: new Date().toISOString(),
          summary: summary,
        })
        .eq('id', currentEntry.id);

      setCurrentEntry(prev => prev ? { ...prev, summary } : null);

      setLoading(false);
    }, 800);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate);
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    const newDateStr = newDate.toISOString().split('T')[0];
    setSelectedDate(newDateStr);

    const entryForDate = entries.find(e => e.entry_date === newDateStr);
    if (entryForDate) {
      setCurrentEntry(entryForDate);
    } else {
      setCurrentEntry(null);
      setMessages([]);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setLoading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = () => {
        const base64Audio = reader.result as string;
        const transcribedText = '[Voice note recorded - transcription would happen here]';
        setInput(prev => prev + (prev ? ' ' : '') + transcribedText);
        setLoading(false);
      };
    } catch (error) {
      console.error('Error transcribing audio:', error);
      setLoading(false);
    }
  };

  const updateEntryTitle = async () => {
    if (!currentEntry || !tempTitle.trim()) {
      setEditingTitle(false);
      return;
    }

    await supabase
      .from('chat_sessions')
      .update({ title: tempTitle.trim() })
      .eq('id', currentEntry.id);

    setCurrentEntry(prev => prev ? { ...prev, title: tempTitle.trim() } : null);
    setEntries(prev => prev.map(e => e.id === currentEntry.id ? { ...e, title: tempTitle.trim() } : e));
    setEditingTitle(false);
  };

  const deleteEntry = async () => {
    if (!currentEntry) return;

    await supabase
      .from('chat_messages')
      .delete()
      .eq('session_id', currentEntry.id);

    await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', currentEntry.id);

    setEntries(prev => prev.filter(e => e.id !== currentEntry.id));
    setCurrentEntry(null);
    setMessages([]);
    setShowDeleteConfirm(false);
  };

  return (
    <div className="flex h-full bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="relative w-full max-w-4xl h-full">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-orange-100 rounded-3xl shadow-2xl transform rotate-1"></div>
          <div className="absolute inset-0 bg-white rounded-3xl shadow-2xl border-4 border-amber-200" style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 31px, #e5e7eb 31px, #e5e7eb 32px)',
          }}>
            <div className="h-full flex flex-col p-8">
              <div className="mb-6 pb-4 border-b-2 border-amber-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-8 h-8 text-amber-700" />
                    <div>
                      <h1 className="text-2xl font-bold text-amber-900" style={{ fontFamily: 'Georgia, serif' }}>
                        My Journal
                      </h1>
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          onClick={() => navigateDate('prev')}
                          className="p-1 hover:bg-amber-100 rounded transition-all"
                        >
                          <ChevronLeft className="w-4 h-4 text-amber-700" />
                        </button>
                        <p className="text-sm text-amber-700">{formatDate(selectedDate)}</p>
                        <button
                          onClick={() => navigateDate('next')}
                          className="p-1 hover:bg-amber-100 rounded transition-all"
                          disabled={selectedDate === new Date().toISOString().split('T')[0]}
                        >
                          <ChevronRight className="w-4 h-4 text-amber-700" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentEntry && (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-all active:scale-95"
                        title="Delete entry"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                    {!currentEntry && (
                      <button
                        onClick={createNewEntry}
                        className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:shadow-lg transition-all active:scale-95 text-sm font-medium"
                      >
                        Start Writing
                      </button>
                    )}
                  </div>
                </div>

                {currentEntry && !editingTitle && (
                  <div className="flex items-center gap-2 mt-2">
                    <h2 className="text-lg font-semibold text-amber-800" style={{ fontFamily: 'Georgia, serif' }}>
                      {currentEntry.title}
                    </h2>
                    <button
                      onClick={() => {
                        setEditingTitle(true);
                        setTempTitle(currentEntry.title);
                      }}
                      className="p-1 hover:bg-amber-100 rounded transition-all"
                    >
                      <Edit3 className="w-4 h-4 text-amber-600" />
                    </button>
                  </div>
                )}

                {editingTitle && (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="text"
                      value={tempTitle}
                      onChange={(e) => setTempTitle(e.target.value)}
                      className="flex-1 px-3 py-1 border-2 border-amber-300 rounded-lg focus:outline-none focus:border-amber-500"
                      style={{ fontFamily: 'Georgia, serif' }}
                      autoFocus
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') updateEntryTitle();
                        if (e.key === 'Escape') setEditingTitle(false);
                      }}
                    />
                    <button
                      onClick={updateEntryTitle}
                      className="p-1 hover:bg-green-100 text-green-600 rounded transition-all"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingTitle(false)}
                      className="p-1 hover:bg-red-100 text-red-600 rounded transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto mb-6 space-y-6 pr-2" style={{ scrollbarWidth: 'thin' }}>
                {messages.length === 0 ? (
                  <div className="text-center py-16">
                    <BookOpen className="w-16 h-16 text-amber-300 mx-auto mb-4" />
                    <p className="text-amber-600 italic" style={{ fontFamily: 'Georgia, serif' }}>
                      {currentEntry ? 'Begin your entry...' : 'No entry for this day yet'}
                    </p>
                  </div>
                ) : (
                  <>
                    {messages.map((message, index) => (
                      <div
                        key={message.id}
                        className={`${message.role === 'user' ? 'ml-8' : 'mr-8'}`}
                      >
                        <p
                          className={`leading-relaxed ${
                            message.role === 'user'
                              ? 'text-gray-900 text-base'
                              : 'text-amber-800 text-sm italic'
                          }`}
                          style={{
                            fontFamily: message.role === 'user' ? 'Georgia, serif' : 'Brush Script MT, cursive',
                            lineHeight: '2rem',
                          }}
                        >
                          {message.content}
                        </p>
                      </div>
                    ))}

                    {currentEntry?.summary && messages.filter(m => m.role === 'user').length >= 3 && (
                      <div className="mt-8 pt-6 border-t-2 border-amber-200">
                        <p className="text-xs uppercase tracking-wider text-amber-600 mb-2">Daily Reflection</p>
                        <p
                          className="text-amber-900 italic leading-relaxed"
                          style={{
                            fontFamily: 'Brush Script MT, cursive',
                            fontSize: '1.1rem',
                          }}
                        >
                          {currentEntry.summary}
                        </p>
                      </div>
                    )}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>

              {currentEntry && (
                <div className="flex gap-2">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`px-4 py-3 rounded-xl hover:shadow-lg transition-all active:scale-95 ${
                      isRecording
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-amber-200 text-amber-700 hover:bg-amber-300'
                    }`}
                    title={isRecording ? 'Stop recording' : 'Start voice recording'}
                  >
                    {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Write your thoughts..."
                    className="flex-1 px-4 py-3 border-2 border-amber-300 rounded-xl focus:outline-none focus:border-amber-500 resize-none bg-amber-50/50"
                    style={{
                      fontFamily: 'Georgia, serif',
                      lineHeight: '1.5rem',
                    }}
                    rows={2}
                    disabled={loading}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="w-64 bg-amber-100/50 border-l border-amber-200 p-4 overflow-y-auto">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-amber-300">
          <Calendar className="w-5 h-5 text-amber-700" />
          <h3 className="font-semibold text-amber-900">Past Entries</h3>
        </div>
        <div className="space-y-2">
          {entries.map((entry) => (
            <button
              key={entry.id}
              onClick={() => {
                setCurrentEntry(entry);
                setSelectedDate(entry.entry_date || new Date().toISOString().split('T')[0]);
              }}
              className={`w-full text-left p-3 rounded-xl transition-all ${
                currentEntry?.id === entry.id
                  ? 'bg-amber-200 border-2 border-amber-400'
                  : 'bg-white hover:bg-amber-50 border border-amber-200'
              }`}
            >
              <p className="text-xs text-amber-600 mb-1">
                {entry.entry_date ? formatDate(entry.entry_date) : 'Unknown date'}
              </p>
              {entry.summary && (
                <p className="text-xs text-gray-600 italic line-clamp-2">{entry.summary}</p>
              )}
            </button>
          ))}
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Georgia, serif' }}>
              Delete Entry?
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this journal entry? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={deleteEntry}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
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
