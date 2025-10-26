import { useState, useEffect, useRef } from 'react';
import { Send, Brain, Mic, MicOff, Volume2, VolumeX, Plus, MessageSquare, Settings, History, Trash2 } from 'lucide-react';
import { supabase, ChatMessage, ChatSession } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const reframingPrompts = [
  "That sounds challenging. What might be a different way to look at this situation?",
  "I hear you. What's one small positive aspect you can find in this experience?",
  "Thank you for sharing. How might this challenge be helping you grow?",
  "I understand. What would you tell a friend going through something similar?",
  "That's tough. What strength are you discovering in yourself through this?",
];

type VoiceOption = {
  name: string;
  label: string;
  lang: string;
  gender: 'female' | 'male' | 'child';
  description: string;
};

const voiceOptions: VoiceOption[] = [
  { name: 'Google UK English Female', label: 'Emily (Soft & Warm)', lang: 'en-GB', gender: 'female', description: 'Natural British female voice' },
  { name: 'Google US English Female', label: 'Sarah (Friendly)', lang: 'en-US', gender: 'female', description: 'Warm American female voice' },
  { name: 'Microsoft Zira Desktop', label: 'Zira (Professional)', lang: 'en-US', gender: 'female', description: 'Clear professional voice' },
  { name: 'Google UK English Male', label: 'James (Calm)', lang: 'en-GB', gender: 'male', description: 'Soothing British male voice' },
  { name: 'Google US English Male', label: 'David (Strong)', lang: 'en-US', gender: 'male', description: 'Confident American male voice' },
  { name: 'child', label: 'Alex (Playful)', lang: 'en-US', gender: 'child', description: 'Young and energetic voice' },
];

