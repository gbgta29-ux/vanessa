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
  | 'awaiting_name'
  | 'awaiting_amor_permission'
  | 'awaiting_after_gostar_response'
  | 'awaiting_after_picante_response'
  | 'awaiting_after_audio_10_response'
  | 'awaiting_after_audio_14_response'
  | 'awaiting_pix_payment'
  | 'payment_confirmed_awaiting_upsell_choice'
  | 'awaiting_upsell_pix_payment'
  | 'upsell_payment_confirmed'
  | 'flow_complete_video_only'
  | 'chat_mode';

export const VANESSA_MEDIA = {
  profilePic: "https://vootlkuyzwzvpxcfkfzk.supabase.co/storage/v1/object/public/public-files/1792440503168-d50kbr.jpg",
  fotoCasual: "https://vootlkuyzwzvpxcfkfzk.supabase.co/storage/v1/object/public/public-files/1792440504276-6fe2u.jpg",
  fotoSensual: "https://vootlkuyzwzvpxcfkfzk.supabase.co/storage/v1/object/public/public-files/1792441916294-1kp2rp.jpg",
  fotoIntima: "https://vootlkuyzwzvpxcfkfzk.supabase.co/storage/v1/object/public/public-files/1792440532240-pumwurh.jpg",
  videoTeaser: "https://vootlkuyzwzvpxcfkfzk.supabase.co/storage/v1/object/public/public-files/1792442085405-gbe6a9.mp4",
  audio1_apresentacao: "https://vootlkuyzwzvpxcfkfzk.supabase.co/storage/v1/object/public/public-files/1792441730793-p790dd.mp3",
  audio2_qualificacao: "https://vootlkuyzwzvpxcfkfzk.supabase.co/storage/v1/object/public/public-files/1792441799224-xwvy1.mp3",
  audio3_experiencia: "https://vootlkuyzwzvpxcfkfzk.supabase.co/storage/v1/object/public/public-files/1792441798525-1afym6.mp3",
  audio4_provocacao: "https://vootlkuyzwzvpxcfkfzk.supabase.co/storage/v1/object/public/public-files/1792441797885-xbehvm.mp3",
  audio5_sensorial: "https://vootlkuyzwzvpxcfkfzk.supabase.co/storage/v1/object/public/public-files/1792441796583-avx4z.mp3",
  audio6_video: "https://vootlkuyzwzvpxcfkfzk.supabase.co/storage/v1/object/public/public-files/1792441795693-zb5bcx.mp3",
  audio7_posVideo: "https://vootlkuyzwzvpxcfkfzk.supabase.co/storage/v1/object/public/public-files/1792441794331-64zkg.mp3",
  audio8_chamada: "https://vootlkuyzwzvpxcfkfzk.supabase.co/storage/v1/object/public/public-files/1792441793069-i18okg.mp3",
  audio9_transicao: "https://vootlkuyzwzvpxcfkfzk.supabase.co/storage/v1/object/public/public-files/1792442194866-40jkdg.mp3",
  audio10_pix: "https://vootlkuyzwzvpxcfkfzk.supabase.co/storage/v1/object/public/public-files/1792441790450-khw79.mp3",
  audio11_pixGarantia: "https://vootlkuyzwzvpxcfkfzk.supabase.co/storage/v1/object/public/public-files/1792454350481-7th7ms.mp3",
  audioUpsell: "https://vootlkuyzwzvpxcfkfzk.supabase.co/storage/v1/object/public/public-files/1792442367273-xapqnj.mp3",
  whatsappUrl: "https://wa.me/5543996011408?text=Oiii%20Vanessa%2C%20acabei%20de%20pegar%20seu%20WhatsApp%20VIP%20aqui!%20Vem%20falar%20comigo%20amor...%20%F0%9F%94%A5"
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Digitando...");
  const [autoPlayingAudioId, setAutoPlayingAudioId] = useState<number | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [flowStep, setFlowStep] = useState<FlowStep>('initial');
  const [city, setCity] = useState("do Brasil");
  const [userName, setUserName] = useState("");
  const [isCreatingPix, setIsCreatingPix] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [pixData, setPixData] = useState<PixChargeData | null>(null);
  const [upsellPixData, setUpsellPixData] = useState<PixChargeData | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const isFlowRunning = useRef(false);
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
    notificationSoundRef.current?.play().catch(() => {});
  };

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

  const playAudioSequence = async (url: string, waitTime = 1200) => {
    playNotificationSound();
    await new Promise<void>(resolve => {
      let resolved = false;
      const safeResolve = () => {
        if (!resolved) {
          resolved = true;
          setAutoPlayingAudioId(null);
          resolve();
        }
      };
      const timeout = setTimeout(safeResolve, 35000);
      const audioMessage = addMessage({
        type: 'audio',
        url,
        onEnded: () => {
          clearTimeout(timeout);
          safeResolve();
        }
      }, 'bot');
      setAutoPlayingAudioId(audioMessage.id);
    });
    setAutoPlayingAudioId(null);
    await delay(waitTime);
  };

  const playVideoSequence = async (url: string, waitTime = 2000) => {
    playNotificationSound();
    await new Promise<void>(resolve => {
      let resolved = false;
      const safeResolve = () => {
        if (!resolved) {
          resolved = true;
          resolve();
        }
      };
      addMessage({ type: 'video', url, onEnded: safeResolve }, 'bot');
      setTimeout(safeResolve, 40000);
    });
    await delay(waitTime);
  };
  
  const showLoadingIndicator = async (duration: number, text: string = "Digitando...") => {
    setLoadingText(text);
    setIsLoading(true);
    await delay(duration);
    setIsLoading(false);
  };

  const getCity = async () => {
    try {
      const response = await fetch('https://get.geojs.io/v1/ip/city.json');
      if (!response.ok) {
        const fallbackResponse = await fetch('https://ipapi.co/json/');
        if (!fallbackResponse.ok) return 'do Brasil';
        const fallbackData = await fallbackResponse.json();
        return fallbackData.city || 'do Brasil';
      }
      const data = await response.json();
      const detectedCity = data.city ? decodeURIComponent(escape(data.city)) : 'do Brasil';
      return detectedCity;
    } catch (error) {
      console.error("Error fetching city:", error);
      return 'do Brasil';
    }
  };

  // STEP 1: FLUXO DE BOAS-VINDAS COM GEOLOCALIZAÇÃO (IGUAL À DUDA)
  useEffect(() => {
    const runWelcomeFlow = async () => {
      if (isFlowRunning.current) return;
      isFlowRunning.current = true;

      const currentCity = await getCity();
      setCity(currentCity);

      await showLoadingIndicator(1500, "Gravando áudio...");
      await playAudioSequence(VANESSA_MEDIA.audio1_apresentacao);

      await delay(800);
      addMessage({ type: 'image', url: VANESSA_MEDIA.fotoCasual }, 'bot');
      await delay(1200);

      addMessage({ type: 'text', text: "Essa foto eu tirei hoje mais cedo ❤🔥" }, 'bot');

      await delay(1000);
      const locationText = currentCity === 'do Brasil' ? "aqui no Brasil" : `em ${currentCity}`;
      addMessage({ type: 'text', text: `E estou morando ${locationText}` }, 'bot');

      await showLoadingIndicator(1500, "Gravando áudio...");
      await playAudioSequence(VANESSA_MEDIA.audio2_qualificacao);

      await delay(800);
      addMessage({ type: 'text', text: "Qual seu nome, bb? 💗" }, 'bot');

      setShowInput(true);
      setFlowStep('awaiting_name');
    };

    if (isStarted) {
      runWelcomeFlow();
    }
  }, [isStarted]);

  // CRIAÇÃO DE PIX (R$ 9,98 NA ENTRADA / R$ 19,99 NO UPSELL)
  const handleCreatePix = async (value: number, isUpsell: boolean = false) => {
    setIsCreatingPix(true);
    if (!isUpsell) {
      addMessage({ type: 'text', text: "vou mandar meu pix pra você bb... 😍" }, 'bot');
      await showLoadingIndicator(2000);
    }
    
    const charge = await createPixCharge(value);
    if (charge && charge.pixCopyPaste) {
      fpixelTrack('InitiateCheckout', { value: value / 100, currency: 'BRL' });
      if (isUpsell) {
        setUpsellPixData(charge);
        addMessage({ type: 'pix', sender: 'bot', pixCopyPaste: charge.pixCopyPaste, value: value / 100 });
        setFlowStep('awaiting_upsell_pix_payment');
      } else {
        setPixData(charge);
        setFlowStep('awaiting_pix_payment');
        addMessage({ type: 'text', text: `Prontinho amor, o valor é só R$${(value / 100).toFixed(2).replace('.', ',')}. Faz o pagamento pra gente começar nossa chamada de vídeo agora... 🔥` }, 'bot');
        addMessage({ type: 'pix', sender: 'bot', pixCopyPaste: charge.pixCopyPaste, value: value / 100 });
      }
    } else {
      addMessage({ type: 'text', text: "Ops, não consegui gerar o PIX agora, amor. Tenta de novo em um minutinho." }, 'bot');
      setFlowStep(isUpsell ? 'payment_confirmed_awaiting_upsell_choice' : 'awaiting_after_audio_14_response');
      if (!isUpsell) setShowInput(true);
    }
    setIsCreatingPix(false);
  };

  // VERIFICAÇÃO DE PAGAMENTO & OBJEÇÃO CASO NÃO TENHA PAGO
  const handleCheckPayment = async (txId: string, value: number, isUpsell: boolean = false) => {
    if (!txId || isCheckingPayment) return;

    addMessage({ type: 'text', text: "Já paguei" }, 'user');
    setIsCheckingPayment(true);
    await showLoadingIndicator(1500);
    addMessage({ type: 'text', text: "Ok amor, só um momento que vou verificar... 😍" }, 'bot');
    
    await delay(7000);

    const result = await checkPaymentStatus(txId);

    if (result?.status === 'paid') {
      fpixelTrack('Purchase', { value: value / 100, currency: 'BRL' });
      if (isUpsell) {
        addMessage({ type: 'text', text: "Pagamento confirmado, gostoso! 🔥 Clica no botão abaixo pra gente conversar no WhatsApp agora mesmo!" }, 'bot');
        setFlowStep('upsell_payment_confirmed');
      } else {
        await showLoadingIndicator(2000, "Gravando áudio...");
        await playAudioSequence(VANESSA_MEDIA.audioUpsell);
        addMessage({ type: 'text', text: "Amor, acabei de liberar meu número pessoal pra você... Quer pagar só mais R$ 19,99 pra gente conversar por lá? 😏" }, 'bot');
        setFlowStep('payment_confirmed_awaiting_upsell_choice');
      }
    } else {
      await showLoadingIndicator(1500, "Verificando...");
      addMessage({ 
        type: 'text', 
        text: "Amor, ainda não constou aqui no meu banco... Confere no seu aplicativo se o Pix foi concluído certinho que eu já tô te esperando! 🥺" 
      }, 'bot');
    }
    setIsCheckingPayment(false);
  };

  const handleUpsellChoice = async (choice: 'yes' | 'no') => {
    setFlowStep('initial');
    if (choice === 'yes') {
      addMessage({ type: 'text', text: 'Sim, eu quero!' }, 'user');
      setIsCreatingPix(true);
      await showLoadingIndicator(1500);
      addMessage({ type: 'text', text: 'Oba! Sabia que você ia querer, amor. Vou gerar o PIX de R$19,99 pra você.' }, 'bot');
      await handleCreatePix(1999, true);
      setIsCreatingPix(false);
    } else {
      addMessage({ type: 'text', text: 'Não, obrigado' }, 'user');
      await showLoadingIndicator(1500);
      addMessage({ type: 'text', text: 'Tudo bem, amor. Sem problemas! Clica no botão abaixo pra gente começar nossa chamada de vídeo agora. 😍' }, 'bot');
      setFlowStep('flow_complete_video_only');
    }
  };

  // GERENCIADOR DE RESPOSTAS DO USUÁRIO (MÁQUINA DE ESTADOS IDÊNTICA À DUDA)
  const formAction = async (formData: FormData) => {
    const userMessageText = formData.get("message") as string;
    if (!userMessageText.trim()) return;

    addMessage({ type: 'text', text: userMessageText }, 'user');
    setShowInput(false);

    switch (flowStep) {
      // 1. Recebeu o nome do lead
      case 'awaiting_name':
        setUserName(userMessageText);
        await delay(1200);
        await showLoadingIndicator(1800);
        addMessage({ type: 'text', text: `Adorei seu nome ${userMessageText}, 💗 posso te chamar de amor?` }, 'bot');
        setFlowStep('awaiting_amor_permission');
        setShowInput(true);
        break;

      // 2. Recebeu permissão de chamar de amor
      case 'awaiting_amor_permission':
        await delay(1000);
        await showLoadingIndicator(1800, "Gravando áudio...");
        await playAudioSequence(VANESSA_MEDIA.audio3_experiencia);
        await showLoadingIndicator(1500);
        addMessage({ type: 'text', text: "Acho que vai gostar rsrs , posso mandar ?" }, 'bot');
        setFlowStep('awaiting_after_gostar_response');
        setShowInput(true);
        break;

      // 3. Recebeu permissão de mandar a foto sensual
      case 'awaiting_after_gostar_response':
        await delay(1000);
        await showLoadingIndicator(1800);
        addMessage({ type: 'image', url: VANESSA_MEDIA.fotoSensual }, 'bot');
        await delay(1200);
        await showLoadingIndicator(1500);
        addMessage({ type: 'text', text: "O que você achou bb??" }, 'bot');
        setFlowStep('awaiting_after_picante_response');
        setShowInput(true);
        break;

      // 4. Recebeu o elogio da foto sensual -> Provocação
      case 'awaiting_after_picante_response':
        await delay(1000);
        await showLoadingIndicator(1800, "Gravando áudio...");
        await playAudioSequence(VANESSA_MEDIA.audio4_provocacao);
        await showLoadingIndicator(1800, "Gravando áudio...");
        await playAudioSequence(VANESSA_MEDIA.audio5_sensorial);
        await delay(1000);
        addMessage({ type: 'text', text: "quer me ver ainda mais íntima amorzinho ??" }, 'bot');
        setFlowStep('awaiting_after_audio_10_response');
        setShowInput(true);
        break;

      // 5. Aceitou ver a intimidade -> Manda Foto Íntima + Vídeo Teaser + Convite para Chamada
      case 'awaiting_after_audio_10_response':
        await delay(1000);
        await showLoadingIndicator(1800);
        addMessage({ type: 'image', url: VANESSA_MEDIA.fotoIntima }, 'bot');
        await delay(1200);
        await showLoadingIndicator(1800, "Gravando áudio...");
        await playAudioSequence(VANESSA_MEDIA.audio6_video);
        await playVideoSequence(VANESSA_MEDIA.videoTeaser, 2000);
        await showLoadingIndicator(1800, "Gravando áudio...");
        await playAudioSequence(VANESSA_MEDIA.audio7_posVideo);
        await showLoadingIndicator(1200);
        addMessage({ type: 'text', text: "eae bb bora chamadinha então ? 🔥" }, 'bot');
        setFlowStep('awaiting_after_audio_14_response');
        setShowInput(true);
        break;

      // 6. Aceitou a chamadinha -> Áudios de fechamento e GERA PIX DE R$ 9,98
      case 'awaiting_after_audio_14_response':
        await delay(1000);
        await showLoadingIndicator(2000, "Gravando áudio...");
        await playAudioSequence(VANESSA_MEDIA.audio8_chamada);
        await playAudioSequence(VANESSA_MEDIA.audio9_transicao);
        await playAudioSequence(VANESSA_MEDIA.audio11_pixGarantia);
        await handleCreatePix(998); // R$ 9,98 (Conversão de Impulso)
        break;

      case 'chat_mode':
        try {
          await showLoadingIndicator(1500);
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
    <div className="bg-[#111B21] flex items-center justify-center fixed inset-0 w-full h-full font-body select-none overflow-hidden">
      <div className="w-full h-full sm:w-[450px] sm:h-[95vh] sm:max-h-[900px] flex flex-col bg-background shadow-2xl relative overflow-hidden">
        
        {/* TELA INICIAL (SPLASH SCREEN - LIBERA AUTOPLAY) */}
        {!isStarted && (
          <div className="bg-[#4a0018] absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 text-center p-4 animate-fadeIn">
            <div className="relative p-1 rounded-full animate-border-glow">
              <Image
                src={VANESSA_MEDIA.profilePic}
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
            <button onClick={() => setIsStarted(true)} className="bg-accent hover:bg-accent/90 text-accent-foreground mt-6 rounded-full py-5 px-10 text-xl font-bold shadow-lg animate-pulseButton flex items-center cursor-pointer">
              <Play className="mr-3 h-6 w-6 fill-current" />
              Ouvir agora
            </button>
          </div>
        )}

        <ChatHeader />
        
        <div 
          className="flex-1 min-h-0 overflow-y-auto"
          style={{
            backgroundImage: "url('https://wallpapers.com/images/hd/whatsapp-chat-doodle-patterns-jyd5uvep2fdwjl97.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <ChatMessages messages={messages} isLoading={isLoading} loadingText={loadingText} autoPlayingAudioId={autoPlayingAudioId} />
        </div>

        {/* BARRA DE AGUARDANDO PAGAMENTO COM BOTAO JÁ PAGUEI */}
        {(flowStep === 'awaiting_pix_payment' || flowStep === 'awaiting_upsell_pix_payment') && (
          <div className="p-3.5 pb-8 sm:pb-4 bg-background border-t border-border/20 flex flex-col items-center gap-4 shrink-0">
            <div className="flex items-center text-sm text-muted-foreground">
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              <span>Aguardando pagamento...</span>
            </div>
            <Button
              onClick={() => {
                const value = flowStep === 'awaiting_pix_payment' ? 998 : 1999;
                const txId = flowStep === 'awaiting_pix_payment' ? pixData?.transactionId : upsellPixData?.transactionId;
                const isUpsell = flowStep === 'awaiting_upsell_pix_payment';

                if (txId) {
                  handleCheckPayment(txId, value, isUpsell);
                }
              }}
              disabled={isCheckingPayment || (flowStep === 'awaiting_pix_payment' && !pixData) || (flowStep === 'awaiting_upsell_pix_payment' && !upsellPixData)}
              className="w-full bg-primary text-primary-foreground font-bold text-sm sm:text-base py-3.5 sm:py-4 rounded-full shadow-lg min-h-[46px] hover:bg-primary/90"
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
        
        {/* BOTÕES DE UPSELL (WHATSAPP VIP) */}
        {flowStep === 'payment_confirmed_awaiting_upsell_choice' && (
          <div className="p-3.5 pb-8 sm:pb-4 bg-background border-t border-border/20 flex items-center justify-center gap-4 shrink-0">
            <Button onClick={() => handleUpsellChoice('yes')} className="w-full bg-accent text-accent-foreground font-bold text-sm sm:text-base py-3.5 sm:py-4 rounded-full shadow-lg min-h-[46px] hover:bg-accent/90">
              Sim, eu quero!
            </Button>
            <Button onClick={() => handleUpsellChoice('no')} className="w-full bg-destructive text-destructive-foreground font-bold text-sm sm:text-base py-3.5 sm:py-4 rounded-full shadow-lg min-h-[46px] hover:bg-destructive/90">
              Não, obrigado
            </Button>
          </div>
        )}

        {/* LINK WHATSAPP PÓS UPSELL PAGO */}
        {flowStep === 'upsell_payment_confirmed' && (
          <div className="p-3.5 pb-8 sm:pb-4 bg-background border-t border-border/20 flex justify-center shrink-0">
            <Button asChild className="w-full bg-accent text-accent-foreground font-bold text-sm sm:text-base py-3.5 sm:py-4 rounded-full shadow-lg min-h-[46px] hover:bg-accent/90">
              <Link href={VANESSA_MEDIA.whatsappUrl} target="_blank">
                Conversar no WhatsApp
              </Link>
            </Button>
          </div>
        )}

        {/* LINK CHAMADA DE VÍDEO (CASO RECUSE O UPSELL OU CONCLUA O FLUXO) */}
        {flowStep === 'flow_complete_video_only' && (
          <div className="p-3.5 pb-8 sm:pb-4 bg-background border-t border-border/20 flex justify-center shrink-0">
            <Button asChild className="w-full bg-accent text-accent-foreground font-bold text-sm sm:text-base py-3.5 sm:py-4 rounded-full shadow-lg min-h-[46px] hover:bg-accent/90">
              <Link href="/chamada" target="_blank">
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
