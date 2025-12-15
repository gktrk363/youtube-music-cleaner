/**
 * YouTube Music - Liked Songs Cleaner (Sniper Mode)
 * Author: Göktürk & Gemini
 * Version: 1.0.0
 * Description: Deletes liked songs one by one to avoid rate limiting.
 */

async function cleanLikedSongs() {
    console.log("🎯 Sniper Modu başlatıldı. Şarkılar tek tek avlanıyor...");

    // AYARLAR (İsteyen burayı değiştirebilir)
    const CONFIG = {
        clickDelay: 600,      // Her silme arası bekleme süresi (ms)
        scrollDelay: 2000,    // Aşağı kaydırdıktan sonra bekleme (ms)
        scrollStep: 800,      // Ne kadar aşağı kaydırılacak (px)
        maxEmptyScrolls: 10   // Şarkı bulamazsa en fazla kaç kere aşağı insin?
    };

    let isRunning = true;
    let emptyScrollCount = 0;

    while (isRunning) {
        // Ekranda o an görünen İLK silme butonunu bul
        // Hem Türkçe, hem İngilizce, hem de ikon bazlı arama yapar
        let targetBtn = document.querySelector('button[aria-label="Beğenmekten vazgeç"]') || 
                        document.querySelector('button[aria-label="Undo like"]') ||
                        document.querySelector('ytmusic-like-button-renderer[like-status="LIKE"] button');

        if (targetBtn) {
            // Hedef bulundu, sayacı sıfırla
            emptyScrollCount = 0;

            // Görsel geri bildirim (Kırmızı çerçeve)
            targetBtn.style.border = "2px solid red";

            // Tetiği çek
            targetBtn.click();
            console.log("💥 Bir şarkı listeden uçuruldu.");

            // YouTube'un işlemi sindirmesi için bekle
            await new Promise(resolve => setTimeout(resolve, CONFIG.clickDelay));

        } else {
            // Ekranda hedef yoksa aşağı kaydır
            console.log(`👀 Görünürde hedef yok. Aşağı iniliyor... (${emptyScrollCount}/${CONFIG.maxEmptyScrolls})`);
            window.scrollBy(0, CONFIG.scrollStep);
            
            // Yeni içerik yüklenmesi için bekle
            await new Promise(resolve => setTimeout(resolve, CONFIG.scrollDelay));
            emptyScrollCount++;

            // Eğer üst üste çok kez boş kaydırdıysak işlem bitmiştir
            if (emptyScrollCount > CONFIG.maxEmptyScrolls) {
                console.log("🏁 Operasyon tamamlandı. Başka beğenilmiş şarkı görünmüyor.");
                console.log("Not: Eğer hala şarkı varsa, sayfayı yenileyip (F5) tekrar başlatın.");
                isRunning = false;
                alert("Temizlik Tamamlandı! 🎉");
            }
        }
    }
}

// Başlat
cleanLikedSongs();