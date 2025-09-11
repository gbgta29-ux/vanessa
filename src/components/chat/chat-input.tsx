
'use client'

import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mic, ArrowUp, Smile, Paperclip } from 'lucide-react';

interface ChatInputProps {
  formAction: (formData: FormData) => Promise<void>;
  disabled: boolean;
}

export default function ChatInput({ formAction, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  
  const handleFormSubmit = async (formData: FormData) => {
    if (message.trim()) {
      formAction(formData);
      setMessage('');
    }
  }

  return (
    <div className="flex items-center p-2.5 bg-background border-t border-border/20 shrink-0">
      <form ref={formRef} action={handleFormSubmit} className="flex-grow flex items-center gap-2.5">
        <div className="flex-grow bg-white rounded-full flex items-center px-4 shadow-lg ring-1 ring-primary/50 shadow-primary/30">
          <button type="button" aria-label="Emoji">
            <Smile className="text-muted-foreground" />
          </button>
          <Input 
            name="message" 
            placeholder="Mensagem" 
            className="flex-1 border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent h-11 p-0 ml-2"
            autoComplete="off"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={disabled}
          />
          <button type="button" aria-label="Attach file">
            <Paperclip className="text-muted-foreground" />
          </button>
        </div>
        <Button 
          type="submit"
          className="w-12 h-12 rounded-full bg-primary hover:bg-primary/90 shrink-0 shadow-lg"
          disabled={disabled || !message.trim()}
          aria-label={message.trim() ? 'Enviar mensagem' : 'Gravar áudio'}
        >
          {message.trim() ? <ArrowUp className="text-white" /> : <Mic className="text-white" />}
        </Button>
      </form>
    </div>
  );
}
