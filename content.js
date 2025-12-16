console.log("%c 🧹 YTM Cleaner - Developed by Göktürk ", "background: #ff0000; color: white; padding: 5px; font-weight: bold; border-radius: 5px;");

// --- GLOBAL DEĞİŞKENLER ---
let isRunning = false;
let sniperLoop;
let whitelistArray = []; // Korunacak kelimeler burada tutulacak

// --- BAŞLANGIÇTA WHITELIST'İ ÇEK ---
chrome.storage.local.get(['whitelist'], function(result) {
    if (result.whitelist) {
        whitelistArray = result.whitelist.toLowerCase().split(',').map(s => s.trim()).filter(s => s);
        console.log("🛡️ Korunacaklar Listesi:", whitelistArray);
    }
});

// --- İLETİŞİM (Popup'tan gelen mesajlar) ---
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    // 1. İstatistik İsteği
    if (request.action === "getStats") {
        let songCount = 0;
        let subtitles = document.querySelectorAll(".second-subtitle, .subtitle, yt-formatted-string.byline-item");
        for (let sub of subtitles) {
            let text = sub.innerText;
            if (text.includes("şarkı") || text.includes("songs") || text.includes("tracks")) {
                let numbers = text.match(/(\d+)/g);
                if (numbers) { songCount = numbers[0]; break; }
            }
        }
        sendResponse({count: songCount});
    }
    
    // 2. Whitelist Güncelleme (Canlı)
    if (request.action === "updateWhitelist") {
        whitelistArray = request.data.toLowerCase().split(',').map(s => s.trim()).filter(s => s);
        console.log("🔄 Liste Güncellendi:", whitelistArray);
    }
});

// --- BUTON EKLEME ---
function butonEkle() {
    if (document.getElementById("ytm-cleaner-btn")) return;

    const btn = document.createElement("button");
    btn.id = "ytm-cleaner-btn";
    btn.innerText = "🧹 Temizliği Başlat";
    Object.assign(btn.style, {
        position: "fixed", bottom: "20px", right: "20px", zIndex: "9999",
        padding: "15px 25px", backgroundColor: "#ff0000", color: "white",
        border: "none", borderRadius: "50px", cursor: "pointer", fontWeight: "bold",
        boxShadow: "0 4px 15px rgba(0,0,0,0.5)", fontFamily: "Roboto, Arial, sans-serif"
    });

    btn.onclick = function() {
        if (!isRunning) {
            isRunning = true;
            btn.innerText = "🛑 Durdur";
            btn.style.backgroundColor = "#ff6f00";
            sniperModuBaslat();
        } else {
            isRunning = false;
            btn.innerText = "▶️ Devam Et";
            btn.style.backgroundColor = "#ff0000";
            clearTimeout(sniperLoop);
        }
    };
    document.body.appendChild(btn);
}

// --- 🔥 SNIPER MODU (AKILLI VERSİYON) ---
async function sniperModuBaslat() {
    const btn = document.getElementById("ytm-cleaner-btn");
    const CONFIG = { clickDelay: 600, scrollDelay: 2000, scrollStep: 800, maxEmptyScrolls: 15 };
    let emptyScrollCount = 0;

    async function loop() {
        if (!isRunning) return;

        // "data-skipped" etiketi OLMAYAN butonları bul
        // (Daha önce "bu şarkı kalsın" dediklerimizi tekrar seçmemek için)
        let allButtons = document.querySelectorAll(
            'button[aria-label="Beğenmekten vazgeç"]:not([data-skipped="true"]), ' +
            'button[aria-label="Undo like"]:not([data-skipped="true"]), ' +
            'ytmusic-like-button-renderer[like-status="LIKE"] button:not([data-skipped="true"])'
        );

        let targetBtn = null;

        // Bulunan butonlar arasında döngüye girip WHITELIST kontrolü yap
        for (let b of allButtons) {
            // Butonun ait olduğu satırı (şarkıyı) bul
            let row = b.closest('ytmusic-responsive-list-item-renderer');
            
            if (row) {
                // Satırdaki tüm metni al (Şarkı adı, Sanatçı adı vs.)
                let rowText = row.innerText.toLowerCase();
                
                // Yasaklı kelime var mı?
                let isSafe = whitelistArray.some(keyword => rowText.includes(keyword));

                if (isSafe) {
                    // BU ŞARKIYI KORU!
                    console.log("🛡️ KORUNDU: " + rowText.split('\n')[0]); // Konsola yaz
                    b.setAttribute("data-skipped", "true"); // İşaretle ki bir daha bakmayalım
                    row.style.opacity = "0.3"; // Görsel olarak soluklaştır (Kullanıcı anlasın)
                    continue; // Sıradaki butona geç
                }
            }
            
            // Eğer buraya geldiyse şarkı temizdir, silinebilir.
            targetBtn = b;
            break; // İlk bulduğun silinecek şarkıyı al ve döngüden çık
        }

        if (targetBtn) {
            // SİLME İŞLEMİ
            emptyScrollCount = 0;
            targetBtn.click();
            sniperLoop = setTimeout(loop, CONFIG.clickDelay);
        } else {
            // Silinecek bir şey bulunamadıysa (Hepsi korumalı veya bitti)
            window.scrollBy(0, CONFIG.scrollStep);
            emptyScrollCount++;

            if (emptyScrollCount > CONFIG.maxEmptyScrolls) {
                alert("Temizlik Tamamlandı! 🎉\n(Bazı şarkılar beyaz liste nedeniyle atlandı)");
                if(btn) {
                    btn.innerText = "Bitti ✅";
                    btn.style.backgroundColor = "#4CAF50";
                    btn.onclick = () => location.reload();
                }
                isRunning = false;
            } else {
                 sniperLoop = setTimeout(loop, CONFIG.scrollDelay);
            }
        }
    }
    loop();
}

setInterval(butonEkle, 2000);