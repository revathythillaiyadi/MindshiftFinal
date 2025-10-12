import { useState, useEffect, useRef } from 'react';
import { Send, Brain, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { supabase, ChatMessage } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const reframingPrompts = [
  "That sounds challenging. What might be a different way to look at this situation?",
  "I hear you. What's one small positive aspect you can find in this experience?",
  "Thank you for sharing. How might this challenge be helping you grow?",
  "I understand. What would you tell a friend going through something similar?",
  "That's tough. What strength are you discovering in yourself through this?",
];

export function ChatBot() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadMessages();
    }

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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(50);

    if (data) {
      setMessages(data);
    }
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
    if (!input.trim() || !user || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      user_id: user.id,
      role: 'user',
      content: userMessage,
      reframed_content: null,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);

    await supabase.from('chat_messages').insert({
      user_id: user.id,
      role: 'user',
      content: userMessage,
    });

    setTimeout(async () => {
      const responseContent = generateReframingResponse(userMessage);

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        user_id: user.id,
        role: 'assistant',
        content: responseContent,
        reframed_content: null,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMsg]);

      await supabase.from('chat_messages').insert({
        user_id: user.id,
        role: 'assistant',
        content: responseContent,
      });

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

  const speakText = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
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
              setVoiceEnabled(!voiceEnabled);
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
    </div>
  );
}
