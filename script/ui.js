// ==========================================
// MODULE: UI (js/ui.js)
// ==========================================
const UI = {
    
    // 老虎机动画
    spinSlot(el, items, finalItem) {
        let i = 0;
        el.classList.add('scrolling');
        const interval = setInterval(() => {
            el.innerText = items[Math.floor(Math.random() * items.length)].txt;
            i++;
            if (i > 10) {
                clearInterval(interval);
                el.classList.remove('scrolling');
                el.innerText = finalItem.txt;
                el.classList.add('animate-bounce');
                setTimeout(() => el.classList.remove('animate-bounce'), 500);
            }
        }, 100);
    },

    // 卡片渲染
    renderCardSelection(cards) {
        const poolEl = document.getElementById('card-pool');
        poolEl.innerHTML = '';
        cards.forEach(card => {
            const el = document.createElement('div');
            el.className = `support-card p-2 flex flex-col h-24 justify-between relative`;
            el.innerHTML = `
                <div>
                    <div class="text-[10px] font-bold text-blue-600 bg-blue-50 inline-block px-1 rounded">${card.type}</div>
                    <div class="font-bold text-sm leading-tight">${card.name}</div>
                </div>
                <div class="text-[10px] text-gray-400 border-t border-gray-100 pt-1">
                    ${this.formatEffectShort(card.effect)}
                </div>
            `;
            el.onclick = () => Game.toggleCard(card, el);
            poolEl.appendChild(el);
        });
    },

    formatEffectShort(eff) {
        if (!eff) return "";
        return Object.keys(eff).map(k => `${k}${eff[k]>0?'+':''}${eff[k]}`).join(' ');
    },

    render() {
        // 顶部状态
        document.getElementById('val-stamina').innerText = Math.floor(State.stats.stamina);
        document.getElementById('bar-stamina').style.width = `${(State.stats.stamina / State.stats.maxStamina) * 100}%`;
        
        // 渲染热度
        document.getElementById('val-cpheat').innerText = Math.floor(State.stats.cpHeat);
        document.getElementById('val-myheat').innerText = Math.floor(State.stats.myHeat);
        
        // 渲染面板
        document.getElementById('val-san').innerText = Math.floor(State.stats.san);
        document.getElementById('val-tech').innerText = Math.floor(State.stats.tech);
        document.getElementById('val-money').innerText = Math.floor(State.stats.money);
        document.getElementById('val-works').innerText = State.stats.works.toFixed(1);

        // 日期
        const weekStr = ["第一周", "第二周", "第三周", "第四周"][(State.turn - 1) % 4] || "末";
        document.getElementById('game-turn-txt').innerText = `第${Math.ceil(State.turn/4)}月 ${weekStr}`;

        // 目标
        const target = DATA.targets[State.phase];
        if (target) {
            document.getElementById('target-name').innerText = target.name;
            document.getElementById('target-turns').innerText = target.turn - State.turn;
        } else {
            document.getElementById('target-name').innerText = "最终结算";
        }

        // 按钮彩圈状态
        document.querySelectorAll('.uma-btn-circle').forEach(b => b.classList.remove('rainbow-glow'));
        if (State.flags.rainbowTarget) {
            const btn = document.querySelector(`#btn-${State.flags.rainbowTarget} .uma-btn-circle`);
            if (btn) btn.classList.add('rainbow-glow');
        }
    },

    log(msg, color="gray") {
        const logEl = document.getElementById('game-log');
        const d = document.createElement('div');
        d.className = `text-xs text-${color}-600 border-l-2 border-${color}-200 pl-2`;
        d.innerText = `W${State.turn}: ${msg}`;
        logEl.insertBefore(d, logEl.firstChild);
    },

    // 通用模态框 (支持自定义按钮)
    showModal({ title, text, effect, customButtons }) {
        const overlay = document.getElementById('modal-overlay');
        document.getElementById('evt-title').innerText = title;
        document.getElementById('evt-text').innerText = text;
        
        // 效果渲染
        let html = "";
        for (let k in effect) {
            let val = effect[k];
            let color = val > 0 ? "text-green-600" : "text-red-600";
            html += `<div class="flex justify-between"><span>${k}</span><span class="${color}">${val>0?'+':''}${val}</span></div>`;
        }
        document.getElementById('evt-effects').innerHTML = html || "无属性变动";
        
        // 按钮逻辑
        const actionArea = document.getElementById('evt-actions');
        const defaultBtn = document.getElementById('btn-evt-close');
        
        actionArea.innerHTML = '';
        if (customButtons && customButtons.length > 0) {
            defaultBtn.classList.add('hidden');
            customButtons.forEach(btn => {
                const b = document.createElement('button');
                b.className = "w-full bg-blue-600 text-white font-bold py-2 rounded-lg mb-2";
                b.innerText = btn.text;
                b.onclick = () => { btn.action(); }; // 不要立即关闭，让action决定
                actionArea.appendChild(b);
            });
        } else {
            defaultBtn.classList.remove('hidden');
        }
        
        overlay.classList.remove('hidden');
    },

    closeModal() {
        document.getElementById('modal-overlay').classList.add('hidden');
    },

    showEndScreen(win) {
        document.querySelectorAll('.screen').forEach(e => e.classList.remove('active'));
        document.getElementById('screen-end').classList.add('active');
        
        document.getElementById('end-rank').innerText = win ? "S+" : "B";
        document.getElementById('end-title').innerText = win ? "同人圈的传说" : "默默无闻的过客";
        
        document.getElementById('end-heat').innerText = Math.floor(State.stats.myHeat);
        document.getElementById('end-works').innerText = Math.floor(State.stats.works);
        document.getElementById('end-money').innerText = Math.floor(State.stats.money);
        document.getElementById('end-love').innerText = Math.floor(State.stats.love);
    },

    showHistory() {
        const list = document.getElementById('history-list');
        list.innerHTML = State.history.map(h => 
            `<div class="text-xs text-gray-300 border-b border-gray-700 pb-1">
                <span class="text-yellow-500 font-bold mr-2">W${h.turn}</span>${h.text}
            </div>`
        ).join('');
        document.getElementById('modal-history').classList.remove('hidden');
    },

    showStatus() {
        document.getElementById('modal-status').classList.remove('hidden');
        this.drawRadar();
    },
    
    closeStatus() {
        document.getElementById('modal-status').classList.add('hidden');
    },

    drawRadar() {
        const svg = document.getElementById('status-radar');
        const stats = [State.alignment.purity, State.alignment.toxic, State.alignment.omnivory, State.alignment.mmr];
        const labels = ["洁癖", "毒唯", "杂食", "乐子"];
        const cx = 120, cy = 120, r = 80; // 修正中心点和半径
        
        let points = "";
        let txt = "";
        
        for(let i=0; i<4; i++) {
            const angle = (Math.PI * 2 * i) / 4 - Math.PI/2;
            const val = Math.max(0.2, stats[i] / 100);
            const x = cx + r * val * Math.cos(angle);
            const y = cy + r * val * Math.sin(angle);
            points += `${x},${y} `;
            
            const lx = cx + (r+20) * Math.cos(angle);
            const ly = cy + (r+20) * Math.sin(angle);
            txt += `<text x="${lx}" y="${ly}" fill="#666" font-size="12" text-anchor="middle" dominant-baseline="middle">${labels[i]}</text>`;
        }
        
        svg.innerHTML = `
            <circle cx="${cx}" cy="${cy}" r="${r}" fill="#f3f4f6" stroke="#ddd"/>
            <polygon points="${points}" fill="rgba(59, 130, 246, 0.5)" stroke="#3b82f6" stroke-width="2"/>
            ${txt}
        `;
    }
};