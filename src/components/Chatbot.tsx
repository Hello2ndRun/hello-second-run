import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../AuthContext';
import { MessageCircle, X, Send, Sparkles, Trash2 } from 'lucide-react';

export default function Chatbot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  if (!user) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsThinking(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, history: messages }),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data = await res.json();
      setMessages(prev => [...prev, { role: 'model', text: data.text || 'Sorry, I could not generate a response.' }]);
    } catch (error) {
      console.error("Chatbot error:", error);
      setMessages(prev => [...prev, { role: 'model', text: 'An error occurred. Please try again.' }]);
    } finally {
      setIsThinking(false);
    }
  };

  const clearChat = () => setMessages([]);

  const quickActions = [
    'How do I create a listing?',
    'What categories are available?',
    'How does AI matching work?',
  ];

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all z-50 ${
          isOpen
            ? 'bg-gray-800 text-white hover:bg-gray-700'
            : 'bg-[#1a472a] text-white hover:bg-[#8cc63f] hover:text-[#1a472a] border-2 border-[#1a472a] hover:border-[#8cc63f]'
        }`}
      >
        {isOpen ? <X size={20} /> : <MessageCircle size={20} />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[380px] max-w-[calc(100vw-48px)] h-[520px] bg-white shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden animate-slide-in-right">
          {/* Header */}
          <div className="bg-[#1a472a] text-white p-4 flex justify-between items-center flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#8cc63f]/20 rounded-full flex items-center justify-center">
                <Sparkles size={14} className="text-[#8cc63f]" />
              </div>
              <div>
                <h3 className="font-black uppercase tracking-widest text-xs">AI Assistant</h3>
                <p className="text-[9px] text-[#8cc63f] uppercase tracking-widest">Powered by Claude</p>
              </div>
            </div>
            {messages.length > 0 && (
              <button onClick={clearChat} className="p-1.5 hover:bg-white/10 transition-colors" title="Clear chat">
                <Trash2 size={14} className="text-white/60" />
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-grow p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3">
            {messages.length === 0 && (
              <div className="text-center my-auto px-4">
                <div className="w-12 h-12 bg-[#8cc63f]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles size={20} className="text-[#8cc63f]" />
                </div>
                <p className="text-sm font-bold text-gray-700 mb-1">How can I help?</p>
                <p className="text-xs text-gray-400 mb-6">Ask about the platform, supply chains, or market trends.</p>
                <div className="space-y-2">
                  {quickActions.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => { setInput(action); inputRef.current?.focus(); }}
                      className="block w-full text-left text-xs bg-white border border-gray-200 px-3 py-2.5 hover:border-[#8cc63f] hover:bg-[#8cc63f]/5 transition-all"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`max-w-[85%] ${
                  msg.role === 'user'
                    ? 'self-end bg-[#1a472a] text-white'
                    : 'self-start bg-white border border-gray-200 text-gray-800'
                } p-3 text-sm`}
              >
                {msg.role === 'model' ? (
                  <div className="prose prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0.5">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                ) : (
                  msg.text
                )}
              </div>
            ))}

            {isThinking && (
              <div className="self-start bg-white border border-gray-200 text-gray-500 p-3 text-sm flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-[#8cc63f] rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-[#8cc63f] rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                  <div className="w-1.5 h-1.5 bg-[#8cc63f] rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-200 flex gap-2 flex-shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="flex-grow bg-gray-50 border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-[#1a472a] transition-colors"
              disabled={isThinking}
            />
            <button
              type="submit"
              disabled={isThinking || !input.trim()}
              className="bg-[#1a472a] text-white p-2.5 hover:bg-[#8cc63f] hover:text-[#1a472a] transition-colors disabled:opacity-30"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