export function ChatBot() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const { user, profile } = useAuth();

  useEffect(() => {
    if (user) {
      loadSessions();
    }

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);

      if (profile?.voice_preference) {
        setSelectedVoice(profile.voice_preference);
      } else {
        const femaleVoice = voices.find(v =>
          v.name.toLowerCase().includes('female') ||
          v.name.toLowerCase().includes('zira') ||
          v.name.toLowerCase().includes('samantha')
        );
        if (femaleVoice) {
          setSelectedVoice(femaleVoice.name);
        }
      }

      if (profile?.voice_enabled !== undefined) {
        setVoiceEnabled(profile.voice_enabled);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsRecording(false);
      };

      recognitionRef.current.onerror = () => {
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      window.speechSynthesis.cancel();
    };
  }, [user]);

  useEffect(() => {
    if (currentSessionId) {
      loadMessages(currentSessionId);
    }
  }, [currentSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadSessions = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (data && data.length > 0) {
      setSessions(data);
      setCurrentSessionId(data[0].id);
    } else {
      createNewSession();
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

  const createNewSession = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: user.id,
        title: 'New Chat',
      })
      .select()
      .single();

    if (data && !error) {
      setSessions(prev => [data, ...prev]);
      setCurrentSessionId(data.id);
      setMessages([]);
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!user) return;

    await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId);

    setSessions(prev => prev.filter(s => s.id !== sessionId));

    if (currentSessionId === sessionId) {
      const remainingSessions = sessions.filter(s => s.id !== sessionId);
      if (remainingSessions.length > 0) {
        setCurrentSessionId(remainingSessions[0].id);
      } else {
        createNewSession();
      }
    }
  };

  const updateSessionTitle = async (sessionId: string, firstMessage: string) => {
    const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '');

    await supabase
      .from('chat_sessions')
      .update({
        title,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    setSessions(prev => prev.map(s =>
      s.id === sessionId ? { ...s, title, updated_at: new Date().toISOString() } : s
    ));
  };

  const generateReframingResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('stress') || lowerMessage.includes('anxious') || lowerMessage.includes('worried')) {
      return "I hear that you're feeling stressed. Remember, stress often shows us what we care about. What's one small step you could take right now to ease this feeling?";
    }

    if (lowerMessage.includes('fail') || lowerMessage.includes('mistake') || lowerMessage.includes('wrong')) {
      return "Setbacks are part of growth. Every challenge you face is building resilience. What can you learn from this experience?";
    }

    if (lowerMessage.includes('tired') || lowerMessage.includes('exhausted') || lowerMessage.includes('overwhelm')) {
      return "Feeling overwhelmed is your mind's way of asking for rest. What would self-care look like for you right now?";
    }

    if (lowerMessage.includes('sad') || lowerMessage.includes('down') || lowerMessage.includes('depressed')) {
      return "Your feelings are valid. It's okay to not be okay sometimes. What's one thing that usually brings you comfort?";
    }

    return reframingPrompts[Math.floor(Math.random() * reframingPrompts.length)];
  };

  const handleSend = async () => {
    if (!input.trim() || !user || loading || !currentSessionId) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      user_id: user.id,
      session_id: currentSessionId,
      role: 'user',
      content: userMessage,
      reframed_content: null,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);

    const { data: insertedMsg } = await supabase.from('chat_messages').insert({
      user_id: user.id,
      session_id: currentSessionId,
      role: 'user',
      content: userMessage,
    }).select().single();

    const session = sessions.find(s => s.id === currentSessionId);
    if (session && session.title === 'New Chat') {
      updateSessionTitle(currentSessionId, userMessage);
    }

    setTimeout(async () => {
      const responseContent = generateReframingResponse(userMessage);

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        user_id: user.id,
        session_id: currentSessionId,
        role: 'assistant',
        content: responseContent,
        reframed_content: null,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMsg]);

      await supabase.from('chat_messages').insert({
        user_id: user.id,
        session_id: currentSessionId,
        role: 'assistant',
        content: responseContent,
      });

      await supabase
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', currentSessionId);

      setLoading(false);

      if (voiceEnabled) {
        speakText(responseContent);
      }
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startVoiceRecording = () => {
    if (recognitionRef.current && !isRecording) {
      try {
        setIsRecording(true);
        recognitionRef.current.start();
      } catch (error) {
        console.error('Voice recognition error:', error);
        setIsRecording(false);
      }
    }
  };

  const stopVoiceRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const makeChildlike = (text: string): string => {
    let childText = text;

    const fillerPhrases = ['um', 'like', 'you know', 'and', 'and then'];
    const excitedWords = ['super', 'really really', 'so so'];
    const sentences = childText.split(/(?<=[.!?])\s+/);

    childText = sentences.map((sentence, index) => {
      if (sentence.length > 30) {
        const words = sentence.split(' ');
        const insertPoints = [Math.floor(words.length * 0.3), Math.floor(words.length * 0.6)];

        insertPoints.forEach((point, i) => {
          if (point < words.length) {
            words.splice(point + i, 0, fillerPhrases[Math.floor(Math.random() * fillerPhrases.length)] + ',');
          }
        });

        return words.join(' ');
      }
      return sentence;
    }).join(' ');

    childText = childText.replace(/\bvery\b/gi, 'really really');
    childText = childText.replace(/\bimportant\b/gi, 'super duper important');
    childText = childText.replace(/\bgood\b/gi, 'really good');
    childText = childText.replace(/\bhappy\b/gi, 'so happy');

    const starters = ['So', 'Well', 'Um', 'You know what'];
    if (Math.random() > 0.4) {
      childText = starters[Math.floor(Math.random() * starters.length)] + ', ' + childText;
    }

    if (Math.random() > 0.6) {
      childText = childText + '!';
    }

    return childText;
  };

  const speakText = (text: string) => {
    window.speechSynthesis.cancel();

    let spokenText = text;
    const utterance = new SpeechSynthesisUtterance();

    if (selectedVoice) {
      const voice = availableVoices.find(v => v.name === selectedVoice);
      if (voice) {
        utterance.voice = voice;

        if (voice.name.toLowerCase().includes('male') || voice.name.toLowerCase().includes('james')) {
          utterance.rate = 0.9;
          utterance.pitch = 0.95;
        } else if (voice.name.toLowerCase().includes('child') || voice.name.toLowerCase().includes('junior') || voice.name.toLowerCase().includes('alex')) {
          spokenText = makeChildlike(text);
          utterance.rate = 1.2;
          utterance.pitch = 1.8;
        } else {
          utterance.rate = 0.85;
          utterance.pitch = 1.05;
        }
      }
    } else {
      utterance.rate = 0.85;
      utterance.pitch = 1.05;
    }

    utterance.text = spokenText;
    utterance.volume = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const updateVoicePreference = async (voiceName: string) => {
    if (!user) return;

    setSelectedVoice(voiceName);

    await supabase
      .from('profiles')
      .update({ voice_preference: voiceName })
      .eq('id', user.id);
  };

  const updateVoiceEnabled = async (enabled: boolean) => {
    if (!user) return;

    setVoiceEnabled(enabled);

    await supabase
      .from('profiles')
      .update({ voice_enabled: enabled })
      .eq('id', user.id);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  return (
    <div className="flex h-full bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
      <div className={`${showSidebar ? 'w-64' : 'w-16'} bg-gray-50 border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b border-gray-200">
          {showSidebar ? (
            <button
              onClick={createNewSession}
              className="w-full flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white rounded-xl hover:shadow-lg transition-all active:scale-95 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>New Chat</span>
            </button>
          ) : (
            <button
              onClick={createNewSession}
              className="w-full flex items-center justify-center p-2 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white rounded-xl hover:shadow-lg transition-all active:scale-95"
              title="New Chat"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {showSidebar ? (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`group relative flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all ${
                    currentSessionId === session.id
                      ? 'bg-gradient-to-r from-pink-100 to-purple-100'
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => setCurrentSessionId(session.id)}
                >
                  <MessageSquare className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 truncate flex-1">{session.title}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(session.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.slice(0, 5).map((session) => (
                <button
                  key={session.id}
                  onClick={() => setCurrentSessionId(session.id)}
                  className={`w-full p-2 rounded-xl transition-all ${
                    currentSessionId === session.id
                      ? 'bg-gradient-to-r from-pink-100 to-purple-100'
                      : 'hover:bg-gray-100'
                  }`}
                  title={session.title}
                >
                  <MessageSquare className="w-5 h-5 text-gray-500 mx-auto" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-2 border-t border-gray-200 space-y-2">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-xl transition-all active:scale-95"
            title="Toggle Sidebar"
          >
            <History className="w-5 h-5 text-gray-600" />
            {showSidebar && <span className="text-sm text-gray-700">History</span>}
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-xl transition-all active:scale-95"
            title="Settings"
          >
            <Settings className="w-5 h-5 text-gray-600" />
            {showSidebar && <span className="text-sm text-gray-700">Settings</span>}
          </button>
        </div>
      </div>

      <div className="flex flex-col flex-1">
        {showSettings ? (
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Settings</h2>

              <div className="space-y-6">
                <div className="bg-gray-50 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Voice Settings</h3>

                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Voice Responses</p>
                      <p className="text-xs text-gray-500">Hear AI responses read aloud</p>
                    </div>
                    <button
                      onClick={() => updateVoiceEnabled(!voiceEnabled)}
                      className={`relative w-12 h-6 rounded-full transition-all ${
                        voiceEnabled ? 'bg-gradient-to-r from-pink-500 to-purple-500' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          voiceEnabled ? 'transform translate-x-6' : ''
                        }`}
                      />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Select Voice</p>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Female Voices</p>
                      {voiceOptions.filter(v => v.gender === 'female').map((voiceOption) => {
                        const actualVoice = availableVoices.find(v =>
                          v.name.includes(voiceOption.name) || v.name === voiceOption.name
                        );
                        if (!actualVoice) return null;

                        return (
                          <button
                            key={voiceOption.name}
                            onClick={() => updateVoicePreference(actualVoice.name)}
                            className={`w-full text-left p-3 rounded-xl transition-all ${
                              selectedVoice === actualVoice.name
                                ? 'bg-gradient-to-r from-pink-100 to-purple-100 border-2 border-pink-300'
                                : 'bg-white hover:bg-gray-50 border border-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-800">{voiceOption.label}</p>
                                <p className="text-xs text-gray-500">{voiceOption.description}</p>
                              </div>
                              {selectedVoice === actualVoice.name && (
                                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="space-y-2 mt-4">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Male Voices</p>
                      {voiceOptions.filter(v => v.gender === 'male').map((voiceOption) => {
                        const actualVoice = availableVoices.find(v =>
                          v.name.includes(voiceOption.name) || v.name === voiceOption.name
                        );
                        if (!actualVoice) return null;

                        return (
                          <button
                            key={voiceOption.name}
                            onClick={() => updateVoicePreference(actualVoice.name)}
                            className={`w-full text-left p-3 rounded-xl transition-all ${
                              selectedVoice === actualVoice.name
                                ? 'bg-gradient-to-r from-blue-100 to-indigo-100 border-2 border-blue-300'
                                : 'bg-white hover:bg-gray-50 border border-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-800">{voiceOption.label}</p>
                                <p className="text-xs text-gray-500">{voiceOption.description}</p>
                              </div>
                              {selectedVoice === actualVoice.name && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="space-y-2 mt-4">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Child Voices</p>
                      {availableVoices
                        .filter(v =>
                          v.name.toLowerCase().includes('child') ||
                          v.name.toLowerCase().includes('junior') ||
                          (v.name.toLowerCase().includes('alex') && !v.name.toLowerCase().includes('alexa'))
                        )
                        .slice(0, 2)
                        .map((voice) => (
                          <button
                            key={voice.name}
                            onClick={() => updateVoicePreference(voice.name)}
                            className={`w-full text-left p-3 rounded-xl transition-all ${
                              selectedVoice === voice.name
                                ? 'bg-gradient-to-r from-green-100 to-teal-100 border-2 border-green-300'
                                : 'bg-white hover:bg-gray-50 border border-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-800">{voice.name}</p>
                                <p className="text-xs text-gray-500">Playful and energetic</p>
                              </div>
                              {selectedVoice === voice.name && (
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              )}
                            </div>
                          </button>
                        ))}
                    </div>

                    <button
                      onClick={() => speakText('Hello! This is how I sound. I\'m here to support you on your mental wellness journey.')}
                      className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white rounded-xl hover:shadow-lg transition-all active:scale-95 text-sm font-medium"
                    >
                      Test Voice
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">About</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Mindshift is your AI-powered companion for mental wellness and personal growth.
                    Through thoughtful conversation and cognitive reframing techniques, we help you
                    develop resilience and discover new perspectives.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center ${isSpeaking ? 'animate-pulse' : ''}`}>
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">Mindshift Assistant</h2>
                    <p className="text-sm text-white/80">{isSpeaking ? 'Speaking...' : 'Here to help you reframe your thoughts'}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    updateVoiceEnabled(!voiceEnabled);
                    if (isSpeaking) stopSpeaking();
                  }}
                  className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all active:scale-95"
                  title={voiceEnabled ? 'Disable voice' : 'Enable voice'}
                >
                  {voiceEnabled ? <Volume2 className="w-5 h-5 text-white" /> : <VolumeX className="w-5 h-5 text-white" />}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 rounded-2xl mb-4 opacity-20">
                    <Brain className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-gray-400 text-sm">Start a conversation to begin your mindful journey</p>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-5 py-3 rounded-2xl transition-all hover:scale-[1.02] ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-pink-100 to-purple-100 text-gray-800 rounded-br-md'
                        : 'bg-gradient-to-r from-purple-100 to-blue-100 text-gray-800 rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gradient-to-r from-purple-100 to-blue-100 px-5 py-3 rounded-2xl rounded-bl-md">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isRecording ? "Listening..." : "Share what's on your mind..."}
                  className="flex-1 px-5 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all text-sm active:scale-[0.99]"
                  disabled={loading || isRecording}
                />
                <button
                  onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                  disabled={loading}
                  className={`px-6 py-3 rounded-2xl hover:shadow-lg transform hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none ${
                    isRecording
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-white border-2 border-pink-500 text-pink-500'
                  }`}
                  title={isRecording ? 'Stop recording' : 'Start voice input'}
                >
                  {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="px-6 py-3 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white rounded-2xl hover:shadow-lg transform hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
