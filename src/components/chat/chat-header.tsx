import Image from 'next/image';
import { ArrowLeft, Video, Phone, MoreVertical } from 'lucide-react';

export default function ChatHeader() {
  return (
    <header className="flex items-center p-2.5 bg-white text-black shadow-sm z-10 shrink-0">
      <button aria-label="Voltar" className="p-2 -ml-2">
        <ArrowLeft className="h-6 w-6" />
      </button>
      <Image
        src="https://scontent.fldb2-1.fna.fbcdn.net/v/t39.30808-6/494386039_122130416744835155_569158612006628541_n.jpg?stp=dst-jpg_s640x640_tt6&_nc_cat=108&ccb=1-7&_nc_sid=127cfc&_nc_ohc=uwpXJfAtJ0sQ7kNvwHsdPSO&_nc_oc=AdmYe5oeJpPRIbg9YZ-skjPUhMWW07HvvNva1oDmKu06IfDbBvcQJG3vGB-2jSAxRA1R2xFnrQtd5xrO3wKoRMsZ&_nc_zt=23&_nc_ht=scontent.fldb2-1.fna&_nc_gid=7yaGmpKX97x4XSEbMl8d9g&oh=00_AfbVpbBCbO1vY-v1MfiioG7DolkD53Ox08zbMzU_7Nx5SQ&oe=68C37BBA"
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
