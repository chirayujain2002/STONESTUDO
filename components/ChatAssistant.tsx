
import React, { useState, useRef, useEffect } from 'react';
import { Icon } from './Icon';
import Spinner from './Spinner';
import { ChatMessage } from '../types';

interface ChatAssistantProps {
  onSendMessage: (message: string) => Promise<void>;
  isProcessing: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ onSendMessage, isProcessing, isOpen, onClose }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'ai', text: 'Hi! I can help refine your design. Try saying "Make the room brighter" or "Change walls to blue".' }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);

    // Add a temporary thinking message
    // Note: The actual image generation happens in the parent component
    
    await onSendMessage(userMsg);
    
    setMessages(prev => [...prev, { role: 'ai', text: 'I\'ve updated the design based on your request.' }]);
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-4 right-4 z-30 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-ui-border flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200" style={{ height: 'calc(100% - 2rem)' }}>
      <div className="bg-brand-primary p-4 flex items-center justify-between text-white">
        <div className="flex items-center space-x-2">
            <Icon name="sparkles" className="w-5 h-5 text-yellow-300" />
            <span className="font-bold">AI Assistant</span>
        </div>
        <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors">
            <Icon name="close" className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.role === 'user' 
                  ? 'bg-brand-primary text-white rounded-tr-sm' 
                  : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isProcessing && (
           <div className="flex justify-start">
             <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center space-x-2">
               <Spinner className="w-4 h-4 text-brand-primary" />
               <span className="text-xs text-gray-500 font-medium">Generating new look...</span>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-ui-border">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your instruction..."
            className="w-full pl-4 pr-12 py-3 bg-gray-100 border-transparent focus:bg-white focus:border-brand-primary focus:ring-0 rounded-xl text-sm transition-all"
            disabled={isProcessing}
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isProcessing}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-brand-primary text-white rounded-lg disabled:opacity-50 hover:bg-brand-primary-hover transition-colors"
          >
            <Icon name="arrow-right" className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatAssistant;
