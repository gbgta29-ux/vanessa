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
  fotoSensual: "https://vootlkuyzwzvpxcfkfzk.supabase.co/storage/v1/object/public/public-files/1792440532240-pumwurh.jpg",
  fotoIntima: "https://vootlkuyzwzvpxcfkfzk.supabase.co/storage/v1/object/public/public-files/1792441916294-1kp2rp.jpg",
  videoTeaser: "https://vootlkuyzwzvpxcfkfzk.supabase.co/storage/v1/object/public/public-files/1792442085405-gbe6a9.mp4",
  audio1_boasvindas: "/vanessa/audio_1_boasvindas.mp3",
  audio2_nome: "/vanessa/audio_2_nome.mp3",
  audio3_permissao: "/vanessa/audio_3_permissao.mp3",
  audio4_lingerie: "/vanessa/audio_4_lingerie.mp3",
  audio5_chamada: "/vanessa/audio_5_chamada.mp3",
  audio6_pix: "/vanessa/audio_6_pix.mp3",
  audio7_objecao: "/vanessa/audio_7_objecao.mp3",
  audio8_upsell: "/vanessa/audio_8_upsell.mp3",
  whatsappUrl: "https://wa.me/5543996011408?text=Oiii%20Vanessa%2C%20acabei%20de%20pegar%20seu%20WhatsApp%20VIP%20aqui!%20Vem%20falar%20comigo%20amor...%20%F0%9F%94%A5"
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("digitando...");
  const [statusText, setStatusText] = useState("online");
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

  // SIMULADOR REALISTA DE DIGITAÇÃO DE WHATSAPP
  const simulateTyping = async (text: string, customDelay?: number) => {
    const typingDuration = customDelay ?? Math.min(3200, Math.max(1600, text.length * 40));
    setStatusText("digitando...");
    setLoadingText("digitando...");
    setIsLoading(true);
    await delay(typingDuration);
    setIsLoading(false);
    setStatusText("online");
    addMessage({ type: 'text', text }, 'bot');
    await delay(800);
  };

  // SIMULADOR REALISTA DE GRAVAÇÃO DE ÁUDIO NO WHATSAPP
  const simulateRecording = async (duration = 2400) => {
    setStatusText("gravando áudio...");
    setLoadingText("gravando áudio...");
    setIsLoading(true);
    await delay(duration);
    setIsLoading(false);
    setStatusText("online");
  };

  const playAudioSequence = async (url: string, waitAfter = 1200) => {
    // Primeiro simula que ela está segurando o microfone no WhatsApp
    await simulateRecording(2200);

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
    await delay(waitAfter);
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

  // STEP 1: FLUXO DE BOAS-VINDAS COM CADÊNCIA REALISTA DE WHATSAPP
  useEffect(() => {
    const runWelcomeFlow = async () => {
      if (isFlowRunning.current) return;
      isFlowRunning.current = true;

      const currentCity = await getCity();
      setCity(currentCity);

      // Pausa inicial natural como se ela estivesse online abrindo a conversa
      await delay(1200);

      // Áudio 1: Boas-vindas da Vanessa
      await playAudioSequence(VANESSA_MEDIA.audio1_boasvindas, 1000);

      // Foto casual
      addMessage({ type: 'image', url: VANESSA_MEDIA.fotoCasual }, 'bot');
      await delay(1500);

      // Digitando a frase da foto com delay proporcional
      await simulateTyping("Essa foto eu tirei hoje mais cedo ❤🔥", 2000);
      await delay(1000);

      // Digitando a frase da cidade
      const locationText = currentCity === 'do Brasil' ? "aqui no Brasil" : `em ${currentCity}`;
      await simulateTyping(`E estou morando ${locationText}...`, 1800);
      await delay(1000);

      // Áudio 2: Pergunta o nome
      await playAudioSequence(VANESSA_MEDIA.audio2_nome, 800);

      // Digita a pergunta do nome
      await simulateTyping("Qual seu nome, bb? 💗", 1600);

      setShowInput(true);
      setFlowStep('awaiting_name');
    };

    if (isStarted) {
      runWelcomeFlow();
    }
  }, [isStarted]);

  // CRIAÇÃO DE PIX:
  // - Entrada: R$ 9,99 na API (999 centavos), exibindo R$ 10,00 no design
  // - Upsell: R$ 19,99 (1999 centavos)
  const handleCreatePix = async (value: number, isUpsell: boolean = false) => {
    setIsCreatingPix(true);
    if (!isUpsell) {
      await simulateTyping("vou mandar meu pix pra você bb... 😍", 1800);
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
        // Visualmente informa R$ 10,00 no texto e no card:
        await simulateTyping("Prontinho amor, o valor é só R$ 10,00. Faz o pagamento pra gente começar nossa chamada de vídeo agora... 🔥", 2200);
        addMessage({ type: 'pix', sender: 'bot', pixCopyPaste: charge.pixCopyPaste, value: 10.00 });
      }
    } else {
      await simulateTyping("Ops, não consegui gerar o PIX agora, amor. Tenta de novo em um minutinho.", 1800);
      setFlowStep(isUpsell ? 'payment_confirmed_awaiting_upsell_choice' : 'awaiting_after_audio_14_response');
      if (!isUpsell) setShowInput(true);
    }
    setIsCreatingPix(false);
  };

  // VERIFICAÇÃO DE PAGAMENTO & TRATAMENTO DE OBJEÇÃO
  const handleCheckPayment = async (txId: string, value: number, isUpsell: boolean = false) => {
    if (!txId || isCheckingPayment) return;

    addMessage({ type: 'text', text: "Já paguei" }, 'user');
    setIsCheckingPayment(true);
    
    // Simula ela lendo e respondendo que vai checar
    await delay(1200);
    await simulateTyping("Ok amor, só um momento que vou verificar... 😍", 1600);
    
    await delay(6000);

    const result = await checkPaymentStatus(txId);

    if (result?.status === 'paid') {
      fpixelTrack('Purchase', { value: value / 100, currency: 'BRL' });
      if (isUpsell) {
        await simulateTyping("Pagamento confirmado, gostoso! 🔥 Clica no botão abaixo pra gente conversar no WhatsApp agora mesmo!", 2400);
        setFlowStep('upsell_payment_confirmed');
      } else {
        // Áudio 8: Upsell liberando o WhatsApp
        await playAudioSequence(VANESSA_MEDIA.audio8_upsell, 1000);
        await simulateTyping("Amor, acabei de liberar meu número pessoal pra você... Quer pagar só mais R$ 19,99 pra gente conversar por lá? 😏", 2500);
        setFlowStep('payment_confirmed_awaiting_upsell_choice');
      }
    } else {
      // Áudio 7: Objeção caso ainda não tenha compensado
      await playAudioSequence(VANESSA_MEDIA.audio7_objecao, 1000);
      await simulateTyping("Amor, ainda não constou aqui no meu banco... Confere no seu aplicativo se o Pix foi concluído certinho que eu já tô prontinha te esperando! 🥺", 2600);
    }
    setIsCheckingPayment(false);
  };

  const handleUpsellChoice = async (choice: 'yes' | 'no') => {
    setFlowStep('initial');
    if (choice === 'yes') {
      addMessage({ type: 'text', text: 'Sim, eu quero!' }, 'user');
      setIsCreatingPix(true);
      await delay(1000);
      await simulateTyping("Oba! Sabia que você ia querer, amor. Vou gerar o PIX de R$19,99 pra você.", 2000);
      await handleCreatePix(1999, true);
      setIsCreatingPix(false);
    } else {
      addMessage({ type: 'text', text: 'Não, obrigado' }, 'user');
      await delay(1000);
      await simulateTyping("Tudo bem, amor. Sem problemas! Clica no botão abaixo pra gente começar nossa chamada de vídeo agora. 😍", 2200);
      setFlowStep('flow_complete_video_only');
    }
  };

  // GERENCIADOR DE RESPOSTAS DO USUÁRIO (CADÊNCIA NATURAL DE CONVERSA)
  const formAction = async (formData: FormData) => {
    const userMessageText = formData.get("message") as string;
    if (!userMessageText.trim()) return;

    addMessage({ type: 'text', text: userMessageText }, 'user');
    setShowInput(false);

    switch (flowStep) {
      // 1. Recebeu o nome do lead -> Lê o nome e pergunta se pode chamar de amor
      case 'awaiting_name':
        setUserName(userMessageText);
        // Pausa como se estivesse lendo
        await delay(1400);
        await simulateTyping(`Adorei seu nome ${userMessageText}, 💗 posso te chamar de amor?`, 2200);
        setFlowStep('awaiting_amor_permission');
        setShowInput(true);
        break;

      // 2. Recebeu permissão de chamar de amor -> Grava Áudio 3 e pede permissão da foto
      case 'awaiting_amor_permission':
        await delay(1200);
        await playAudioSequence(VANESSA_MEDIA.audio3_permissao, 1000);
        await simulateTyping("Acho que vai gostar rsrs , posso mandar ?", 1800);
        setFlowStep('awaiting_after_gostar_response');
        setShowInput(true);
        break;

      // 3. Recebeu permissão para mandar a foto sensual
      case 'awaiting_after_gostar_response':
        await delay(1000);
        addMessage({ type: 'image', url: VANESSA_MEDIA.fotoSensual }, 'bot');
        // Dá 2 segundos para o lead ver a foto antes de ela perguntar
        await delay(2000);
        await simulateTyping("O que você achou bb??", 1600);
        setFlowStep('awaiting_after_picante_response');
        setShowInput(true);
        break;

      // 4. Recebeu o elogio da foto sensual -> Áudio 4 de lingerie + Foto Íntima + Vídeo + Áudio 5 de chamada
      case 'awaiting_after_picante_response':
        await delay(1200);
        await playAudioSequence(VANESSA_MEDIA.audio4_lingerie, 1200);
        
        // Manda a foto íntima
        addMessage({ type: 'image', url: VANESSA_MEDIA.fotoIntima }, 'bot');
        await delay(1800);

        // Manda o vídeo teaser e aguarda terminar
        await playVideoSequence(VANESSA_MEDIA.videoTeaser, 2000);

        // Áudio 5: Convite para chamada ao vivo
        await playAudioSequence(VANESSA_MEDIA.audio5_chamada, 1000);
        await simulateTyping("eae bb bora chamadinha então ? 🔥", 1800);

        setFlowStep('awaiting_after_audio_14_response');
        setShowInput(true);
        break;

      // 5. Aceitou a chamadinha -> Áudio 6 falando dos 10 reais e GERA PIX DE R$ 9,99 (visual R$ 10,00)
      case 'awaiting_after_audio_14_response':
        await delay(1200);
        await playAudioSequence(VANESSA_MEDIA.audio6_pix, 1200);
        await handleCreatePix(999);
        break;

      case 'chat_mode':
        try {
          await delay(1000);
          setStatusText("digitando...");
          setLoadingText("digitando...");
          setIsLoading(true);
          const { response } = await sendMessage(userMessageText);
          setIsLoading(false);
          setStatusText("online");
          addMessage({ type: 'text', text: response }, 'bot');
        } catch (error) {
          console.error(error);
          setIsLoading(false);
          setStatusText("online");
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

        {/* HEADER COM STATUS DINÂMICO (ONLINE / DIGITANDO... / GRAVANDO ÁUDIO...) */}
        <ChatHeader statusText={statusText} />
        
        <div 
          className="flex-1 min-h-0 overflow-y-auto"
          style={{
            backgroundImage: "url('https://wallpapers.com/images/hd/whatsapp-chat-doodle-patterns-jyd5uvep2fdwjl97.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <ChatMessages 
            messages={messages} 
            isLoading={isLoading} 
            loadingText={loadingText} 
            autoPlayingAudioId={autoPlayingAudioId} 
          />
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
                const value = flowStep === 'awaiting_pix_payment' ? 999 : 1999;
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
