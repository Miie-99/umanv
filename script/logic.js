// ==========================================
// MODULE: LOGIC (js/logic.js)
// ==========================================
const Logic = {
    
    // 抽卡与初始化
    drawCards(count) {
        const pool = [...DATA.traits];
        const drawn = [];
        for(let i=0; i<count; i++) {
            if(pool.length === 0) break;
            const idx = Math.floor(Math.random() * pool.length);
            drawn.push(pool[idx]);
            pool.splice(idx, 1);
        }
        return drawn;
    },

    startGame() {
        // 应用支援卡
        State.deck.forEach(card => {
            if (card.effect) State.applyEffect(card.effect);
        });
        State.stats.stamina = State.stats.maxStamina;
        this.refreshTurnState(); // 初始彩圈
    },

    // 核心行动处理
    processAction(type) {
        // 0. 连续事件处理中...
        if (State.flags.chainEvent) {
            // 如果有未完成的链，通常由UI模态接管，不应进入这里，除非是强行点按钮
            return;
        }

        // 1. 基础消耗
        const costs = {
            rest: { stamina: 0 },
            work: { stamina: -20, passion: -5 },
            create: { stamina: -25, passion: 5 },
            consume: { stamina: -5, passion: 10, money: -100 },
            social: { stamina: -15, passion: -5 }
        };
        
        let cost = costs[type];

        // 2. 检查体力
        if (type !== 'rest' && State.stats.stamina < Math.abs(cost.stamina)) {
            UI.showModal({ title: "体力透支", text: "你太累了，甚至拿不起笔。强制休息一天。", effect: {} });
            this.doRest(true);
            return;
        }

        // 3. 扣除生活费 (生存压力)
        State.stats.money -= State.livingCost;
        if (State.stats.money < 0) {
            State.stats.san -= 10; // 没钱焦虑
            UI.log("没钱交房租了，焦虑感让San值下降...", "red");
        }

        // 4. 执行消耗与回合
        State.applyEffect(cost);
        State.turn++;

        // 5. 执行动作
        if (type === 'rest') {
            this.doRest(false);
        } else {
            this.triggerEvent(type);
        }

        // 6. 检查目标与刷新
        this.checkTarget();
        this.refreshTurnState();
        
        UI.render();
    },

    doRest(forced) {
        let baseRec = 50;
        let sanRec = 10;
        let msg = "睡了个好觉。";
        
        if (!forced) {
            let r = Math.random();
            if (r > 0.85) { baseRec = 80; sanRec = 20; State.stats.passion += 10; msg = "绝佳的睡眠！梦到了CP结婚！(心情上升)"; }
            else if (r < 0.1) { baseRec = 30; sanRec = 5; State.stats.passion -= 10; msg = "失眠了，满脑子都是对家的洗脑包。"; }
        }

        State.applyEffect({ stamina: baseRec, san: sanRec });
        if (!forced) UI.showModal({ title: "休息", text: msg, effect: { stamina: baseRec, san: sanRec } });
    },

    triggerEvent(type) {
        // A. 尝试触发连续事件 (Chain) - 5% 概率
        if (Math.random() < 0.05) {
            const chainKeys = Object.keys(DATA.chains);
            const key = chainKeys[Math.floor(Math.random() * chainKeys.length)];
            this.startChain(key);
            return;
        }

        // B. 常规事件
        const pool = DATA.events[type];
        const evt = pool[Math.floor(Math.random() * pool.length)];
        let finalEffect = {...evt.effect};
        let finalText = evt.text;

        // 彩圈特效处理 (该按钮正好是彩圈)
        if (State.flags.rainbowTarget === type) {
            finalText += "\n⚡ [绝好调] 灵感迸发，收益翻倍！";
            for (let k in finalEffect) {
                if (finalEffect[k] > 0 && k !== 'works') finalEffect[k] *= 2;
            }
            // 产粮彩圈额外增加进度
            if (type === 'create') finalEffect.works = (finalEffect.works || 0) + 0.5;
        } 
        // 普通产粮进度
        else if (type === 'create') {
            if (!finalEffect.works) finalEffect.works = 0.3;
        }

        State.applyEffect(finalEffect);
        State.recordHistory(`${evt.title}: ${finalText.substring(0, 15)}...`);
        UI.showModal({ title: evt.title, text: finalText, effect: finalEffect });
    },

    // 连续事件逻辑
    startChain(key) {
        const chain = DATA.chains[key];
        if (!chain) return;
        
        State.flags.chainEvent = { id: key, step: null }; // 标记当前正在链中
        
        // 构造选项UI
        let buttons = [];
        chain.options.forEach(opt => {
            buttons.push({ 
                text: opt.text, 
                action: () => this.advanceChain(key, opt.next) 
            });
        });

        UI.showModal({ 
            title: `❗ ${chain.title}`, 
            text: chain.startText, 
            effect: {}, 
            customButtons: buttons 
        });
    },

    advanceChain(chainId, stepKey) {
        const step = DATA.chains[chainId].steps[stepKey];
        if (!step) return;

        // 消耗时间
        if (step.duration) {
            State.turn += step.duration;
            State.stats.stamina -= (10 * step.duration);
        }
        
        if (step.effect) State.applyEffect(step.effect);

        // 结束或继续
        if (step.isEnd) {
            State.flags.chainEvent = null; // 结束链
            UI.showModal({ title: "事件结束", text: step.text, effect: step.effect });
        } else {
            UI.showModal({ 
                title: "事件进行中...", 
                text: step.text, 
                effect: step.effect,
                customButtons: [{ text: "继续", action: () => this.advanceChain(chainId, step.next) }]
            });
        }
    },

    checkTarget() {
        const target = DATA.targets[State.phase];
        if (!target) return;

        if (State.turn >= target.turn) {
            let success = true;
            let failReasons = [];
            for (let k in target.req) {
                if (State.stats[k] < target.req[k]) {
                    success = false;
                    failReasons.push(k);
                }
            }

            if (success) {
                UI.showModal({ 
                    title: `🎉 目标达成: ${target.name}`, 
                    text: "截稿日大捷！你的作品反响热烈，在这个圈子站稳了脚跟。", 
                    effect: { san: 20, passion: 20, myHeat: 50, money: 500 }
                });
                State.recordHistory(`目标达成: ${target.name}`);
            } else {
                UI.showModal({ 
                    title: `💀 目标失败: ${target.name}`, 
                    text: `准备不足，结果惨淡... (${failReasons.join(', ')}不足)`, 
                    effect: target.penalty
                });
                State.recordHistory(`目标失败: ${target.name}`);
            }
            State.phase++;
            if (State.phase >= DATA.targets.length) this.endGame();
        }
    },

    refreshTurnState() {
        // 彩圈逻辑：所有按钮都有几率，create概率略高
        State.flags.rainbowTarget = null;
        if (State.stats.passion >= 80 && Math.random() < 0.3) {
            const types = ['work', 'create', 'consume', 'social'];
            // 40% 给 create, 其他平分
            const r = Math.random();
            if (r < 0.4) State.flags.rainbowTarget = 'create';
            else State.flags.rainbowTarget = types[Math.floor(Math.random() * types.length)];
        }
    },

    endGame() {
        // 简单评级
        const score = State.stats.myHeat + State.stats.love + State.stats.money/10;
        const win = score > 1000;
        UI.showEndScreen(win);
    }
};