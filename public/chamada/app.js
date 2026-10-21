const CONFIG = {
    API_URL: "https://api.pushinpay.com.br/api/pix/cashIn",
    API_TOKEN: "Bearer 61191|v8sG2IivZ9bJ0gC2oOdeUaAaNcasT8lgmp1f2Dqb6572cc0c",
    IMAGES: [
        "https://vootlkuyzwzvpxcfkfzk.supabase.co/storage/v1/object/public/public-files/1792440532240-pumwurh.jpg",
        "https://vootlkuyzwzvpxcfkfzk.supabase.co/storage/v1/object/public/public-files/1792441916294-1kp2rp.jpg"
    ],
    AUDIO: "audio_upsell.mp3",
    VIDEO: "video_chamada.mp4",
    MEGA_LINK: "https://mega.nz/folder/cC9FSDTY#4xZVUGWduRHouSdNDNpsuw/folder/UG80WSRBn"
};

const STATE = {
    hasPaidGeneric: false,
    callDuration: 0,
    isMuted: false,
    isCameraOn: true
};

// --- DOM Elements ---
let screens = {};
let paymentModal, audioPlayer, remoteVideo, localVideo;

document.addEventListener('DOMContentLoaded', () => {
    screens = {
        intro: document.getElementById('intro-screen'),
        upsell: document.getElementById('upsell-screen'),
        downsell: document.getElementById('downsell-screen'),
        video: document.getElementById('video-screen'),
        postcall: document.getElementById('postcall-screen')
    };

    paymentModal = document.getElementById('payment-modal');
    audioPlayer = document.getElementById('offer-audio');
    remoteVideo = document.getElementById('remote-video');
    localVideo = document.getElementById('local-video');

    // Pre-carrega o vídeo para iniciar instantaneamente
    if (remoteVideo) {
        remoteVideo.src = CONFIG.VIDEO;
        remoteVideo.load();
    }

    console.log("DOM Loaded, Vanessa Call initialized");
});

// --- Navigation ---
function showScreen(screenName) {
    console.log("Switching to screen:", screenName);
    Object.values(screens).forEach(s => {
        if (s) s.classList.remove('active');
    });

    if (screens[screenName]) {
        screens[screenName].classList.add('active');
    } else {
        console.error("Screen not found:", screenName);
    }
}

// --- Logic ---
function startExperience() {
    if (window.OneSignalDeferred) {
        window.OneSignalDeferred.push(async function(OneSignal) {
            try {
                await OneSignal.Notifications.requestPermission();
            } catch (err) {
                console.log("Notificação:", err);
            }
        });
    }

    showScreen('upsell');
    if (audioPlayer) {
        audioPlayer.play().catch(e => console.log("Audio autoplay aguardando interação:", e));
    }
}

function acceptUpsell() {
    if (audioPlayer) audioPlayer.pause();
    processPayment(989, "Pack 100 Fotos + Vídeos da Vanessa")
        .then(() => {
            STATE.hasPaidGeneric = true;
            alert("Pagamento Confirmado! O álbum estará disponível no final da chamada.");
            startVideoCall();
        });
}

function declineUpsell() {
    if (audioPlayer) audioPlayer.pause();
    showScreen('downsell');
}

function acceptDownsell() {
    processPayment(500, "Desconto Pack Fotos da Vanessa")
        .then(() => {
            STATE.hasPaidGeneric = true;
            alert("Pagamento Confirmado! O álbum estará disponível no final da chamada.");
            startVideoCall();
        });
}

function startVideoCall() {
    if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
    }

    showScreen('video');

    if (remoteVideo) {
        remoteVideo.setAttribute('playsinline', '');
        remoteVideo.setAttribute('webkit-playsinline', '');
        if (!remoteVideo.src || !remoteVideo.src.includes(CONFIG.VIDEO)) {
            remoteVideo.src = CONFIG.VIDEO;
        }
        remoteVideo.loop = true;

        // Tenta iniciar com som
        const playPromise = remoteVideo.play();
        if (playPromise !== undefined) {
            playPromise.catch(err => {
                console.warn("Autoplay com som bloqueado pelo navegador mobile. Iniciando em mute como fallback:", err);
                remoteVideo.muted = true;
                STATE.isMuted = true;
                updateSoundIcon(false);
                remoteVideo.play().catch(e => console.error("Erro fatal ao dar play no vídeo:", e));
            });
        }
    }

    // Start Webcam (opcional, simulação de câmera frontal)
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true, audio: false })
            .then(stream => {
                if (localVideo) {
                    localVideo.srcObject = stream;
                    localVideo.style.display = 'block';
                }
            })
            .catch(err => {
                console.log("Câmera do usuário não concedida:", err);
                if (localVideo) localVideo.style.display = 'none';
            });
    } else {
        if (localVideo) localVideo.style.display = 'none';
    }
}

function toggleAudio() {
    if (!remoteVideo) return;
    remoteVideo.muted = !remoteVideo.muted;
    STATE.isMuted = remoteVideo.muted;
    updateSoundIcon(!remoteVideo.muted);
}

function updateSoundIcon(hasSound) {
    const icon = document.getElementById('icon-sound');
    if (icon) {
        icon.innerText = hasSound ? 'volume_up' : 'volume_off';
        icon.style.color = hasSound ? '#10b981' : '#ef4444';
    }
}

function toggleCamera() {
    if (!localVideo) return;
    STATE.isCameraOn = !STATE.isCameraOn;
    localVideo.style.display = STATE.isCameraOn ? 'block' : 'none';
}

