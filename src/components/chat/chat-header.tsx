import Image from 'next/image';
import { ArrowLeft, Video, Phone, MoreVertical, Mic } from 'lucide-react';

interface ChatHeaderProps {
  statusText?: string;
}

export default function ChatHeader({ statusText = "online" }: ChatHeaderProps) {
  const isTyping = statusText.toLowerCase().includes("digitando");
  const isRecording = statusText.toLowerCase().includes("gravando");

  return (
    <header className="flex items-center p-2.5 bg-white text-black shadow-sm z-10 shrink-0">
      <button aria-label="Voltar" className="p-2 -ml-2 text-gray-700 hover:text-black">
        <ArrowLeft className="h-6 w-6" />
      </button>
      <div className="relative">
        <Image
          src="https://vootlkuyzwzvpxcfkfzk.supabase.co/storage/v1/object/public/public-files/1792440503168-d50kbr.jpg"
          data-ai-hint="woman profile"
          alt="Vanessa ❤"
          width={40}
          height={40}
          className="rounded-full object-cover aspect-square"
        />
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
      </div>
      <div className="ml-3 flex-1 min-w-0">
        <h1 className="font-semibold text-base leading-tight truncate">Vanessa ❤</h1>
        {isRecording ? (
          <p className="text-xs text-[#25D366] font-medium leading-tight flex items-center gap-1 animate-pulse">
            <Mic className="h-3 w-3 text-[#25D366]" />
            gravando áudio...
          </p>
        ) : isTyping ? (
          <p className="text-xs text-[#25D366] font-medium leading-tight animate-pulse">
            digitando...
          </p>
        ) : (
          <p className="text-xs text-gray-500 leading-tight">online</p>
        )}
      </div>
      <div className="flex items-center space-x-1 text-gray-700">
        <button aria-label="Video Call" className="p-2 hover:bg-gray-100 rounded-full">
          <Video className="h-5 w-5" />
        </button>
        <button aria-label="Voice Call" className="p-2 hover:bg-gray-100 rounded-full">
          <Phone className="h-5 w-5" />
        </button>
        <button aria-label="More options" className="p-2 hover:bg-gray-100 rounded-full">
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
