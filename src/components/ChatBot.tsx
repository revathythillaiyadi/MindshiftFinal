import { useState, useEffect, useRef } from 'react';
import { Send, Sparkles } from 'lucide-react';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadMessages();
    }
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
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-[#A8D5BA] to-[#B4C7E7] p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Mindshift Assistant</h2>
            <p className="text-sm text-white/80">Here to help you reframe your thoughts</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#A8D5BA] to-[#B4C7E7] rounded-2xl mb-4 opacity-20">
              <Sparkles className="w-8 h-8 text-white" />
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
              className={`max-w-[80%] px-5 py-3 rounded-2xl ${
                message.role === 'user'
                  ? 'bg-[#A8D5BA]/20 text-gray-800 rounded-br-md'
                  : 'bg-[#B4C7E7]/20 text-gray-800 rounded-bl-md'
              }`}
            >
              <p className="text-sm leading-relaxed">{message.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#B4C7E7]/20 px-5 py-3 rounded-2xl rounded-bl-md">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-[#B4C7E7] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-[#B4C7E7] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-[#B4C7E7] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
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
            placeholder="Share what's on your mind..."
            className="flex-1 px-5 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#A8D5BA] focus:border-transparent transition-all text-sm"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="px-6 py-3 bg-gradient-to-r from-[#A8D5BA] to-[#B4C7E7] text-white rounded-2xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
