// ==========================================
// MODULE: MAIN (js/main.js)
// ==========================================
const Game = {
    tempCards: [],
    selectedCards: [],
    identity: null,

    init() {
        lucide.createIcons();
        State.init();
    },

    // Step 1: 摇身份
    spinIdentity() {
        const p = DATA.slots.prefixes[Math.floor(Math.random() * DATA.slots.prefixes.length)];
        const r = DATA.slots.roles[Math.floor(Math.random() * DATA.slots.roles.length)];
        
        UI.spinSlot(document.getElementById('slot-prefix'), DATA.slots.prefixes, p);
        setTimeout(() => UI.spinSlot(document.getElementById('slot-role'), DATA.slots.roles, r), 200);

        setTimeout(() => {
            this.identity = { p, r };
            const desc = document.getElementById('identity-desc');
            desc.innerHTML = `<strong>${p.txt}${r.txt}</strong><br>初始金钱: ${r.base.money} | 特性: ${p.desc}`;
            desc.classList.remove('hidden');
            
            // 激活下一步
            document.getElementById('btn-spin').disabled = true;
            document.getElementById('btn-spin').classList.add('opacity-50');
            
            document.getElementById('setup-step-2').classList.remove('opacity-50', 'pointer-events-none');
            document.getElementById('setup-step-3').classList.remove('opacity-50', 'pointer-events-none');
            
            this.rerollCards(); // 加载卡片
        }, 1500);
    },

    rerollCards() {
        this.selectedCards = [];
        this.updateSelectionUI();
        this.tempCards = Logic.drawCards(6);
        UI.renderCardSelection(this.tempCards);
    },

    toggleCard(card, el) {
        const idx = this.selectedCards.indexOf(card);
        if (idx > -1) {
            this.selectedCards.splice(idx, 1);
            el.classList.remove('selected');
        } else {
            if (this.selectedCards.length >= 3) return;
            this.selectedCards.push(card);
            el.classList.add('selected');
        }
        this.updateSelectionUI();
    },

    updateSelectionUI() {
        const count = this.selectedCards.length;
        document.getElementById('card-count').innerText = `${count}/3`;
        const btn = document.getElementById('btn-start');
        if (count === 3 && this.identity) {
            btn.disabled = false;
            btn.classList.remove('bg-gray-300');
            btn.classList.add('bg-blue-600');
        } else {
            btn.disabled = true;
            btn.classList.add('bg-gray-300');
            btn.classList.remove('bg-blue-600');
        }
    },

    startGame() {
        // 应用身份数据
        State.stats.money = this.identity.r.base.money;
        State.applyEffect(this.identity.p.buff);
        
        State.cp = document.getElementById('inp-cp').value || "AB";
        State.rival = document.getElementById('inp-rival').value || "BA";
        State.deck = [...this.selectedCards];
        
        Logic.startGame();
        
        document.getElementById('screen-setup').classList.remove('active');
        document.getElementById('screen-game').classList.add('active');
        
        UI.render();
        UI.log(`入坑成功！CP: ${State.cp}`);
    },

    action(type) {
        Logic.processAction(type);
    }
};

window.Game = Game;
window.UI = UI;
window.Logic = Logic;
window.State = State;
window.DATA = DATA;

document.addEventListener('DOMContentLoaded', () => Game.init());