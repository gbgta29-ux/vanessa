'use client'

import { useEffect, useRef } from 'react';
import type { Message } from '@/types/message';
import ChatMessage from './chat-message';
import { Mic } from 'lucide-react';

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  loadingText?: string;
  autoPlayingAudioId?: number | null;
}

export default function ChatMessages({ messages, isLoading, loadingText = "digitando...", autoPlayingAudioId }: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, isLoading, loadingText]);

  const isRecording = loadingText.toLowerCase().includes("gravando");

  return (
    <div className="p-3 sm:p-4 flex-1 flex flex-col">
      <div className="flex-1" />
      {messages.map((msg) => (
        <ChatMessage 
          key={msg.id} 
          message={msg} 
          isAutoPlaying={msg.id === autoPlayingAudioId} 
        />
      ))}

      {isLoading && (
        <div className="flex justify-start mb-2 animate-fadeIn">
          <div className="rounded-2xl rounded-tl-sm py-2 px-3.5 max-w-[280px] bg-white text-black shadow-sm flex items-center border border-gray-100">
            {isRecording ? (
              <div className="flex items-center gap-2 text-gray-700">
                <div className="relative flex items-center justify-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping absolute"></span>
                  <Mic className="h-4 w-4 text-red-500 relative z-10" />
                </div>
                <span className="text-xs font-medium text-gray-600">gravando áudio...</span>
                <div className="flex items-center gap-1 ml-1.5 h-4">
                  <span className="w-1 bg-red-400 rounded-full animate-pulse h-2.5"></span>
                  <span className="w-1 bg-red-500 rounded-full animate-pulse h-4 [animation-delay:150ms]"></span>
                  <span className="w-1 bg-red-400 rounded-full animate-pulse h-1.5 [animation-delay:300ms]"></span>
                  <span className="w-1 bg-red-500 rounded-full animate-pulse h-3 [animation-delay:450ms]"></span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 py-1 px-1">
                <span className="text-xs text-gray-500 font-medium mr-1">digitando</span>
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-300ms]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-150ms]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"></span>
              </div>
            )}
          </div>
        </div>
      )}
      <div ref={scrollRef} />
    </div>
  );
}