function endCall() {
    if (remoteVideo) remoteVideo.pause();
    if (localVideo && localVideo.srcObject) {
        localVideo.srcObject.getTracks().forEach(track => track.stop());
    }
    showScreen('postcall');

    // Auto-play áudio de encerramento da proposta de WhatsApp
    const waAudio = document.getElementById('whatsapp-audio');
    if (waAudio) {
        waAudio.play().catch(e => console.log("Postcall audio aguardando toque:", e));
    }

    // Mostra acesso ao álbum se comprou o upsell
    if (STATE.hasPaidGeneric) {
        const albumArea = document.getElementById('album-access-area');
        if (albumArea) albumArea.style.display = 'block';
    }
}

function acceptWhatsAppUpsell() {
    processPayment(800, "WhatsApp Pessoal da Vanessa")
        .then(() => {
            unlockWhatsApp();
        });
}

function showWhatsAppDownsell() {
    const buyBtn = document.getElementById('btn-buy-whatsapp');
    const refText = document.getElementById('whatsapp-refusal');
    const downsell = document.getElementById('whatsapp-downsell');

    if (buyBtn) buyBtn.style.display = 'none';
    if (refText) refText.style.display = 'none';
    if (downsell) downsell.style.display = 'block';
}

function acceptWhatsAppDownsell() {
    processPayment(500, "WhatsApp (Desconto da Vanessa)")
        .then(() => {
            unlockWhatsApp();
        });
}

function unlockWhatsApp() {
    const buyBtn = document.getElementById('btn-buy-whatsapp');
    const refText = document.getElementById('whatsapp-refusal');
    const downsell = document.getElementById('whatsapp-downsell');
    const accessBtn = document.getElementById('btn-access-whatsapp');

    if (buyBtn) buyBtn.style.display = 'none';
    if (refText) refText.style.display = 'none';
    if (downsell) downsell.style.display = 'none';
    if (accessBtn) accessBtn.style.display = 'flex';
}

// --- Payment System (PushinPay) ---
function processPayment(amountCents, description) {
    return new Promise((resolve, reject) => {
        paymentModal.style.display = 'flex';
        const qrImg = document.getElementById('pay-qr');
        const codeText = document.getElementById('pay-code');
        const statusText = document.getElementById('pay-status');
        const copyBtn = document.getElementById('btn-copy');
        const confirmBtn = document.getElementById('btn-confirm-pay');

        qrImg.src = '';
        codeText.value = 'Gerando...';
        statusText.innerText = `Gerando Cobrança: ${description}`;
        qrImg.style.display = 'none';
        confirmBtn.style.display = 'none';
        confirmBtn.innerText = "Já Fiz o Pagamento";
        confirmBtn.disabled = false;

        fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Authorization': CONFIG.API_TOKEN,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                value: amountCents,
                webhook_url: "http://seuservico.com/webhook"
            })
        })
            .then(res => res.json())
            .then(data => {
                if (data.qr_code_base64) {
                    if (typeof window.fbq === 'function') {
                        const checkoutVal = amountCents / 100;
                        window.fbq('track', 'InitiateCheckout', { value: checkoutVal, currency: 'BRL' });
                        console.log('[Pixel] InitiateCheckout tracked:', { value: checkoutVal, currency: 'BRL' });
                    }
                    const transactionId = data.id;

                    qrImg.src = data.qr_code_base64;
                    qrImg.style.display = 'block';
                    codeText.value = data.qr_code;
                    statusText.innerText = "Aguardando Pagamento...";
                    confirmBtn.style.display = 'block';
                    confirmBtn.disabled = false;
                    confirmBtn.innerText = "Já Fiz o Pagamento";

                    const pollInterval = setInterval(() => {
                        checkPaymentStatus(transactionId, resolve, confirmBtn, statusText, pollInterval, true, amountCents);
                    }, 5000);

                    copyBtn.onclick = () => {
                        navigator.clipboard.writeText(data.qr_code);
                        copyBtn.innerText = "Copiado!";
                        setTimeout(() => copyBtn.innerText = "Copiar", 2000);
                    };

                    confirmBtn.onclick = () => {
                        checkPaymentStatus(transactionId, resolve, confirmBtn, statusText, pollInterval, false, amountCents);
                    };
                } else {
                    statusText.innerText = "Erro ao gerar PIX.";
                }
            })
            .catch(err => {
                console.error(err);
                statusText.innerText = "Erro de conexão.";
            });
    });
}

function checkPaymentStatus(txId, resolveCallback, btn, statusLabel, intervalId, isPolling = false, amountCents = 0) {
    if (!txId) return;

    if (btn && !isPolling) btn.innerText = "Verificando...";

    fetch(`https://api.pushinpay.com.br/api/transactions/${txId}`, {
        method: 'GET',
        headers: {
            'Authorization': CONFIG.API_TOKEN,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'paid') {
                if (typeof window.fbq === 'function') {
                    const purchaseValue = (amountCents ? amountCents / 100 : 0);
                    window.fbq('track', 'Purchase', { value: purchaseValue, currency: 'BRL' });
                    console.log('[Pixel] Purchase tracked:', { value: purchaseValue, currency: 'BRL' });
                }
                clearInterval(intervalId);

                if (btn) {
                    btn.innerText = "Pagamento Aprovado!";
                    btn.style.backgroundColor = "#10b981";
                }
                statusLabel.innerText = "Sucesso!";

                setTimeout(() => {
                    paymentModal.style.display = 'none';
                    resolveCallback(true);
                }, 1000);
            } else {
                console.log("Status atual:", data.status);
                if (btn && !isPolling) {
                    btn.innerText = "Já Fiz o Pagamento";
                    btn.disabled = false;
                    alert("Pagamento não identificado ainda. Aguarde alguns instantes e tente novamente.");
                    statusLabel.innerText = "Aguardando confirmação...";
                }
            }
        })
        .catch(err => {
            console.error("Erro no polling:", err);
        });
}
