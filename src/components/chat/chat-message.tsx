
import { cn } from "@/lib/utils";
import type { Message } from "@/types/message";
import { Check, CheckCheck, Copy } from 'lucide-react';
import Image from "next/image";
import AudioPlayer from "./audio-player";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef } from "react";

interface ChatMessageProps {
  message: Message;
  isAutoPlaying?: boolean;
}

const MessageStatus = ({ status }: { status: Message['status'] }) => {
  if (status === 'sent') {
    return <Check className="h-4 w-4 ml-1 text-muted-foreground" aria-label="Sent" />;
  }
  if (status === 'delivered') {
    return <CheckCheck className="h-4 w-4 ml-1 text-muted-foreground" aria-label="Delivered" />;
  }
  if (status === 'read') {
    return <CheckCheck className="h-4 w-4 ml-1 text-sky-500" aria-label="Read" />;
  }
  return null;
}

export default function ChatMessage({ message, isAutoPlaying = false }: ChatMessageProps) {
  const isUser = message.sender === 'user';
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      if (message.type === 'video') {
        video.muted = false;
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => console.error("Video autoplay failed:", error));
        }
      }
    }
  }, [message.type]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Código PIX copiado!",
      description: "Agora é só colar no seu aplicativo do banco.",
    });
  };

  const TimeAndStatus = () => (
    <div className="flex justify-end items-center">
      <span className="text-xs text-muted-foreground mr-1">{message.timestamp}</span>
      {isUser && <MessageStatus status={message.status} />}
    </div>
  )

  const OverlayTimeAndStatus = () => (
     <div className="absolute bottom-1.5 right-1.5 bg-black/50 rounded-md px-1 py-0.5 flex items-center z-10">
        <span className="text-xs text-white/90 mr-1">{message.timestamp}</span>
        {isUser && <MessageStatus status={message.status} />}
      </div>
  )

  const renderContent = () => {
    switch (message.type) {
      case 'pix':
        if (!message.pixCopyPaste) return null;
        return (
          <div className="flex flex-col gap-3">
            <div>
              <p className="font-semibold text-sm">PIX Copia e Cola</p>
              <p className="text-xs text-muted-foreground">Clique no botão para copiar o código.</p>
            </div>
            <div className="border-t border-b border-border/20 py-2 my-2 text-center">
              <p className="text-sm text-muted-foreground">Valor a pagar</p>
              <p className="text-2xl font-bold text-primary">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(message.value || 0)}
              </p>
            </div>
            <div className="w-full space-y-2">
                <p className="bg-muted w-full text-xs text-left font-mono p-2 rounded-md break-all">{message.pixCopyPaste}</p>
                <Button onClick={() => handleCopyCode(message.pixCopyPaste!)} variant="outline" className="w-full">
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar código
                </Button>
            </div>
            <div className="mt-1 -mb-1"><TimeAndStatus /></div>
          </div>
        );
      case 'audio':
        return (
          <>
            <div className="flex items-center gap-2.5">
              <Image
                  src="https://scontent.fldb2-1.fna.fbcdn.net/v/t39.30808-6/494386039_122130416744835155_569158612006628541_n.jpg?stp=dst-jpg_s640x640_tt6&_nc_cat=108&ccb=1-7&_nc_sid=127cfc&_nc_ohc=uwpXJfAtJ0sQ7kNvwHsdPSO&_nc_oc=AdmYe5oeJpPRIbg9YZ-skjPUhMWW07HvvNva1oDmKu06IfDbBvcQJG3vGB-2jSAxRA1R2xFnrQtd5xrO3wKoRMsZ&_nc_zt=23&_nc_ht=scontent.fldb2-1.fna&_nc_gid=7yaGmpKX97x4XSEbMl8d9g&oh=00_AfbVpbBCbO1vY-v1MfiioG7DolkD53Ox08zbMzU_7Nx5SQ&oe=68C37BBA"
                  data-ai-hint="woman profile"
                  alt="Rafa ❤"
                  width={40}
                  height={40}
                  className="shrink-0 rounded-full object-cover aspect-square"
              />
              <div className="w-[240px] sm:w-[270px]">
                <AudioPlayer src={message.url!} autoplay={isAutoPlaying} onEnded={message.onEnded} />
              </div>
            </div>
            <div className="mt-1 pr-1"><TimeAndStatus /></div>
          </>
        );
      case 'image':
        return (
          <div className="relative">
            <Image
              src={message.url!}
              alt="Imagem enviada"
              width={300}
              height={300}
              className="rounded-md object-cover"
              data-ai-hint="sent image"
            />
            <OverlayTimeAndStatus />
          </div>
        );
      case 'video':
        return (
          <div className="relative">
            <video
              ref={videoRef}
              src={message.url!}
              autoPlay
              playsInline
              className="rounded-md object-cover w-full max-w-[300px]"
              data-ai-hint="story video"
            />
            <OverlayTimeAndStatus />
          </div>
        );
      case 'text':
      default:
        return (
          <>
            <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
            <div className="mt-1"><TimeAndStatus /></div>
          </>
        )
    }
  };

  return (
    <div className={cn("flex mb-2", isUser ? "justify-end" : "justify-start")}>
      <div className={cn(
        "rounded-lg shadow",
        isUser ? "bg-whatsapp-user-message" : "bg-white",
        (message.type === 'image' || message.type === 'video') ? 'p-1' :
        message.type === 'audio' ? 'py-2 px-2.5' :
        'p-2',
        "max-w-[85%] md:max-w-[75%]"
      )}>
        {renderContent()}
      </div>
    </div>
  );
}
