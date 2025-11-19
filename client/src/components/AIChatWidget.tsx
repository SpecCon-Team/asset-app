import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, User, Minimize2, Maximize2, Trash2 } from 'lucide-react';
import { getApiClient } from '@/features/assets/lib/apiClient';
import { getCurrentUserId } from '@/features/auth/hooks';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Use useMemo to prevent re-calling getCurrentUserId on every render
  const userId = useRef(getCurrentUserId()).current;

  // Generate user-specific localStorage keys (memoized)
  const chatHistoryKey = `aiChatHistory_${userId || 'guest'}`;
  const welcomeShownKey = `aiChatWelcomeShown_${userId || 'guest'}`;

  // Load chat history from localStorage when component mounts or user changes
  useEffect(() => {
    if (!userId) return;

    const savedMessages = localStorage.getItem(chatHistoryKey);
    const welcomeShown = localStorage.getItem(welcomeShownKey);

    if (savedMessages) {
      const parsed = JSON.parse(savedMessages);
      setMessages(parsed.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })));
    } else {
      // Clear messages if no saved history for this user
      setMessages([]);
    }

    if (welcomeShown) {
      setHasShownWelcome(true);
    } else {
      setHasShownWelcome(false);
    }
  }, []); // Only run once on mount

  // Save chat history to localStorage (user-specific)
  useEffect(() => {
    if (!userId) return;

    if (messages.length > 0) {
      localStorage.setItem(chatHistoryKey, JSON.stringify(messages));
    }
  }, [messages, userId, chatHistoryKey]); // Add chatHistoryKey to deps

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Show welcome message when first opened
  useEffect(() => {
    if (isOpen && !hasShownWelcome && messages.length === 0 && userId) {
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Hello! I'm your AI assistant for AssetTrack Pro. I can help you with:\n\n• Managing your assets and tickets\n• Troubleshooting issues\n• Answering questions about the system\n• Navigating features\n• General support\n\nHow can I assist you today?",
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
      setHasShownWelcome(true);
      localStorage.setItem(welcomeShownKey, 'true');
    }
  }, [isOpen, hasShownWelcome, messages.length, userId, welcomeShownKey]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const apiClient = getApiClient();
      const response = await apiClient.post('/ai-chat', {
        message: userMessage.content,
        history: messages.slice(-10) // Send last 10 messages for context
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.reply,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('AI Chat error:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment or contact support if the issue persists.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearHistory = () => {
    setMessages([]);
    setHasShownWelcome(false);
    if (userId) {
      localStorage.removeItem(getChatHistoryKey());
      localStorage.removeItem(getWelcomeShownKey());
    }
  };

  // Clear conversation when widget is closed
  const handleClose = () => {
    setIsOpen(false);
    clearHistory();
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 group"
          aria-label="Open AI Chat"
        >
          <div className="relative">
            {/* Animated pulse ring */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full animate-ping opacity-75"></div>

            {/* Main button */}
            <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full shadow-2xl transition-all duration-300 transform group-hover:scale-110 p-4">
              <MessageCircle className="w-6 h-6" />
            </div>

            {/* Badge */}
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-bounce">
              AI
            </div>
          </div>

          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap">
            <div className="font-semibold">Live Chat</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Available 24/7</div>
            <div className="absolute top-full right-4 border-4 border-transparent border-t-white dark:border-t-gray-800"></div>
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 ease-in-out
            ${isMinimized ? 'bottom-6 right-6 w-80' : 'bottom-6 right-6 w-96 h-[600px] md:w-[420px]'}
            max-w-[calc(100vw-3rem)] max-h-[calc(100vh-3rem)]
          `}
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col h-full border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 backdrop-blur-sm p-2 rounded-full">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="text-white">
                  <div className="font-semibold text-lg">AI Assistant</div>
                  <div className="text-xs text-white/90 flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    Available 24/7
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label={isMinimized ? "Maximize" : "Minimize"}
                >
                  {isMinimized ? (
                    <Maximize2 className="w-4 h-4 text-white" />
                  ) : (
                    <Minimize2 className="w-4 h-4 text-white" />
                  )}
                </button>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="Close chat"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      {/* Avatar */}
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          message.role === 'user'
                            ? 'bg-blue-600'
                            : 'bg-gradient-to-r from-purple-600 to-blue-600'
                        }`}
                      >
                        {message.role === 'user' ? (
                          <User className="w-4 h-4 text-white" />
                        ) : (
                          <Bot className="w-4 h-4 text-white" />
                        )}
                      </div>

                      {/* Message Bubble */}
                      <div
                        className={`flex-1 max-w-[80%] ${
                          message.role === 'user' ? 'items-end' : 'items-start'
                        }`}
                      >
                        <div
                          className={`rounded-2xl px-4 py-2 ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white rounded-br-sm'
                              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-sm'
                          }`}
                        >
                          <div className="text-sm whitespace-pre-wrap break-words">
                            {message.content}
                          </div>
                        </div>
                        <div
                          className={`text-xs text-gray-500 dark:text-gray-400 mt-1 px-2 ${
                            message.role === 'user' ? 'text-right' : 'text-left'
                          }`}
                        >
                          {formatTime(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Loading indicator */}
                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-sm px-4 py-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
                  {messages.length > 1 && (
                    <button
                      onClick={clearHistory}
                      className="text-xs text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 mb-2 flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear conversation
                    </button>
                  )}
                  <div className="flex gap-2">
                    <textarea
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      rows={1}
                      className="flex-1 resize-none border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white text-sm max-h-32"
                      disabled={isLoading}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isLoading}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
                      aria-label="Send message"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                    Press Enter to send, Shift+Enter for new line
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
