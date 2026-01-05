// Globale Variablen für Daten
let items = [];
let tips = [];
let moneyMethods = [];
let config = {};

// JSON Daten laden mit Fehlerbehandlung
async function loadData() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        items = data.items || [];
        tips = data.tips || [];
        moneyMethods = data.moneyMethods || [];
        config = data.config || {};
        
        console.log('✅ Daten erfolgreich geladen:', {
            items: items.length,
            tips: tips.length,
            methods: moneyMethods.length
        });
        
        return true;
    } catch (error) {
        console.error('❌ Fehler beim Laden der Daten:', error);
        alert('Fehler: data.json konnte nicht geladen werden. Bitte stelle sicher, dass die Datei existiert.');
        return false;
    }
}

// Warte bis DOM geladen ist
document.addEventListener('DOMContentLoaded', async function() {
    
    console.log('🚀 Script wird initialisiert...');
    
    // Lade Daten aus JSON
    const dataLoaded = await loadData();
    if (!dataLoaded) {
        console.error('⛔ Daten konnten nicht geladen werden! Breche Initialisierung ab.');
        return;
    }
    
    // DOM Elemente
    const container = document.getElementById("itemsContainer");
    const searchInput = document.getElementById("search");
    const categorySelect = document.getElementById("category");
    const sortSelect = document.getElementById("sortBy");
    
    // Calculator Modal Elemente
    const calculatorModal = document.getElementById("calculatorModal");
    const closeCalcBtn = document.getElementById("closeModalBtn");
    const modalItemName = document.getElementById("modalItemName");
    const modalItemPrice = document.getElementById("modalItemPrice");
    const modalItemAmount = document.getElementById("modalItemAmount");
    const modalTotalPrice = document.getElementById("modalTotalPrice");
    const modalStacks = document.getElementById("modalStacks");
    
    // Money Guide Modal Elemente
    const moneyModal = document.getElementById("moneyGuideModal");
    const moneyGuideBtn = document.getElementById("moneyGuideBtn");
    const closeMoneyBtn = document.getElementById("closeMoneyModalBtn");
    
    // Site Config anwenden
    function applyConfig() {
        // Titel und Untertitel
        const heading = document.querySelector('.store-heading');
        const subheading = document.querySelector('.store-subheading');
        if (heading) heading.textContent = config.siteName || 'Item Rechner';
        if (subheading) subheading.textContent = config.subtitle || 'Berechne die Kosten';
        
        // Kategorien Anzahl
        const statCards = document.querySelectorAll('.stat-card .stat-value');
        if (statCards[1]) {
            statCards[1].textContent = config.totalCategories || 9;
        }
        
        // Beliebtestes Item
        const popularItemElement = document.getElementById('popularItem');
        if (popularItemElement) {
            popularItemElement.textContent = config.popularItem || 'Diamond';
        }
        
        console.log('✅ Config angewendet');
    }
    
    // Items rendern
    function renderItems() {
        if (!container) {
            console.error('❌ Container nicht gefunden!');
            return;
        }
        
        const search = searchInput ? searchInput.value.toLowerCase() : "";
        const category = categorySelect ? categorySelect.value : "Alle";
        const sort = sortSelect ? sortSelect.value : "name";
        container.innerHTML = "";
        
        let filtered = items.filter(item =>
            item.name.toLowerCase().includes(search) &&
            (category === "Alle" || item.category === category)
        );
        
        // Sortierung anwenden
        switch(sort) {
            case "price-asc":
                filtered.sort((a, b) => a.price - b.price);
                break;
            case "price-desc":
                filtered.sort((a, b) => b.price - a.price);
                break;
            case "stack":
                filtered.sort((a, b) => b.stack - a.stack);
                break;
            case "name":
            default:
                filtered.sort((a, b) => a.name.localeCompare(b.name));
                break;
        }
        
        // Wenn keine Items gefunden
        if (filtered.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">
                    <i class="fa-solid fa-magnifying-glass" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <p style="font-size: 1.2rem;">Keine Items gefunden</p>
                    <p style="font-size: 0.9rem; margin-top: 0.5rem;">Versuche einen anderen Suchbegriff</p>
                </div>
            `;
            return;
        }
        
        filtered.forEach(item => {
            const card = document.createElement("div");
            card.className = "item-card" + (item.popular ? " popular" : "");
            card.innerHTML = `
                <div class="item-icon">
                    <i class="fa-solid ${item.icon}"></i>
                </div>
                <div class="item-name">${item.name}</div>
                <div class="item-price">${item.price.toFixed(2)}${config.currency} / Stück</div>
                <div class="item-stack">Stack: ${item.stack}</div>
                <div class="item-stack-price">Stack-Preis: ${(item.price * item.stack).toFixed(2)}${config.currency}</div>
            `;
            card.onclick = () => openCalculatorModal(item);
            container.appendChild(card);
        });
        
        // Update Stats
        const totalItemsElement = document.getElementById("totalItems");
        if (totalItemsElement) {
            totalItemsElement.textContent = items.length;
        }
        
        console.log(`✅ ${filtered.length} Items gerendert`);
    }
    
    // Calculator Modal öffnen
    let currentItem = null;
    
    function openCalculatorModal(item) {
        if (!calculatorModal) {
            console.error('❌ Calculator Modal nicht gefunden!');
            return;
        }
        
        currentItem = item;
        calculatorModal.classList.remove("hidden");
        
        if (modalItemName) modalItemName.textContent = item.name;
        if (modalItemPrice) modalItemPrice.textContent = item.price.toFixed(2);
        if (modalItemAmount) modalItemAmount.value = 1;
        
        updateCalculator(item);
        
        console.log('✅ Calculator Modal geöffnet für:', item.name);
    }
    
    // Calculator aktualisieren
    function updateCalculator(item) {
        if (!modalItemAmount || !modalTotalPrice || !modalStacks) return;
        
        const amount = parseInt(modalItemAmount.value) || 1;
        const total = item.price * amount;
        modalTotalPrice.textContent = total.toFixed(2);
        
        const stacks = Math.floor(amount / item.stack);
        const remainder = amount % item.stack;
        modalStacks.textContent = `${stacks} Stacks + ${remainder} Items`;
    }
    
    // Event Listener für Amount Input
    if (modalItemAmount) {
        modalItemAmount.addEventListener('input', function() {
            if (currentItem) {
                updateCalculator(currentItem);
            }
        });
    }
    
    // Quick Amount Buttons
    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const amount = parseInt(this.dataset.amount);
            if (modalItemAmount && currentItem) {
                modalItemAmount.value = amount;
                updateCalculator(currentItem);
            }
        });
    });
    
    // Money Guide Modal mit Daten füllen
    function fillMoneyGuide() {
        const methodsContainer = document.querySelector('.money-methods');
        if (!methodsContainer || !moneyMethods) {
            console.error('❌ Money Methods Container nicht gefunden!');
            return;
        }
        
        methodsContainer.innerHTML = '';
        
        moneyMethods.forEach(method => {
            const stars = '<i class="fa-solid fa-star"></i>'.repeat(method.difficulty);
            const requirements = method.requirements.map(req => `<li>${req}</li>`).join('');
            
            const methodCard = `
                <div class="method-card">
                    <div class="method-header">
                        <div class="method-icon ${method.iconColor}">
                            <i class="fa-solid ${method.icon}"></i>
                        </div>
                        <div class="method-info">
                            <h3 class="method-title">${method.title}</h3>
                            <div class="method-difficulty">
                                ${stars}
                                <span>${method.difficultyText}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="method-description">
                        ${method.description}
                    </div>
                    
                    <div class="method-stats">
                        <div class="stat-item">
                            <i class="fa-solid fa-clock"></i>
                            <span>${method.time}</span>
                        </div>
                        <div class="stat-item">
                            <i class="fa-solid fa-coins"></i>
                            <span class="earning">${method.earning}</span>
                        </div>
                    </div>
                    
                    <div class="method-requirements">
                        <strong>Benötigt:</strong>
                        <ul>
                            ${requirements}
                        </ul>
                    </div>
                    
                    <div class="method-tips">
                        <i class="fa-solid fa-lightbulb"></i>
                        <strong>Tipp:</strong> ${method.tip}
                    </div>
                </div>
            `;
            
            methodsContainer.insertAdjacentHTML('beforeend', methodCard);
        });
        
        console.log('✅ Money Guide gefüllt mit', moneyMethods.length, 'Methoden');
    }
    
    // Zufälligen Tipp anzeigen
    function showRandomTip() {
        const tipsElement = document.getElementById("tipsText");
        if (tipsElement && tips.length > 0) {
            const randomTip = tips[Math.floor(Math.random() * tips.length)];
            tipsElement.textContent = randomTip;
        }
    }
    
    // Event Listeners - Calculator Modal
    if (closeCalcBtn) {
        closeCalcBtn.addEventListener('click', function() {
            if (calculatorModal) {
                calculatorModal.classList.add("hidden");
                currentItem = null;
            }
        });
    }
    
    if (calculatorModal) {
        calculatorModal.addEventListener('click', function(e) {
            if (e.target === calculatorModal) {
                calculatorModal.classList.add("hidden");
                currentItem = null;
            }
        });
    }
    
    // Event Listeners - Money Guide Modal
    if (moneyGuideBtn) {
        moneyGuideBtn.addEventListener('click', function() {
            if (moneyModal) {
                fillMoneyGuide();
                moneyModal.classList.remove("hidden");
            }
        });
    }
    
    if (closeMoneyBtn) {
        closeMoneyBtn.addEventListener('click', function() {
            if (moneyModal) moneyModal.classList.add("hidden");
        });
    }
    
    if (moneyModal) {
        moneyModal.addEventListener('click', function(e) {
            if (e.target === moneyModal) {
                moneyModal.classList.add("hidden");
            }
        });
    }
    
    // Event Listeners - Suche & Filter
    if (searchInput) {
        searchInput.addEventListener("input", renderItems);
    }
    
    if (categorySelect) {
        categorySelect.addEventListener("change", renderItems);
    }
    
    if (sortSelect) {
        sortSelect.addEventListener("change", renderItems);
    }
    
    // Feedback Button & Modal
    const feedbackBtn = document.getElementById('feedbackBtn');
    const feedbackModal = document.getElementById('feedbackModal');
    const closeFeedbackBtn = document.getElementById('closeFeedbackBtn');
    const feedbackForm = document.getElementById('feedbackForm');
    
    if (feedbackBtn) {
        feedbackBtn.addEventListener('click', function() {
            if (feedbackModal) feedbackModal.classList.remove('hidden');
        });
    }
    
    if (closeFeedbackBtn) {
        closeFeedbackBtn.addEventListener('click', function() {
            if (feedbackModal) feedbackModal.classList.add('hidden');
        });
    }
    
    if (feedbackModal) {
        feedbackModal.addEventListener('click', function(e) {
            if (e.target === feedbackModal) {
                feedbackModal.classList.add('hidden');
            }
        });
    }
    
    // Feedback Form Submit
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const webhookURL = config.discordWebhook;
            
            if (!webhookURL) {
                alert('⚠️ Discord Webhook URL fehlt in der Konfiguration!');
                return;
            }
            
            const name = document.getElementById('feedbackName').value || 'Anonym';
            const type = document.getElementById('feedbackType').value;
            const message = document.getElementById('feedbackMessage').value;
            
            const typeEmojis = {
                'bug': '🐛 Bug Report',
                'feature': '💡 Feature Vorschlag',
                'praise': '❤️ Lob',
                'other': '💬 Sonstiges'
            };
            
            const embed = {
                embeds: [{
                    title: typeEmojis[type],
                    description: message,
                    color: 8660162,
                    fields: [
                        {
                            name: 'Von',
                            value: name,
                            inline: true
                        },
                        {
                            name: 'Zeitpunkt',
                            value: new Date().toLocaleString('de-DE'),
                            inline: true
                        }
                    ],
                    footer: {
                        text: 'HugoSMP Feedback System'
                    }
                }]
            };
            
            try {
                const submitBtn = this.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Wird gesendet...';
                submitBtn.disabled = true;
                
                const response = await fetch(webhookURL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(embed)
                });
                
                if (response.ok) {
                    alert('✅ Feedback erfolgreich gesendet! Danke für dein Feedback!');
                    feedbackForm.reset();
                    if (feedbackModal) feedbackModal.classList.add('hidden');
                    console.log('✅ Feedback gesendet');
                } else {
                    throw new Error('Fehler beim Senden');
                }
                
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                
            } catch (error) {
                console.error('❌ Fehler beim Senden:', error);
                alert('❌ Fehler beim Senden. Bitte versuche es später erneut.');
                
                const submitBtn = this.querySelector('button[type="submit"]');
                submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Feedback absenden';
                submitBtn.disabled = false;
            }
        });
    }
    
    // Escape-Taste zum Schließen von Modals
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (calculatorModal && !calculatorModal.classList.contains('hidden')) {
                calculatorModal.classList.add('hidden');
                currentItem = null;
            }
            if (moneyModal && !moneyModal.classList.contains('hidden')) {
                moneyModal.classList.add('hidden');
            }
            if (feedbackModal && !feedbackModal.classList.contains('hidden')) {
                feedbackModal.classList.add('hidden');
            }
        }
    });
    
    // Initial Render
    applyConfig();
    renderItems();
    showRandomTip();
    
    // Tipp wechseln
    const interval = config.tipChangeInterval || 10000;
    setInterval(showRandomTip, interval);
    
    console.log('✅ Script erfolgreich initialisiert!');
    console.log('📊 Statistiken:', {
        items: items.length,
        tips: tips.length,
        moneyMethods: moneyMethods.length,
        tipInterval: interval + 'ms'
    });
});