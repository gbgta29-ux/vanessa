"use client";

import { useState, useEffect, useRef } from "react";
import type { Message } from "@/types/message";
import { sendMessage, createPixCharge, checkPaymentStatus, type PixChargeData } from "@/app/actions";
import ChatHeader from "@/components/chat/chat-header";
import ChatMessages from "@/components/chat/chat-messages";
import ChatInput from "@/components/chat/chat-input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { RefreshCw, Play } from 'lucide-react';
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { track as fpixelTrack } from '@/lib/fpixel';

type FlowStep =
  | 'initial'
  | 'awaiting_icebreaker'
  | 'awaiting_call_permission'
  | 'awaiting_pix_payment'
  | 'payment_confirmed_awaiting_upsell_choice'
  | 'awaiting_upsell_pix_payment'
  | 'upsell_payment_confirmed'
  | 'flow_complete_video_only'
  | 'flow_rejected'
  | 'chat_mode';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Digitando...");
  const [autoPlayingAudioId, setAutoPlayingAudioId] = useState<number | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [flowStep, setFlowStep] = useState<FlowStep>('initial');
  const [userName, setUserName] = useState('');
  const [isCreatingPix, setIsCreatingPix] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [pixData, setPixData] = useState<PixChargeData | null>(null);
  const [upsellPixData, setUpsellPixData] = useState<PixChargeData | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const notificationSoundRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j")) ||
        (e.ctrlKey && (e.key === "U" || e.key === "u")) ||
        (e.ctrlKey && (e.key === "S" || e.key === "s"))
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const playNotificationSound = () => {
    notificationSoundRef.current?.play().catch(console.error);
  }

  const addMessage = (msg: Omit<Message, 'id' | 'timestamp' | 'status'>, sender: 'user' | 'bot'): Message => {
    if (sender === 'bot') {
      playNotificationSound();
    }
    const fullMessage: Message = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      status: sender === 'user' ? 'read' : 'sent',
      ...msg,
      sender,
    };
    setMessages(prev => [...prev, fullMessage]);
    return fullMessage;
  };

  const playAudioSequence = async (url: string, waitTime = 1500) => {
    playNotificationSound();
    await new Promise<void>(resolve => {
        const audioMessage = addMessage({ type: 'audio', url, onEnded: resolve }, 'bot');
        setAutoPlayingAudioId(audioMessage.id);
    });
    setAutoPlayingAudioId(null);
    await delay(waitTime);
  };
  
  const showLoadingIndicator = async (duration: number, text: string = "Digitando...") => {
      setLoadingText(text);
      setIsLoading(true);
      await delay(duration);
      setIsLoading(false);
  };

  useEffect(() => {
    const runWelcomeFlow = async () => {
      // Step 1: Entry
      await showLoadingIndicator(1500);
      addMessage({ type: 'text', text: "Oi… você veio por causa da minha foto né?" }, 'bot');
      await showLoadingIndicator(1500, "Gravando áudio...");
      await playAudioSequence('https://vootlkuyzwzvpxcfkfzk.supabase.co/storage/v1/object/public/public-files/1792441730793-p790dd.mp3');
      addMessage({ type: 'image', url: 'https://vootlkuyzwzvpxcfkfzk.supabase.co/storage/v1/object/public/public-files/1792440504276-6fe2u.jpg' }, 'bot');
      
      await delay(1500);

      // Step 2: Icebreaker
      await showLoadingIndicator(1500);
      addMessage({ type: 'text', text: "Gosta de mulher mais velha e safada?" }, 'bot');
      await showLoadingIndicator(1500, "Gravando áudio...");
      await playAudioSequence('https://vootlkuyzwzvpxcfkfzk.supabase.co/storage/v1/object/public/public-files/1792441799224-xwvy1.mp3');
      await playAudioSequence('https://vootlkuyzwzvpxcfkfzk.supabase.co/storage/v1/object/public/public-files/1792441798525-1afym6.mp3');
      addMessage({ type: 'image', url: 'https://vootlkuyzwzvpxcfkfzk.supabase.co/storage/v1/object/public/public-files/1792441916294-1kp2rp.jpg' }, 'bot');
      
      setShowInput(true);
      setFlowStep('awaiting_icebreaker');
    };

    if (isStarted) {
        runWelcomeFlow();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStarted]);

  const handleCreatePix = async (value: number, isUpsell: boolean = false) => {
    setIsCreatingPix(true);
    if (!isUpsell) {
        await showLoadingIndicator(1500, "Gravando áudio...");
        await playAudioSequence('https://vootlkuyzwzvpxcfkfzk.supabase.co/storage/v1/object/public/public-files/1792442266057-ney0mj.mp3');
    } else {
       await showLoadingIndicator(1500);
    }
    
    const charge = await createPixCharge(value);
    if (charge && charge.pixCopyPaste) {
      fpixelTrack('InitiateCheckout', { value: value / 100, currency: 'BRL' });
      if(isUpsell) {
        setUpsellPixData(charge);
        addMessage({ type: 'text', text: 'Oba! Sabia que você ia querer, amor. Gere o PIX de R$19,98 pra você.' }, 'bot');
        addMessage({ type: 'pix', sender: 'bot', pixCopyPaste: charge.pixCopyPaste, value: value / 100 });
        setFlowStep('awaiting_upsell_pix_payment');
      } else {
        setPixData(charge);
        setFlowStep('awaiting_pix_payment');
        addMessage({ type: 'text', text: `Prontinho amor, o valor é só R$${(value / 100).toFixed(2).replace('.', ',')}. Paga aí e me avisa que eu já te mando o link da chamada.` }, 'bot');
        addMessage({ type: 'pix', sender: 'bot', pixCopyPaste: charge.pixCopyPaste, value: value / 100 });
      }
    } else {
      addMessage({ type: 'text', text: "Ops, não consegui gerar o PIX agora, amor. Tenta de novo em um minutinho." }, 'bot');
      setFlowStep(isUpsell ? 'payment_confirmed_awaiting_upsell_choice' : 'awaiting_call_permission');
    }
    setIsCreatingPix(false);
  };

  const handleCheckPayment = async (txId: string, value: number, isUpsell: boolean = false) => {
    if (!txId || isCheckingPayment) return;

    addMessage({ type: 'text', text: "Já paguei" }, 'user');
    
    setIsCheckingPayment(true);
    await showLoadingIndicator(1500);
    addMessage({ type: 'text', text: "Ok amor, só um momento que vou verificar... 😍" }, 'bot');
    
    await delay(8000);

    const result = await checkPaymentStatus(txId);

    if (result?.status === 'paid') {
      fpixelTrack('Purchase', { value: value / 100, currency: 'BRL' });
      if (isUpsell) {
        addMessage({ type: 'text', text: "Pagamento confirmado, gostoso! 🔥 Clica no botão abaixo pra gente conversar no WhatsApp agora mesmo!" }, 'bot');
        setFlowStep('upsell_payment_confirmed');
      } else {
        await showLoadingIndicator(1500, "Gravando áudio...");
        await playAudioSequence('https://vootlkuyzwzvpxcfkfzk.supabase.co/storage/v1/object/public/public-files/1792442367273-xapqnj.mp3');
        addMessage({ type: 'text', text: "Amor, acabei de liberar meu número pessoal pra você... Quer pagar só mais R$ 19,98 pra gente conversar por lá? 😏" }, 'bot');
        setFlowStep('payment_confirmed_awaiting_upsell_choice');
      }
    } else {
      await showLoadingIndicator(1000);
      addMessage({ type: 'text', text: "Ainda não recebi aqui bb, tenta de novo" }, 'bot');
    }
    setIsCheckingPayment(false);
  };

  const handleUpsellChoice = async (choice: 'yes' | 'no') => {
    setFlowStep('initial');
    if (choice === 'yes') {
        addMessage({ type: 'text', text: 'Sim, eu quero!' }, 'user');
        await handleCreatePix(1998, true);
    } else {
        addMessage({ type: 'text', text: 'Não, obrigado' }, 'user');
        await showLoadingIndicator(1500);
        addMessage({ type: 'text', text: 'Tudo bem, amor. Sem problemas! Podemos fazer só a chamada de vídeo então. Clica no botão abaixo pra gente começar. 😍' }, 'bot');
        setFlowStep('flow_complete_video_only');
    }
  }

  const handleCallChoice = async (choice: 'yes' | 'no') => {
    setFlowStep('initial');
    if (choice === 'yes') {
      addMessage({ type: 'text', text: 'Quero a videochamada agora' }, 'user');
      await showLoadingIndicator(1500);
      addMessage({ type: 'text', text: 'Perfeito… vou gerar o Pix pra você.' }, 'bot');
      await handleCreatePix(1500);
    } else {
      addMessage({ type: 'text', text: 'Ainda não' }, 'user');
      await showLoadingIndicator(1500);
      addMessage({ type: 'text', text: "Tudo bem, amor. Deixa pra próxima então. Beijos! 😘" }, 'bot');
      setFlowStep('flow_rejected');
    }
  };

  const formAction = async (formData: FormData) => {
    const userMessageText = formData.get("message") as string;
    if (!userMessageText.trim()) return;

    addMessage({ type: 'text', text: userMessageText }, 'user');
    setShowInput(false);
    await showLoadingIndicator(1500);

    switch (flowStep) {
      case 'awaiting_icebreaker':
        // Step 3 & 4: Sequence
        await playAudioSequence('https://vootlkuyzwzvpxcfkfzk.supabase.co/storage/v1/object/public/public-files/1792441797885-xbehvm.mp3');
        await playAudioSequence('https://vootlkuyzwzvpxcfkfzk.supabase.co/storage/v1/object/public/public-files/1792441796583-avx4z.mp3');
        addMessage({ type: 'image', url: 'https://vootlkuyzwzvpxcfkfzk.supabase.co/storage/v1/object/public/public-files/1792440532240-pumwurh.jpg' }, 'bot');
        
        await delay(2000);
        
        await showLoadingIndicator(2000, "Gravando áudio...");
        await playAudioSequence('https://vootlkuyzwzvpxcfkfzk.supabase.co/storage/v1/object/public/public-files/1792441795693-zb5bcx.mp3');
        addMessage({ type: 'video', url: 'https://vootlkuyzwzvpxcfkfzk.supabase.co/storage/v1/object/public/public-files/1792442085405-gbe6a9.mp4' }, 'bot');
        
        await delay(2000);
        
        await showLoadingIndicator(1500, "Gravando áudio...");
        await playAudioSequence('https://vootlkuyzwzvpxcfkfzk.supabase.co/storage/v1/object/public/public-files/1792441794331-64zkg.mp3');
        
        // Step 5: Offer
        await showLoadingIndicator(1500, "Gravando áudio...");
        await playAudioSequence('https://vootlkuyzwzvpxcfkfzk.supabase.co/storage/v1/object/public/public-files/1792441793069-i18okg.mp3');
        await playAudioSequence('https://vootlkuyzwzvpxcfkfzk.supabase.co/storage/v1/object/public/public-files/1792442194866-40jkdg.mp3');
        addMessage({ type: 'text', text: "bora bb" }, 'bot');
        
        setFlowStep('awaiting_call_permission');
        break;
      
      case 'chat_mode':
        try {
          await showLoadingIndicator(2000);
          const { response } = await sendMessage(userMessageText);
          addMessage({ type: 'text', text: response }, 'bot');
        } catch (error) {
          console.error(error);
          addMessage({ type: 'text', text: "Desculpe, ocorreu um erro ao processar sua mensagem." }, 'bot');
        }
        setShowInput(true);
        break;
    }
  };

  return (
    <div className="bg-background flex items-center justify-center h-screen font-body select-none">
      <div className="w-full h-dvh sm:w-[450px] sm:h-[95vh] sm:max-h-[900px] flex flex-col bg-background shadow-2xl relative overflow-hidden">
          {!isStarted && (
            <div className="bg-[#5c001e] absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 text-center p-4 animate-fadeIn">
              <div className="relative p-1 rounded-full animate-border-glow">
                <Image
                    src="https://vootlkuyzwzvpxcfkfzk.supabase.co/storage/v1/object/public/public-files/1792440504276-6fe2u.jpg"
                    alt="Vanessa ❤"
                    width={120}
                    height={120}
                    className="rounded-full border-4 border-black object-cover aspect-square shadow-2xl"
                />
              </div>
              <div className="flex flex-col gap-2">
                <h1 className="text-white text-3xl font-bold tracking-tight animate-text-shadow-pulse">Vanessa <span className="animate-heart-pulse">❤</span></h1>
                <p className="text-white/80 text-lg">enviou uma nova mensagem de áudio</p>
              </div>
              <Button onClick={() => setIsStarted(true)} size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground mt-6 rounded-full py-7 px-10 text-lg font-bold shadow-lg animate-pulseButton">
                <Play className="mr-3 h-6 w-6" />
                Ouvir agora
              </Button>
            </div>
          )}
          <ChatHeader />
          <div 
            className="flex-1 overflow-y-auto"
            style={{
              backgroundImage: "url('https://wallpapers.com/images/hd/whatsapp-chat-doodle-patterns-jyd5uvep2fdwjl97.jpg')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <ChatMessages messages={messages} isLoading={isLoading} loadingText={loadingText} autoPlayingAudioId={autoPlayingAudioId} />
          </div>

          {(flowStep === 'awaiting_pix_payment' || flowStep === 'awaiting_upsell_pix_payment') && (
            <div className="p-4 bg-background border-t border-border/20 flex flex-col items-center gap-4">
              <div className="flex items-center text-sm text-muted-foreground">
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                <span>Aguardando pagamento...</span>
              </div>
              <Button
                  onClick={() => {
                    const value = flowStep === 'awaiting_pix_payment' ? (pixData?.value ? parseInt(pixData.value, 10) * 100 : 1500) : 1998;
                    const txId = flowStep === 'awaiting_pix_payment' ? pixData?.transactionId : upsellPixData?.transactionId;
                    const isUpsell = flowStep === 'awaiting_upsell_pix_payment';

                    if (txId) {
                      handleCheckPayment(txId, value, isUpsell);
                    }
                  }}
                  disabled={isCheckingPayment || (flowStep === 'awaiting_pix_payment' && !pixData) || (flowStep === 'awaiting_upsell_pix_payment' && !upsellPixData)}
                  className="w-full bg-primary text-primary-foreground font-bold text-lg py-6 rounded-full shadow-lg hover:bg-primary/90"
              >
                  {isCheckingPayment ? (
                      <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Verificando...
                      </>
                  ) : (
                      'Já paguei'
                  )}
              </Button>
            </div>
          )}
          
          {flowStep === 'payment_confirmed_awaiting_upsell_choice' && (
             <div className="p-4 bg-background border-t border-border/20 flex items-center justify-center gap-4">
                <Button onClick={() => handleUpsellChoice('yes')} className="w-full bg-accent text-accent-foreground font-bold text-lg py-6 rounded-full shadow-lg hover:bg-accent/90">
                    Sim, eu quero!
                </Button>
                <Button onClick={() => handleUpsellChoice('no')} className="w-full bg-destructive text-destructive-foreground font-bold text-lg py-6 rounded-full shadow-lg hover:bg-destructive/90">
                    Não, obrigado
                </Button>
            </div>
          )}

          {flowStep === 'awaiting_call_permission' && (
             <div className="p-4 bg-background border-t border-border/20 flex items-center justify-center gap-4">
                <Button onClick={() => handleCallChoice('yes')} className="w-full bg-accent text-accent-foreground font-bold text-lg py-6 rounded-full shadow-lg hover:bg-accent/90">
                    Quero a videochamada agora
                </Button>
                <Button onClick={() => handleCallChoice('no')} className="w-full bg-destructive text-destructive-foreground font-bold text-lg py-6 rounded-full shadow-lg hover:bg-destructive/90">
                    Ainda não
                </Button>
            </div>
          )}

          {flowStep === 'upsell_payment_confirmed' && (
             <div className="p-4 bg-background border-t border-border/20 flex justify-center">
              <Button asChild className="w-full bg-accent text-accent-foreground font-bold text-lg py-6 rounded-full shadow-lg hover:bg-accent/90">
                <Link href="https://wa.me/554399540418?text=oiii%20vanessa,%20comprei%20sua%20chamadinha%20de%20vídeo." target="_blank">
                  Conversar no WhatsApp
                </Link>
              </Button>
            </div>
          )}

          {flowStep === 'flow_complete_video_only' && (
             <div className="p-4 bg-background border-t border-border/20 flex justify-center">
              <Button asChild className="w-full bg-accent text-accent-foreground font-bold text-lg py-6 rounded-full shadow-lg hover:bg-accent/90">
                <Link href="https://simulador-de-chamada-zxxg.bolt.host/" target="_blank">
                  Iniciar chamada de vídeo
                </Link>
              </Button>
            </div>
          )}

          {showInput && <ChatInput formAction={formAction} disabled={isLoading || isCreatingPix} />}
          <audio ref={notificationSoundRef} src="https://imperiumfragrance.shop/wp-content/uploads/2025/06/adew.mp3" preload="auto" />
      </div>
    </div>
  );
}
