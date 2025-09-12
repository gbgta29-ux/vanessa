import Image from 'next/image';
import { ArrowLeft, Video, Phone, MoreVertical } from 'lucide-react';

export default function ChatHeader() {
  return (
    <header className="flex items-center p-2.5 bg-white text-black shadow-sm z-10 shrink-0">
      <button aria-label="Voltar" className="p-2 -ml-2">
        <ArrowLeft className="h-6 w-6" />
      </button>
      <Image
        src="https://imperiumfragrance.shop/wp-content/uploads/2025/09/viral_beautiez_520810178_18016258871725225_2900008484888866208_n-1.webp"
        data-ai-hint="woman profile"
        alt="Rafa ❤"
        width={40}
        height={40}
        className="rounded-full object-cover aspect-square"
      />
      <div className="ml-3 flex-1">
        <h1 className="font-semibold text-base leading-tight">Rafa ❤</h1>
        <p className="text-xs text-gray-600 leading-tight">online</p>
      </div>
      <div className="flex items-center space-x-1">
        <button aria-label="Video Call" className="p-2">
          <Video className="h-6 w-6" />
        </button>
        <button aria-label="Voice Call" className="p-2">
          <Phone className="h-6 w-6" />
        </button>
        <button aria-label="More options" className="p-2">
          <MoreVertical className="h-6 w-6" />
        </button>
      </div>
    </header>
  );
}
