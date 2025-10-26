import { useState, useEffect, useRef } from 'react';
import { Send, Brain, Mic, MicOff, Volume2, VolumeX, Plus, MessageSquare, Settings, History, Trash2, Palette, Smile, BookOpen } from 'lucide-react';
import { supabase, ChatMessage, ChatSession } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const reframingPrompts = [
  "That sounds challenging. What might be a different way to look at this situation?",
  "I hear you. What's one small positive aspect you can find in this experience?",
  "Thank you for sharing. How might this challenge be helping you grow?",
  "I understand. What would you tell a friend going through something similar?",
  "That's tough. What strength are you discovering in yourself through this?",
];

const journalStartPrompts = [
  "What are three feelings that have been present for you today, and where do you feel them in your body?",
  "Describe one interaction today that lingered in your mind, and what unsaid thing made it stick.",
  "If this day had a color and a texture, what would they be, and why?",
  "What's something you noticed today that you usually overlook?",
  "Write about a moment today when you felt most like yourself.",
];

const reflectiveResponses = [
  "I see.",
  "Mmm.",
  "Tell me more about that.",
  "I hear you.",
  "Go on.",
  "That sounds important.",
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
  const [chatBackground, setChatBackground] = useState('gradient');
  const [emojiEnabled, setEmojiEnabled] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [customBackgrounds, setCustomBackgrounds] = useState<string[]>([]);
  const [journalMode, setJournalMode] = useState<'reframe' | 'journal'>('reframe');
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

      if (profile?.chat_background) {
        setChatBackground(profile.chat_background);
      }

      if (profile?.emoji_enabled !== undefined) {
        setEmojiEnabled(profile.emoji_enabled);
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
      const session = sessions.find(s => s.id === currentSessionId);
      if (session) {
        setJournalMode(session.journal_mode || 'reframe');
      }
    }
  }, [currentSessionId, sessions]);

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

  const createNewSession = async (mode: 'reframe' | 'journal' = 'reframe') => {
    if (!user) return;

    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: user.id,
        title: mode === 'journal' ? 'Journal Entry' : 'New Chat',
        journal_mode: mode,
      })
      .select()
      .single();

    if (data && !error) {
      setSessions(prev => [data, ...prev]);
      setCurrentSessionId(data.id);
      setMessages([]);
      setJournalMode(mode);

      if (mode === 'journal') {
        const prompt = journalStartPrompts[Math.floor(Math.random() * journalStartPrompts.length)];
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

  const generateJournalResponse = (userMessage: string, messageHistory: ChatMessage[]): string => {
    const lowerMessage = userMessage.toLowerCase();
    const userMessageCount = messageHistory.filter(m => m.role === 'user').length;

    if (lowerMessage.includes('advice') || lowerMessage.includes('help me') || lowerMessage.includes('what should')) {
      return "I hear you, but in this mode, I'm simply here to listen without suggesting anything. We can go to the 'Reframe Mode' if you'd like an exercise.";
    }

    const words = userMessage.split(' ').length;

    if (words < 5) {
      return reflectiveResponses[Math.floor(Math.random() * reflectiveResponses.length)];
    }

    const sentences = userMessage.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const lastSentences = sentences.slice(-2).join('. ');

    if (lowerMessage.includes('feel') || lowerMessage.includes('felt')) {
      const emotionWords = ['frustrated', 'anxious', 'excited', 'sad', 'happy', 'angry', 'overwhelmed', 'grateful', 'confused'];
      const detectedEmotion = emotionWords.find(e => lowerMessage.includes(e));
      if (detectedEmotion) {
        return `It sounds like you're feeling a lot of ${detectedEmotion} over that.`;
      }
      return "I hear the emotion in what you're sharing.";
    }

    if (userMessageCount > 3 && Math.random() > 0.7) {
      return reflectiveResponses[Math.floor(Math.random() * reflectiveResponses.length)];
    }

    const summaryStarters = [
      "So ",
      "It sounds like ",
      "What I'm hearing is ",
    ];

    const starter = summaryStarters[Math.floor(Math.random() * summaryStarters.length)];
    const summary = lastSentences.toLowerCase().replace(/^i /g, 'you ').replace(/ i /g, ' you ').replace(/ me /g, ' you ');

    return `${starter}${summary}`;
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
      is_journal_entry: journalMode === 'journal',
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);

    const { data: insertedMsg } = await supabase.from('chat_messages').insert({
      user_id: user.id,
      session_id: currentSessionId,
      role: 'user',
      content: userMessage,
      is_journal_entry: journalMode === 'journal',
    }).select().single();

    const session = sessions.find(s => s.id === currentSessionId);
    if (session && (session.title === 'New Chat' || session.title === 'Journal Entry')) {
      updateSessionTitle(currentSessionId, userMessage);
    }

    setTimeout(async () => {
      const responseContent = journalMode === 'journal'
        ? generateJournalResponse(userMessage, messages)
        : generateReframingResponse(userMessage);

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        user_id: user.id,
        session_id: currentSessionId,
        role: 'assistant',
        content: responseContent,
        reframed_content: null,
        is_journal_entry: journalMode === 'journal',
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMsg]);

      await supabase.from('chat_messages').insert({
        user_id: user.id,
        session_id: currentSessionId,
        role: 'assistant',
        content: responseContent,
        is_journal_entry: journalMode === 'journal',
      });

      await supabase
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', currentSessionId);

      setLoading(false);

      if (voiceEnabled && journalMode === 'reframe') {
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

  const speakText = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    if (selectedVoice) {
      const voice = availableVoices.find(v => v.name === selectedVoice);
      if (voice) {
        utterance.voice = voice;

        if (voice.name.toLowerCase().includes('male') || voice.name.toLowerCase().includes('james')) {
          utterance.rate = 0.9;
          utterance.pitch = 0.95;
        } else {
          utterance.rate = 0.85;
          utterance.pitch = 1.05;
        }
      }
    } else {
      utterance.rate = 0.85;
      utterance.pitch = 1.05;
    }

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

  const updateChatBackground = async (background: string) => {
    if (!user) return;

    setChatBackground(background);

    await supabase
      .from('profiles')
      .update({ chat_background: background })
      .eq('id', user.id);
  };

  const updateEmojiEnabled = async (enabled: boolean) => {
    if (!user) return;

    setEmojiEnabled(enabled);

    await supabase
      .from('profiles')
      .update({ emoji_enabled: enabled })
      .eq('id', user.id);
  };

  const insertEmoji = (emoji: string) => {
    setInput(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleCustomImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const newCustomBg = `custom_${base64String}`;

      setCustomBackgrounds(prev => [...prev, base64String]);
      await updateChatBackground(newCustomBg);
    };
    reader.readAsDataURL(file);
  };

  const getBackgroundStyle = (bg: string): React.CSSProperties => {
    if (bg.startsWith('custom_')) {
      return {
        backgroundImage: `url(${bg.replace('custom_', '')})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      };
    }

    const backgrounds: { [key: string]: React.CSSProperties } = {
      gradient: { background: 'linear-gradient(135deg, #fce7f3 0%, #f3e8ff 50%, #dbeafe 100%)' },

      nature_waterfall: {
        backgroundImage: 'url(https://images.pexels.com/photos/2132126/pexels-photo-2132126.jpeg?auto=compress&cs=tinysrgb&w=1920&dpr=2)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      },
      nature_forest: {
        backgroundImage: 'url(https://images.pexels.com/photos/1576161/pexels-photo-1576161.jpeg?auto=compress&cs=tinysrgb&w=1920&dpr=2)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      },
      nature_mountains: {
        backgroundImage: 'url(https://images.pexels.com/photos/1266810/pexels-photo-1266810.jpeg?auto=compress&cs=tinysrgb&w=1920&dpr=2)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      },
      nature_lake: {
        backgroundImage: 'url(https://images.pexels.com/photos/1438761/pexels-photo-1438761.jpeg?auto=compress&cs=tinysrgb&w=1920&dpr=2)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      },
      nature_beach: {
        backgroundImage: 'url(https://images.pexels.com/photos/1032650/pexels-photo-1032650.jpeg?auto=compress&cs=tinysrgb&w=1920&dpr=2)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      },

      animals_butterfly: {
        backgroundImage: 'url(https://images.pexels.com/photos/56866/garden-flower-butterfly-summer-56866.jpeg?auto=compress&cs=tinysrgb&w=1920&dpr=2)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      },
      animals_birds: {
        backgroundImage: 'url(https://images.pexels.com/photos/349758/hummingbird-bird-birds-349758.jpeg?auto=compress&cs=tinysrgb&w=1920&dpr=2)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      },
      animals_deer: {
        backgroundImage: 'url(https://images.pexels.com/photos/247376/pexels-photo-247376.jpeg?auto=compress&cs=tinysrgb&w=1920&dpr=2)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      },
      animals_cats: {
        backgroundImage: 'url(https://images.pexels.com/photos/1170986/pexels-photo-1170986.jpeg?auto=compress&cs=tinysrgb&w=1920&dpr=2)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      },
      animals_dogs: {
        backgroundImage: 'url(https://images.pexels.com/photos/1805164/pexels-photo-1805164.jpeg?auto=compress&cs=tinysrgb&w=1920&dpr=2)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      },

      abstract_colors: {
        backgroundImage: 'url(https://images.pexels.com/photos/2693208/pexels-photo-2693208.png?auto=compress&cs=tinysrgb&w=1920&dpr=2)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      },
      abstract_waves: {
        backgroundImage: 'url(https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg?auto=compress&cs=tinysrgb&w=1920&dpr=2)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      },
      abstract_geometric: {
        backgroundImage: 'url(https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=1920&dpr=2)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      },
      abstract_fluid: {
        backgroundImage: 'url(https://images.pexels.com/photos/1509582/pexels-photo-1509582.jpeg?auto=compress&cs=tinysrgb&w=1920&dpr=2)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      },
      abstract_marble: {
        backgroundImage: 'url(https://images.pexels.com/photos/1000593/pexels-photo-1000593.jpeg?auto=compress&cs=tinysrgb&w=1920&dpr=2)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      },

      sky_sunset: {
        backgroundImage: 'url(https://images.pexels.com/photos/158163/clouds-cloudporn-weather-lookup-158163.jpeg?auto=compress&cs=tinysrgb&w=1920&dpr=2)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      },
      sky_clouds: {
        backgroundImage: 'url(https://images.pexels.com/photos/531767/pexels-photo-531767.jpeg?auto=compress&cs=tinysrgb&w=1920&dpr=2)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      },
      sky_sunrise: {
        backgroundImage: 'url(https://images.pexels.com/photos/1431822/pexels-photo-1431822.jpeg?auto=compress&cs=tinysrgb&w=1920&dpr=2)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      },
      sky_storm: {
        backgroundImage: 'url(https://images.pexels.com/photos/1054218/pexels-photo-1054218.jpeg?auto=compress&cs=tinysrgb&w=1920&dpr=2)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      },
      sky_blue: {
        backgroundImage: 'url(https://images.pexels.com/photos/281260/pexels-photo-281260.jpeg?auto=compress&cs=tinysrgb&w=1920&dpr=2)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      },

      universe_galaxy: {
        backgroundImage: 'url(https://images.pexels.com/photos/1169754/pexels-photo-1169754.jpeg?auto=compress&cs=tinysrgb&w=1920&dpr=2)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      },
      universe_stars: {
        backgroundImage: 'url(https://images.pexels.com/photos/1252890/pexels-photo-1252890.jpeg?auto=compress&cs=tinysrgb&w=1920&dpr=2)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      },
      universe_nebula: {
        backgroundImage: 'url(https://images.pexels.com/photos/816608/pexels-photo-816608.jpeg?auto=compress&cs=tinysrgb&w=1920&dpr=2)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      },
      universe_moon: {
        backgroundImage: 'url(https://images.pexels.com/photos/1246437/pexels-photo-1246437.jpeg?auto=compress&cs=tinysrgb&w=1920&dpr=2)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      },
      universe_aurora: {
        backgroundImage: 'url(https://images.pexels.com/photos/1933316/pexels-photo-1933316.jpeg?auto=compress&cs=tinysrgb&w=1920&dpr=2)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      },

      solid: { background: '#ffffff' },
    };
    return backgrounds[bg] || backgrounds.gradient;
  };

  const emojis = [
    '😊', '😂', '🥰', '😍', '🤗', '😌', '🙏', '💪',
    '✨', '🌟', '💫', '🌈', '☀️', '🌸', '🌺', '🌻',
    '💖', '💕', '💗', '💝', '🎉', '🎊', '🎈', '🔥',
    '👍', '👏', '🤝', '💯', '✅', '⭐', '🏆', '🎯'
  ];

  return (
    <div className="flex h-full bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
      <div className={`${showSidebar ? 'w-64' : 'w-16'} bg-gray-50 border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b border-gray-200 space-y-2">
          {showSidebar ? (
            <>
              <button
                onClick={() => createNewSession('reframe')}
                className="w-full flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white rounded-xl hover:shadow-lg transition-all active:scale-95 text-sm font-medium"
              >
                <Brain className="w-4 h-4" />
                <span>Reframe Mode</span>
              </button>
              <button
                onClick={() => createNewSession('journal')}
                className="w-full flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white rounded-xl hover:shadow-lg transition-all active:scale-95 text-sm font-medium"
              >
                <BookOpen className="w-4 h-4" />
                <span>Journal Mode</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => createNewSession('reframe')}
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
                      ? session.journal_mode === 'journal'
                        ? 'bg-gradient-to-r from-emerald-100 to-teal-100'
                        : 'bg-gradient-to-r from-pink-100 to-purple-100'
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => setCurrentSessionId(session.id)}
                >
                  {session.journal_mode === 'journal' ? (
                    <BookOpen className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <Brain className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  )}
                  <span className="text-sm text-gray-700 truncate flex-1">{session.title}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(session.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
                    title="Delete this conversation"
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
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Chat Mode</h3>

                  <div className="mb-6">
                    <p className="text-sm font-medium text-gray-700 mb-3">Select Your Mode</p>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => {
                          if (currentSessionId) {
                            const session = sessions.find(s => s.id === currentSessionId);
                            if (session?.journal_mode !== 'reframe') {
                              createNewSession('reframe');
                            }
                          } else {
                            createNewSession('reframe');
                          }
                        }}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          journalMode === 'reframe'
                            ? 'border-purple-400 bg-gradient-to-br from-pink-50 to-purple-50'
                            : 'border-gray-200 bg-white hover:border-purple-200'
                        }`}
                      >
                        <Brain className={`w-8 h-8 mx-auto mb-2 ${journalMode === 'reframe' ? 'text-purple-600' : 'text-gray-400'}`} />
                        <p className="font-semibold text-sm text-gray-800">Reframe Mode</p>
                        <p className="text-xs text-gray-500 mt-1">Get help reframing negative thoughts</p>
                      </button>
                      <button
                        onClick={() => {
                          if (currentSessionId) {
                            const session = sessions.find(s => s.id === currentSessionId);
                            if (session?.journal_mode !== 'journal') {
                              createNewSession('journal');
                            }
                          } else {
                            createNewSession('journal');
                          }
                        }}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          journalMode === 'journal'
                            ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50'
                            : 'border-gray-200 bg-white hover:border-emerald-200'
                        }`}
                      >
                        <BookOpen className={`w-8 h-8 mx-auto mb-2 ${journalMode === 'journal' ? 'text-emerald-600' : 'text-gray-400'}`} />
                        <p className="font-semibold text-sm text-gray-800">Journal Mode</p>
                        <p className="text-xs text-gray-500 mt-1">Express freely without suggestions</p>
                      </button>
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                      <p className="text-xs text-blue-800">
                        <span className="font-semibold">Current: </span>
                        {journalMode === 'journal'
                          ? 'Journal Mode - A safe space for reflective writing'
                          : 'Reframe Mode - Cognitive reframing assistance'}
                      </p>
                    </div>
                  </div>
                </div>

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
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Chat Appearance</h3>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-3">Background Theme</p>
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Nature</p>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: 'nature_waterfall', name: 'Waterfall', preview: 'https://images.pexels.com/photos/2132126/pexels-photo-2132126.jpeg?auto=compress&cs=tinysrgb&w=400' },
                              { id: 'nature_forest', name: 'Forest', preview: 'https://images.pexels.com/photos/1576161/pexels-photo-1576161.jpeg?auto=compress&cs=tinysrgb&w=400' },
                              { id: 'nature_mountains', name: 'Mountains', preview: 'https://images.pexels.com/photos/1266810/pexels-photo-1266810.jpeg?auto=compress&cs=tinysrgb&w=400' },
                              { id: 'nature_lake', name: 'Lake', preview: 'https://images.pexels.com/photos/1438761/pexels-photo-1438761.jpeg?auto=compress&cs=tinysrgb&w=400' },
                              { id: 'nature_beach', name: 'Beach', preview: 'https://images.pexels.com/photos/1032650/pexels-photo-1032650.jpeg?auto=compress&cs=tinysrgb&w=400' },
                            ].map((bg) => (
                              <button
                                key={bg.id}
                                onClick={() => updateChatBackground(bg.id)}
                                className={`relative p-2 rounded-xl transition-all overflow-hidden ${
                                  chatBackground === bg.id
                                    ? 'ring-2 ring-pink-400 scale-105'
                                    : 'hover:scale-105'
                                }`}
                              >
                                <img src={bg.preview} alt={bg.name} className="h-16 w-full object-cover rounded-lg mb-1" />
                                <p className="text-xs font-medium text-gray-700">{bg.name}</p>
                                {chatBackground === bg.id && (
                                  <div className="absolute top-3 right-3 w-3 h-3 bg-pink-500 rounded-full border-2 border-white"></div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Animals</p>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: 'animals_butterfly', name: 'Butterfly', preview: 'https://images.pexels.com/photos/56866/garden-flower-butterfly-summer-56866.jpeg?auto=compress&cs=tinysrgb&w=400' },
                              { id: 'animals_birds', name: 'Birds', preview: 'https://images.pexels.com/photos/349758/hummingbird-bird-birds-349758.jpeg?auto=compress&cs=tinysrgb&w=400' },
                              { id: 'animals_deer', name: 'Deer', preview: 'https://images.pexels.com/photos/247376/pexels-photo-247376.jpeg?auto=compress&cs=tinysrgb&w=400' },
                              { id: 'animals_cats', name: 'Cats', preview: 'https://images.pexels.com/photos/1170986/pexels-photo-1170986.jpeg?auto=compress&cs=tinysrgb&w=400' },
                              { id: 'animals_dogs', name: 'Dogs', preview: 'https://images.pexels.com/photos/1805164/pexels-photo-1805164.jpeg?auto=compress&cs=tinysrgb&w=400' },
                            ].map((bg) => (
                              <button
                                key={bg.id}
                                onClick={() => updateChatBackground(bg.id)}
                                className={`relative p-2 rounded-xl transition-all overflow-hidden ${
                                  chatBackground === bg.id
                                    ? 'ring-2 ring-pink-400 scale-105'
                                    : 'hover:scale-105'
                                }`}
                              >
                                <img src={bg.preview} alt={bg.name} className="h-16 w-full object-cover rounded-lg mb-1" />
                                <p className="text-xs font-medium text-gray-700">{bg.name}</p>
                                {chatBackground === bg.id && (
                                  <div className="absolute top-3 right-3 w-3 h-3 bg-pink-500 rounded-full border-2 border-white"></div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Abstract</p>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: 'abstract_colors', name: 'Colors', preview: 'https://images.pexels.com/photos/2693208/pexels-photo-2693208.png?auto=compress&cs=tinysrgb&w=400' },
                              { id: 'abstract_waves', name: 'Waves', preview: 'https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg?auto=compress&cs=tinysrgb&w=400' },
                              { id: 'abstract_geometric', name: 'Geometric', preview: 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=400' },
                              { id: 'abstract_fluid', name: 'Fluid', preview: 'https://images.pexels.com/photos/1509582/pexels-photo-1509582.jpeg?auto=compress&cs=tinysrgb&w=400' },
                              { id: 'abstract_marble', name: 'Marble', preview: 'https://images.pexels.com/photos/1000593/pexels-photo-1000593.jpeg?auto=compress&cs=tinysrgb&w=400' },
                            ].map((bg) => (
                              <button
                                key={bg.id}
                                onClick={() => updateChatBackground(bg.id)}
                                className={`relative p-2 rounded-xl transition-all overflow-hidden ${
                                  chatBackground === bg.id
                                    ? 'ring-2 ring-pink-400 scale-105'
                                    : 'hover:scale-105'
                                }`}
                              >
                                <img src={bg.preview} alt={bg.name} className="h-16 w-full object-cover rounded-lg mb-1" />
                                <p className="text-xs font-medium text-gray-700">{bg.name}</p>
                                {chatBackground === bg.id && (
                                  <div className="absolute top-3 right-3 w-3 h-3 bg-pink-500 rounded-full border-2 border-white"></div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Sky & Universe</p>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: 'sky_sunset', name: 'Sunset', preview: 'https://images.pexels.com/photos/158163/clouds-cloudporn-weather-lookup-158163.jpeg?auto=compress&cs=tinysrgb&w=400' },
                              { id: 'sky_clouds', name: 'Clouds', preview: 'https://images.pexels.com/photos/531767/pexels-photo-531767.jpeg?auto=compress&cs=tinysrgb&w=400' },
                              { id: 'sky_sunrise', name: 'Sunrise', preview: 'https://images.pexels.com/photos/1431822/pexels-photo-1431822.jpeg?auto=compress&cs=tinysrgb&w=400' },
                              { id: 'sky_storm', name: 'Storm', preview: 'https://images.pexels.com/photos/1054218/pexels-photo-1054218.jpeg?auto=compress&cs=tinysrgb&w=400' },
                              { id: 'sky_blue', name: 'Blue Sky', preview: 'https://images.pexels.com/photos/281260/pexels-photo-281260.jpeg?auto=compress&cs=tinysrgb&w=400' },
                              { id: 'universe_galaxy', name: 'Galaxy', preview: 'https://images.pexels.com/photos/1169754/pexels-photo-1169754.jpeg?auto=compress&cs=tinysrgb&w=400' },
                              { id: 'universe_stars', name: 'Stars', preview: 'https://images.pexels.com/photos/1252890/pexels-photo-1252890.jpeg?auto=compress&cs=tinysrgb&w=400' },
                              { id: 'universe_nebula', name: 'Nebula', preview: 'https://images.pexels.com/photos/816608/pexels-photo-816608.jpeg?auto=compress&cs=tinysrgb&w=400' },
                              { id: 'universe_moon', name: 'Moon', preview: 'https://images.pexels.com/photos/1246437/pexels-photo-1246437.jpeg?auto=compress&cs=tinysrgb&w=400' },
                              { id: 'universe_aurora', name: 'Aurora', preview: 'https://images.pexels.com/photos/1933316/pexels-photo-1933316.jpeg?auto=compress&cs=tinysrgb&w=400' },
                            ].map((bg) => (
                              <button
                                key={bg.id}
                                onClick={() => updateChatBackground(bg.id)}
                                className={`relative p-2 rounded-xl transition-all overflow-hidden ${
                                  chatBackground === bg.id
                                    ? 'ring-2 ring-pink-400 scale-105'
                                    : 'hover:scale-105'
                                }`}
                              >
                                <img src={bg.preview} alt={bg.name} className="h-16 w-full object-cover rounded-lg mb-1" />
                                <p className="text-xs font-medium text-gray-700">{bg.name}</p>
                                {chatBackground === bg.id && (
                                  <div className="absolute top-3 right-3 w-3 h-3 bg-pink-500 rounded-full border-2 border-white"></div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Simple</p>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: 'gradient', name: 'Gradient', preview: null, previewStyle: 'bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100' },
                              { id: 'solid', name: 'Clean', preview: null, previewStyle: 'bg-white border-2 border-gray-200' },
                            ].map((bg) => (
                              <button
                                key={bg.id}
                                onClick={() => updateChatBackground(bg.id)}
                                className={`relative p-2 rounded-xl transition-all overflow-hidden ${
                                  chatBackground === bg.id
                                    ? 'ring-2 ring-pink-400 scale-105'
                                    : 'hover:scale-105'
                                }`}
                              >
                                {bg.preview ? (
                                  <img src={bg.preview} alt={bg.name} className="h-16 w-full object-cover rounded-lg mb-1" />
                                ) : (
                                  <div className={`h-16 w-full rounded-lg mb-1 ${bg.previewStyle}`}></div>
                                )}
                                <p className="text-xs font-medium text-gray-700">{bg.name}</p>
                                {chatBackground === bg.id && (
                                  <div className="absolute top-3 right-3 w-3 h-3 bg-pink-500 rounded-full border-2 border-white"></div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        {customBackgrounds.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Custom Uploads</p>
                            <div className="grid grid-cols-3 gap-2">
                              {customBackgrounds.map((bg, index) => (
                                <button
                                  key={`custom_${index}`}
                                  onClick={() => updateChatBackground(`custom_${bg}`)}
                                  className={`relative p-2 rounded-xl transition-all overflow-hidden ${
                                    chatBackground === `custom_${bg}`
                                      ? 'ring-2 ring-pink-400 scale-105'
                                      : 'hover:scale-105'
                                  }`}
                                >
                                  <img src={bg} alt="Custom" className="h-16 w-full object-cover rounded-lg mb-1" />
                                  <p className="text-xs font-medium text-gray-700">Custom {index + 1}</p>
                                  {chatBackground === `custom_${bg}` && (
                                    <div className="absolute top-3 right-3 w-3 h-3 bg-pink-500 rounded-full border-2 border-white"></div>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Upload Custom Image</p>
                          <label className="block">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleCustomImageUpload}
                              className="hidden"
                              id="custom-bg-upload"
                            />
                            <div className="cursor-pointer p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-pink-400 transition-all text-center">
                              <Palette className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm font-medium text-gray-700">Click to upload</p>
                              <p className="text-xs text-gray-500 mt-1">Max 5MB, HD/4K recommended</p>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Emoji Picker</p>
                        <p className="text-xs text-gray-500">Quick emoji access in chat</p>
                      </div>
                      <button
                        onClick={() => updateEmojiEnabled(!emojiEnabled)}
                        className={`relative w-12 h-6 rounded-full transition-all ${
                          emojiEnabled ? 'bg-gradient-to-r from-pink-500 to-purple-500' : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            emojiEnabled ? 'transform translate-x-6' : ''
                          }`}
                        />
                      </button>
                    </div>
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
            <div className={`p-6 ${journalMode === 'journal' ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500' : 'bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center ${isSpeaking ? 'animate-pulse' : ''}`}>
                    {journalMode === 'journal' ? <BookOpen className="w-5 h-5 text-white" /> : <Brain className="w-5 h-5 text-white" />}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      {journalMode === 'journal' ? 'Journal Mode' : 'Mindshift Assistant'}
                    </h2>
                    <p className="text-sm text-white/80">
                      {journalMode === 'journal'
                        ? 'A safe space to express your thoughts'
                        : isSpeaking ? 'Speaking...' : 'Here to help you reframe your thoughts'}
                    </p>
                  </div>
                </div>
                {journalMode === 'reframe' && (
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
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 relative" style={getBackgroundStyle(chatBackground)}>
              <div className="absolute inset-0 bg-white/70 backdrop-blur-sm"></div>
              <div className="relative z-10 space-y-4">
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
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100">
              {emojiEnabled && showEmojiPicker && (
                <div className="mb-3 p-4 bg-white rounded-2xl shadow-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Quick Emojis</p>
                    <button
                      onClick={() => setShowEmojiPicker(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="grid grid-cols-8 gap-2">
                    {emojis.map((emoji, index) => (
                      <button
                        key={index}
                        onClick={() => insertEmoji(emoji)}
                        className="text-2xl hover:scale-125 transition-transform active:scale-100 p-1"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
                {emojiEnabled && (
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    disabled={loading}
                    className="px-6 py-3 bg-white border-2 border-purple-500 text-purple-500 rounded-2xl hover:shadow-lg transform hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                    title="Emoji picker"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                )}
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
