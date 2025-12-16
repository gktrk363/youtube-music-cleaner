document.addEventListener('DOMContentLoaded', function() {
    
    // 1. İSTATİSTİKLERİ ÇEK
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "getStats"}, function(response) {
            const countSpan = document.getElementById("song-count");
            const timeSpan = document.getElementById("est-time");

            if (response && response.count) {
                let totalSongs = parseInt(response.count);
                countSpan.innerText = totalSongs;
                let totalSeconds = totalSongs * 0.8; 
                let minutes = Math.floor(totalSeconds / 60);
                timeSpan.innerText = `~${minutes} dk`;
            } else {
                countSpan.innerText = "?";
                timeSpan.innerText = "?";
            }
        });
    });

    // 2. WHITELIST İŞLEMLERİ (KAYDET & YÜKLE)
    const textArea = document.getElementById('whitelist-input');
    const saveBtn = document.getElementById('save-btn');
    const saveMsg = document.getElementById('save-msg');

    // Açılışta kayıtlı veriyi yükle
    chrome.storage.local.get(['whitelist'], function(result) {
        if (result.whitelist) {
            textArea.value = result.whitelist;
        }
    });

    // Kaydet butonuna basınca
    saveBtn.addEventListener('click', function() {
        const text = textArea.value;
        chrome.storage.local.set({whitelist: text}, function() {
            // Kullanıcıya bildirim ver
            saveMsg.style.display = "inline";
            setTimeout(() => { saveMsg.style.display = "none"; }, 2000);
            
            // Eğer o an script çalışıyorsa, yeni listeyi ona da haber ver (Opsiyonel ama şık)
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {action: "updateWhitelist", data: text});
            });
        });
    });
});