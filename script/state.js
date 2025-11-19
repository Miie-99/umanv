// ==========================================
// MODULE: STATE (js/state.js)
// ==========================================
const State = {
    turn: 1,
    maxTurn: 48,
    phase: 0, // 当前目标阶段
    
    cp: "AB",
    rival: "BA",
    
    // 核心属性
    stats: {
        stamina: 100, maxStamina: 100,
        passion: 50, // 干劲
        san: 100,
        money: 2000, // 初始金钱由老虎机覆盖
        tech: 10,
        social: 20,
        love: 50,
        myHeat: 0,    // 个人热度
        cpHeat: 50,   // CP圈子热度
        works: 0
    },

    // 倾向雷达
    alignment: { purity: 50, toxic: 50, omnivory: 50, mmr: 50 },

    // 系统标记
    deck: [], 
    history: [], // 历史记录
    flags: {
        rainbowTarget: null, // 哪个按钮有彩圈
        chainEvent: null     // 当前连续事件
    },
    
    livingCost: 50, // 每回合生活费

    init() {
        this.turn = 1;
        this.phase = 0;
        this.history = [];
        // Reset stats to default before applying traits
        this.stats = { stamina: 100, maxStamina: 100, passion: 50, san: 100, money: 2000, tech: 10, social: 20, love: 50, myHeat: 0, cpHeat: 50, works: 0 };
        this.alignment = { purity: 50, toxic: 50, omnivory: 50, mmr: 50 };
        this.flags = { rainbowTarget: null, chainEvent: null };
    },

    applyEffect(effect) {
        let mod = 1.0;
        if (this.stats.passion >= 80) mod = 1.2;
        if (this.stats.passion <= 20) mod = 0.8;

        for (let key in effect) {
            let val = effect[key];
            // 属性修正 (钱、技术、热度、社交)
            if (['money', 'tech', 'myHeat', 'social', 'cpHeat'].includes(key) && val > 0) {
                val = Math.floor(val * mod);
            }
            
            if (this.stats.hasOwnProperty(key)) {
                this.stats[key] += val;
                // 钳制
                if (key === 'stamina') this.stats[key] = Math.min(this.stats.maxStamina, Math.max(0, this.stats[key]));
                if (key === 'san') this.stats[key] = Math.min(100, Math.max(0, this.stats[key]));
                if (key === 'passion') this.stats[key] = Math.min(100, Math.max(0, this.stats[key]));
            } 
            else if (this.alignment.hasOwnProperty(key)) {
                this.alignment[key] += val;
                this.alignment[key] = Math.min(100, Math.max(0, this.alignment[key]));
            }
        }
    },

    recordHistory(text, turn) {
        this.history.push({ turn: turn || this.turn, text: text });
    }
};