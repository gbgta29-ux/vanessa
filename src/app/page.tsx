
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
  | 'awaiting_game_permission'
  | 'awaiting_state'
  | 'awaiting_peitinhos_response'
  | 'awaiting_call_permission'
  | 'awaiting_pix_permission'
  | 'awaiting_pix_generation'
  | 'awaiting_pix_payment'
  | 'payment_confirmed_awaiting_upsell_choice'
  | 'awaiting_upsell_pix_payment'
  | 'upsell_payment_confirmed'
  | 'flow_complete_video_only'
  | 'chat_mode';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Digitando...");
  const [autoPlayingAudioId, setAutoPlayingAudioId] = useState<number | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [flowStep, setFlowStep] = useState<FlowStep>('initial');
  const [userName, setUserName] = useState('');
  const [userState, setUserState] = useState('');
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

  const playAudioSequence = async (audioId: number, url: string, waitTime = 1500) => {
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

  const getCapital = (state: string): string | null => {
    const stateCapitals: { [key: string]: string } = {
        'acre': 'Rio Branco', 'alagoas': 'Maceió', 'amapá': 'Macapá', 'amazonas': 'Manaus',
        'bahia': 'Salvador', 'ceará': 'Fortaleza', 'distrito federal': 'Brasília',
        'espírito santo': 'Vitória', 'goiás': 'Goiânia', 'maranhão': 'São Luís',
        'mato grosso': 'Cuiabá', 'mato grosso do sul': 'Campo Grande', 'minas gerais': 'Belo Horizonte',
        'pará': 'Belém', 'paraíba': 'João Pessoa', 'paraná': 'Curitiba', 'pernambuco': 'Recife',
        'piauí': 'Teresina', 'rio de janeiro': 'Rio de Janeiro', 'rio grande do norte': 'Natal',
        'rio grande do sul': 'Porto Alegre', 'rondônia': 'Porto Velho', 'roraima': 'Boa Vista',
        'santa catarina': 'Florianópolis', 'são paulo': 'São Paulo', 'sergipe': 'Aracaju', 'tocantins': 'Palmas',
        'ac': 'Rio Branco', 'al': 'Maceió', 'ap': 'Macapá', 'am': 'Manaus', 'ba': 'Salvador',
        'ce': 'Fortaleza', 'df': 'Brasília', 'es': 'Vitória', 'go': 'Goiânia', 'ma': 'São Luís',
        'mt': 'Cuiabá', 'ms': 'Campo Grande', 'mg': 'Belo Horizonte', 'pa': 'Belém', 'pb': 'João Pessoa',
        'pr': 'Curitiba', 'pe': 'Recife', 'pi': 'Teresina', 'rj': 'Rio de Janeiro', 'rn': 'Natal',
        'rs': 'Porto Alegre', 'ro': 'Porto Velho', 'rr': 'Boa Vista', 'sc': 'Florianópolis',
        'sp': 'São Paulo', 'se': 'Aracaju', 'to': 'Palmas'
    };
    return stateCapitals[state.toLowerCase()] || null;
  }

  useEffect(() => {
    const runWelcomeFlow = async () => {
      await showLoadingIndicator(1500, "Gravando áudio...");
      await playAudioSequence(1, 'https://imperiumfragrance.shop/wp-content/uploads/2025/09/a.mp3');
      await playAudioSequence(2, 'https://imperiumfragrance.shop/wp-content/uploads/2025/09/b.mp3');
      await playAudioSequence(3, 'https://imperiumfragrance.shop/wp-content/uploads/2025/09/c.mp3');

      await showLoadingIndicator(1500);
      addMessage({ type: 'text', text: "bora jogar esse joguinho, amor ?" }, 'bot');
      setShowInput(true);
      setFlowStep('awaiting_game_permission');
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
        await playAudioSequence(13, 'https://imperiumfragrance.shop/wp-content/uploads/2025/09/m.mp3');
    }
    
    const charge = await createPixCharge(value);
    if (charge && charge.pixCopyPaste) {
      fpixelTrack('InitiateCheckout', { value: value / 100, currency: 'BRL' });
      if(isUpsell) {
        setUpsellPixData(charge);
        addMessage({ type: 'pix', sender: 'bot', pixCopyPaste: charge.pixCopyPaste, value: value / 100 });
        setFlowStep('awaiting_upsell_pix_payment');
      } else {
        setPixData(charge);
        setFlowStep('awaiting_pix_payment');
        addMessage({ type: 'text', text: `Prontinho amor, o valor é só R$${(value / 100).toFixed(2).replace('.', ',')}. Faz o pagamento pra gente gozar na chamada de vídeo...` }, 'bot');
        addMessage({ type: 'pix', sender: 'bot', pixCopyPaste: charge.pixCopyPaste, value: value / 100 });
      }
    } else {
      addMessage({ type: 'text', text: "Ops, não consegui gerar o PIX agora, amor. Tenta de novo em um minutinho." }, 'bot');
      setFlowStep(isUpsell ? 'payment_confirmed_awaiting_upsell_choice' : 'awaiting_call_permission');
      if(!isUpsell) setShowInput(true); 
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
        await playAudioSequence(20, 'https://imperiumfragrance.shop/wp-content/uploads/2025/07/ElevenLabs_2025-07-25T23_51_20_Keren-Young-Brazilian-Female_pvc_sp110_s30_sb30_v3.mp3');
        addMessage({ type: 'text', text: "Amor, acabei de liberar meu número pessoal pra você... Quer pagar só mais R$ 19,98 pra gente conversar por lá? 😏" }, 'bot');
        setFlowStep('payment_confirmed_awaiting_upsell_choice');
      }
    } else {
      await playAudioSequence(19, 'https://imperiumfragrance.shop/wp-content/uploads/2025/07/ElevenLabs_2025-07-26T21_25_01_Keren-Young-Brazilian-Female_pvc_sp110_s30_sb30_v3-1.mp3');
    }
    setIsCheckingPayment(false);
  };

  const handleUpsellChoice = async (choice: 'yes' | 'no') => {
    setFlowStep('initial'); // Disable buttons
    if (choice === 'yes') {
        addMessage({ type: 'text', text: 'Sim, eu quero!' }, 'user');
        setIsCreatingPix(true);
        await showLoadingIndicator(1500);
        addMessage({ type: 'text', text: 'Oba! Sabia que você ia querer, amor. Vou gerar o PIX de R$19,98 pra você.' }, 'bot');
        await handleCreatePix(1998, true);
        setIsCreatingPix(false);

    } else {
        addMessage({ type: 'text', text: 'Não, obrigado' }, 'user');
        await showLoadingIndicator(1500);
        addMessage({ type: 'text', text: 'Tudo bem, amor. Sem problemas! Podemos fazer só a chamada de vídeo então. Clica no botão abaixo pra gente começar. 😍' }, 'bot');
        setFlowStep('flow_complete_video_only');
    }
  }

  const formAction = async (formData: FormData) => {
    const userMessageText = formData.get("message") as string;
    if (!userMessageText.trim()) return;

    addMessage({ type: 'text', text: userMessageText }, 'user');
    setShowInput(false);
    await showLoadingIndicator(1500);

    switch (flowStep) {
      case 'awaiting_game_permission':
        addMessage({ type: 'image', url: 'https://imperiumfragrance.shop/wp-content/uploads/2025/09/@ItsOnlyy-on-Telegram-212-scaled.jpg' }, 'bot');
        await showLoadingIndicator(1500);
        addMessage({ type: 'image', url: 'https://imperiumfragrance.shop/wp-content/uploads/2025/09/a4ebc6e9-ba75-4a2d-a5ea-a498896ab9d4.jpg' }, 'bot');
        await showLoadingIndicator(1500, "Gravando áudio...");
        await playAudioSequence(4, 'https://imperiumfragrance.shop/wp-content/uploads/2025/09/d.mp3');
        await playAudioSequence(5, 'https://imperiumfragrance.shop/wp-content/uploads/2025/09/e.mp3');
        await playAudioSequence(6, 'https://imperiumfragrance.shop/wp-content/uploads/2025/09/f.mp3');
        await showLoadingIndicator(1500);
        addMessage({ type: 'text', text: "em qual estado você mora bb ?" }, 'bot');
        setShowInput(true);
        setFlowStep('awaiting_state');
        break;

      case 'awaiting_state':
        setUserState(userMessageText);
        const capital = getCapital(userMessageText);
        if (capital) {
            addMessage({ type: 'text', text: `ah que legal bb, moro no ${userMessageText} também, na cidade de ${capital}, a gente mora pertinho então;` }, 'bot');
        } else {
            addMessage({ type: 'text', text: `ah que legal bb, moro em ${userMessageText} também, a gente mora pertinho então;` }, 'bot');
        }
        await showLoadingIndicator(1500, "Gravando áudio...");
        await playAudioSequence(7, 'https://imperiumfragrance.shop/wp-content/uploads/2025/09/g.mp3');
        await showLoadingIndicator(1500);
        addMessage({ type: 'image', url: 'https://imperiumfragrance.shop/wp-content/uploads/2025/09/Design-sem-nome-54.jpg' }, 'bot');
        await showLoadingIndicator(1500, "Gravando áudio...");
        await playAudioSequence(8, 'https://imperiumfragrance.shop/wp-content/uploads/2025/09/h.mp3');
        await playAudioSequence(9, 'https://imperiumfragrance.shop/wp-content/uploads/2025/09/i.mp3');
        await showLoadingIndicator(1500);
        addMessage({ type: 'text', text: "você gostou dos meus peitinhos safado ? 💗" }, 'bot');
        setShowInput(true);
        setFlowStep('awaiting_peitinhos_response');
        break;

      case 'awaiting_peitinhos_response':
        await showLoadingIndicator(1500, "Gravando áudio...");
        await playAudioSequence(10, 'https://imperiumfragrance.shop/wp-content/uploads/2025/09/j.mp3');
        await showLoadingIndicator(1500);
        addMessage({ type: 'video', url: 'https://imperiumfragrance.shop/wp-content/uploads/2025/09/video-da-carla.mp4' }, 'bot');
        await showLoadingIndicator(1500);
        addMessage({ type: 'image', url: 'https://imperiumfragrance.shop/wp-content/uploads/2025/09/np8cokxo5ohb80xj6p6no9gs.jpg' }, 'bot');
        await showLoadingIndicator(20000, "Gravando áudio...");
        await playAudioSequence(11, 'https://imperiumfragrance.shop/wp-content/uploads/2025/09/k.mp3');
        await showLoadingIndicator(1500);
        addMessage({ type: 'text', text: "vamo bb ??" }, 'bot');
        await showLoadingIndicator(1500, "Gravando áudio...");
        await playAudioSequence(12, 'https://imperiumfragrance.shop/wp-content/uploads/2025/09/l.mp3');
        await showLoadingIndicator(1500);
        addMessage({ type: 'text', text: "posso te mandar meu pix pra gente brincar gostoso então, amor ???" }, 'bot');
        setShowInput(true);
        setFlowStep('awaiting_pix_permission');
        break;

      case 'awaiting_pix_permission':
        await handleCreatePix(1500);
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
            <div className="initial-screen-bg absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 text-center p-4 animate-fadeIn">
              <div className="relative p-1 rounded-full animate-border-glow">
                <Image
                    src="https://scontent.fldb2-1.fna.fbcdn.net/v/t39.30808-6/494386039_122130416744835155_569158612006628541_n.jpg?stp=dst-jpg_s640x640_tt6&_nc_cat=108&ccb=1-7&_nc_sid=127cfc&_nc_ohc=uwpXJfAtJ0sQ7kNvwHsdPSO&_nc_oc=AdmYe5oeJpPRIbg9YZ-skjPUhMWW07HvvNva1oDmKu06IfDbBvcQJG3vGB-2jSAxRA1R2xFnrQtd5xrO3wKoRMsZ&_nc_zt=23&_nc_ht=scontent.fldb2-1.fna&_nc_gid=7yaGmpKX97x4XSEbMl8d9g&oh=00_AfbVpbBCbO1vY-v1MfiioG7DolkD53Ox08zbMzU_7Nx5SQ&oe=68C37BBA"
                    alt="Rafa ❤"
                    width={120}
                    height={120}
                    className="rounded-full border-4 border-black object-cover aspect-square shadow-2xl"
                />
              </div>
              <div className="flex flex-col gap-2">
                <h1 className="text-white text-3xl font-bold tracking-tight animate-text-shadow-pulse">Rafa <span className="animate-heart-pulse">❤</span></h1>
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
                    if (flowStep === 'awaiting_pix_payment' && pixData) {
                      handleCheckPayment(pixData.transactionId, 1500, false);
                    } else if (flowStep === 'awaiting_upsell_pix_payment' && upsellPixData) {
                       handleCheckPayment(upsellPixData.transactionId, 1998, true);
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

          {flowStep === 'upsell_payment_confirmed' && (
             <div className="p-4 bg-background border-t border-border/20 flex justify-center">
              <Button asChild className="w-full bg-accent text-accent-foreground font-bold text-lg py-6 rounded-full shadow-lg hover:bg-accent/90">
                <Link href="https://wa.me/554399540418?text=oiii%20rafa,%20comprei%20sua%20chamadinha%20de%20vídeo." target="_blank">
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

    