const CONFIG = {
    API_URL: "https://api.pushinpay.com.br/api/pix/cashIn",
    API_TOKEN: "Bearer 61191|v8sG2IivZ9bJ0gC2oOdeUaAaNcasT8lgmp1f2Dqb6572cc0c",
    IMAGES: [
        "https://playblog.ws/play/wp-content/uploads/2018/06/Buceta-rosada-05.jpg",
        "https://playblog.ws/play/wp-content/uploads/2018/06/Buceta-rosada-08.jpg"
    ],
    AUDIO: "https://gvdtvgefzbxunjrtzrdw.supabase.co/storage/v1/object/public/media/ope5n4r6qwn_1769542058281.mp3",
    VIDEO: "video_chamada.mp4",
    MEGA_LINK: "https://mega.nz/folder/cC9FSDTY#4xZVUGWduRHouSdNDNpsuw/folder/UG80WSRBn"
};

const STATE = {
    hasPaidGeneric: false, // Tracks if they bought the photos/videos
    callDuration: 0
};

// --- DOM Elements ---
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

    console.log("DOM Loaded, elements initialized");
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
        alert("Erro interno: Tela não encontrada (" + screenName + ")");
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
    // Attempt play
    audioPlayer.play().catch(e => console.log("Audio autoplay blocked, user interaction needed next time"));
}

function acceptUpsell() {
    audioPlayer.pause(); // Stop audio
    processPayment(989, "Pack 100 Fotos + Vídeos")
        .then(() => {
            STATE.hasPaidGeneric = true;
            // Immediate Start, Album Access at end
            alert("Pagamento Confirmado! O álbum estará disponível no final da chamada.");
            startVideoCall();
        });
}

function declineUpsell() {
    audioPlayer.pause(); // Stop audio
    showScreen('downsell');
}

function acceptDownsell() {
    processPayment(500, "Desconto Pack Fotos")
        .then(() => {
            STATE.hasPaidGeneric = true;
            alert("Pagamento Confirmado! O álbum estará disponível no final da chamada.");
            startVideoCall();
        });
}

function showMegaLink() {
    // Legacy generic function, now handled by end screen logic
}

function startVideoCall() {
    audioPlayer.pause(); // Ensure audio is stopped
    audioPlayer.currentTime = 0;

    showScreen('video');

    // Start Main Video
    remoteVideo.src = CONFIG.VIDEO;
    remoteVideo.play();
    remoteVideo.loop = true;

    // Start Webcam
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => {
            localVideo.srcObject = stream;
        })
        .catch(err => {
            console.error("Camera access denied:", err);
            localVideo.style.display = 'none'; // Hide if failed
        });
}

function endCall() {
    remoteVideo.pause();
    // Stop webcam
    if (localVideo.srcObject) {
        localVideo.srcObject.getTracks().forEach(track => track.stop());
    }
    showScreen('postcall');

    // Auto-play WhatsApp offer
    const waAudio = document.getElementById('whatsapp-audio');
    if (waAudio) waAudio.play().catch(e => console.log("Autoplay blocked"));

    // Show Album Access if paid
    if (STATE.hasPaidGeneric) {
        document.getElementById('album-access-area').style.display = 'block';
    }
}

function acceptWhatsAppUpsell() {
    processPayment(800, "WhatsApp Pessoal da Vanessa")
        .then(() => {
            unlockWhatsApp();
        });
}

function showWhatsAppDownsell() {
    document.getElementById('btn-buy-whatsapp').style.display = 'none';
    document.getElementById('whatsapp-refusal').style.display = 'none';
    document.getElementById('whatsapp-downsell').style.display = 'block';
}

function acceptWhatsAppDownsell() {
    processPayment(500, "WhatsApp (Desconto)")
        .then(() => {
            unlockWhatsApp();
        });
}

function unlockWhatsApp() {
    // Hide offer/downsell interfaces, show Access button
    document.getElementById('btn-buy-whatsapp').style.display = 'none';
    document.getElementById('whatsapp-refusal').style.display = 'none';
    document.getElementById('whatsapp-downsell').style.display = 'none';

    document.getElementById('btn-access-whatsapp').style.display = 'flex';
}

// --- Payment System ---

function processPayment(amountCents, description) {
    return new Promise((resolve, reject) => {
        // Show Modal
        paymentModal.style.display = 'flex';
        const qrImg = document.getElementById('pay-qr');
        const codeText = document.getElementById('pay-code');
        const statusText = document.getElementById('pay-status');
        const copyBtn = document.getElementById('btn-copy');
        const confirmBtn = document.getElementById('btn-confirm-pay');

        // Reset Modal UI
        qrImg.src = '';
        codeText.value = 'Gerando...';
        statusText.innerText = `Gerando Cobrança: ${description}`;
        qrImg.style.display = 'none';
        confirmBtn.style.display = 'none';
        confirmBtn.innerText = "Já Fiz o Pagamento";
        confirmBtn.disabled = false;

        // 1. Call API
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
                    const transactionId = data.id; // Capture ID

                    qrImg.src = data.qr_code_base64;
                    qrImg.style.display = 'block';
                    codeText.value = data.qr_code;
                    statusText.innerText = "Aguardando Pagamento...";
                    confirmBtn.style.display = 'block';
                    confirmBtn.disabled = false;
                    confirmBtn.innerText = "Já Fiz o Pagamento";

                    // Start Polling (Every 5 seconds)
                    const pollInterval = setInterval(() => {
                        checkPaymentStatus(transactionId, resolve, confirmBtn, statusText, pollInterval, true, amountCents);
                    }, 5000);

                    // Copy logic
                    copyBtn.onclick = () => {
                        navigator.clipboard.writeText(data.qr_code);
                        copyBtn.innerText = "Copiado!";
                        setTimeout(() => copyBtn.innerText = "Copiar", 2000);
                    };

                    // Manual Confirm logic
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

    // Visual feedback only if manually clicked
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
                clearInterval(intervalId); // Stop polling

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
                // Still pending
                console.log("Status atual:", data.status);

                // Only alert/update UI if it was a manual click, not automatic polling
                if (btn && !isPolling) {
                    btn.innerText = "Já Fiz o Pagamento"; // Reset button text
                    btn.disabled = false;

                    alert("Pagamento não identificado. Por favor, aguarde alguns instantes ou tente novamente.");
                    statusLabel.innerText = "Pagamento não identificado.";
                }
            }
        })
        .catch(err => {
            console.error("Erro no polling:", err);
        });
}
