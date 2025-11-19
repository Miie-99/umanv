// ==========================================
// MODULE: DATA (js/data.js)
// ==========================================

// 1. 老虎机数据 (Prefixes + Roles)
const SLOTS = {
    prefixes: [
        { txt: "下楼梯骨折的", buff: { social: -20 }, desc: "出门困难，强制宅家" },
        { txt: "家里有矿的", buff: { money: 5000 }, desc: "钞能力者，开局资金充足" },
        { txt: "玻璃心的", buff: { san: -20, passion: 20 }, desc: "容易破防，但爱得深沉" },
        { txt: "手速惊人的", buff: { tech: 20 }, desc: "产粮效率极高" },
        { txt: "住在X站的", buff: { passion: 30 }, desc: "阅片无数，审美极高" },
        { txt: "社恐严重的", buff: { passion: -20 }, desc: "社交场合容易紧张" },
        { txt: "负债累累的", buff: { money: -1000, passion: 30 }, desc: "为了还债必须拼命，干劲极高" },
        { txt: "海归的", buff: { tech: 10, social: 10 }, desc: "见过大世面" },
        { txt: "恋爱脑的", buff: { love: 40, san: -10 }, desc: "容易被男人/女人骗" },
        { txt: "暴躁的", buff: { combat: 30, social: -10 }, desc: "一言不合就挂人" }
    ],
    roles: [
        { txt: "社畜", base: { money: 3000 } },
        { txt: "学生", base: { money: 800 } },
        { txt: "家里蹲", base: { money: 200 } },
        { txt: "富二代", base: { money: 10000 } },
        { txt: "自由职业", base: { money: 1500 } },
        { txt: "无业游民", base: { money: 0 } }
    ]
};

// 2. 支援卡词条 (Traits)
const createTrait = (id, name, type, desc, effect) => ({ id, name, type, desc, effect });
const RAW_TRAITS = [
    ["富婆", "item", "自带启动资金", { money: 3000 }],
    ["美术生", "buff", "人体结构扎实", { tech: 30, san: -10 }],
    ["文手", "buff", "文笔细腻", { tech: 10, passion: 10 }],
    ["全能神", "buff", "又会写又会画", { tech: 40, stamina: -20 }],
    ["手速怪", "buff", "日更三千字", { tech: -10, works: 0.2 }], // 额外产出效率在logic处理
    ["洁癖", "style", "眼里揉不得沙子", { purity: 30, san: -10 }],
    ["杂食", "style", "什么都吃", { omnivory: 40, san: 20 }],
    ["毒唯", "risk", "战斗力极强", { toxic: 30, combat: 20 }],
    ["乐子人", "style", "看热闹不嫌事大", { mmr: 30, passion: -5 }],
    ["考据党", "style", "设定极其严谨", { tech: 20, social: -10 }],
    ["交际花", "buff", "谁都认识", { social: 40, san: -10 }],
    ["社恐", "buff", "只在小号发疯", { social: -30, tech: 10 }],
    ["玻璃心", "risk", "一条差评退网三天", { san: -40, passion: 10 }],
    ["大心脏", "buff", "被挂了也有热度", { san: 40, social: -10 }],
    ["冷圈人", "risk", "北极圈拓荒者", { passion: 50, myHeat: -20 }],
    ["烫门粉", "buff", "粮多但事多", { myHeat: 30, purity: -10 }],
    ["熬夜冠军", "buff", "凌晨四点灵感爆发", { stamina: -20, tech: 15 }],
    ["摸鱼大王", "style", "打死不改.psd", { works: -0.1, san: 10 }]
];

const generateTraitPool = () => {
    let pool = [];
    let id = 1;
    RAW_TRAITS.forEach(t => pool.push(createTrait(id++, t[0], t[1], t[2], t[3])));
    // 填充剩余卡池
    while (pool.length < 30) {
        pool.push(createTrait(id++, "路人同好", "buff", "普通的同人女", { passion: 5, san: 5 }));
    }
    return pool;
};

// 3. 连续事件 (Chain Events)
const CHAINS = {
    "ai_accuse": {
        title: "鉴AI风波",
        startText: "你刚发新图，评论区忽然涌入大量质疑声：有人断言这是AI合成，你感觉被盯上了。",
        options: [
            { text: "直播拿出原画反驳", next: "prove_it" },
            { text: "清者自清，不理会", next: "ignore_it" }
        ],
        steps: {
            prove_it: {
                duration: 1,
                text: "你开直播逐帧展示PSD图层与作画录屏，耐心解释每一处笔触与调整。",
                effect: { stamina: -30, san: -10 },
                next: "prove_success"
            },
            prove_success: {
                text: "真相大白，质疑声消散。你的技术被更多人认可，私信里开始涌入鼓励与问合作。",
                effect: { myHeat: 80, tech: 10, passion: 20, toxic: -10 },
                isEnd: true
            },
            ignore_it: {
                text: "选择沉默，但谣言在角落蔓延，部分粉丝开始疑虑并脱粉。",
                effect: { san: -20, myHeat: -20 },
                next: "ignore_bad"
            },
            ignore_bad: {
                text: "风波虽过，但评论区经常有人阴阳怪气。",
                effect: { passion: -15 },
                isEnd: true
            }
        }
    },
    "collab_project": {
        title: "合志企划",
        startText: "圈内大手发起了CP合志企划，正在招募画手和写手。这是一次成名的好机会。",
        options: [
            { text: "报名参加！", next: "join" },
            { text: "太麻烦了，算了", next: "skip" }
        ],
        steps: {
            skip: { text: "你放弃了这次机会，看着别人热闹。", effect: { san: 5 }, isEnd: true },
            join: {
                text: "你成功入选了！但是DDL（截稿日）非常紧。",
                effect: { social: 10, passion: 10 },
                next: "working"
            },
            working: {
                duration: 1,
                text: "赶稿地狱。你连续熬了两个通宵，咖啡当水喝。",
                effect: { stamina: -50, tech: 5, san: -10 },
                next: "publish"
            },
            publish: {
                text: "合志发售了！作为参展人员，你的名字被印在了Staff名单里，大受好评！",
                effect: { myHeat: 100, love: 20, money: 200 }, // 分成
                isEnd: true
            }
        }
    }
};

// 4. 核心数据导出
const DATA = {
    slots: SLOTS,
    traits: generateTraitPool(),
    chains: CHAINS,
    
    // 阶段目标 (Checkpoints)
    targets: [
        { id: 1, name: "产出第一份粮", turn: 8, req: { works: 1 }, desc: "不管写什么画什么，先搞出来！", penalty: { san: -20 } },
        { id: 2, name: "圈内立足", turn: 16, req: { myHeat: 100 }, desc: "让首页的人眼熟你。", penalty: { san: -30, passion: -20 } },
        { id: 3, name: "漫展无料交换", turn: 24, req: { money: 500, social: 40 }, desc: "准备足够的资金和社交能力去面基。", penalty: { social: -20 } },
        { id: 4, name: "圣战：新刊完售", turn: 32, req: { works: 5, tech: 80 }, desc: "在CP展上成为传说！", penalty: { san: -50 } },
        { id: 5, name: "封神", turn: 48, req: { myHeat: 500, love: 80 }, desc: "维持你的爱与热度直到最后。", penalty: { myHeat: -100 } }
    ],

    // 完整事件池 (整合了你提供的所有文本)
    events: {
        work: [
            { title: "加班地狱", text: "老板让你连夜改PPT，你错过了晚上的CP群语音。", effect: { money: 800, san: -10, passion: -5 } },
            { title: "掉马危机", text: "同事看到了你的屏保，问：'这是同性恋漫画吗？' 你吓出一身冷汗。", effect: { san: -15, social: -5 } },
            { title: "发奖金了", text: "项目结款！你立刻把钱换成了谷子（周边）。", effect: { money: 2000, love: 10 } },
            { title: "社死瞬间", text: "开会投屏忘关浏览器，全公司都看到了你写的《强制爱》大纲。", effect: { social: -20, san: -20, money: 200 } },
            { title: "虚伪的现充", text: "同事问你周末去哪，你说在家躺平，其实坐了5小时高铁去漫展。", effect: { money: -500, passion: 30, social: 5 } },
            { title: "加班发疯", text: "凌晨三点刷到对家太太还在产粮。感叹：不用上班的人才配搞同人。", effect: { san: -15, money: 600, passion: -5 } },
            { title: "带薪搞黄", text: "趁老板出差，在工位上偷偷写了两千字豪车，背德感让你文思泉涌。", effect: { money: 200, passion: 20, stamina: -5 } },
            { title: "快递社死", text: "前台帮你签收了快递并大喊：'谁的R18本子？'", effect: { social: -30, san: -30 } },
            { title: "为了谷子", text: "为了买那个溢价三倍的吧唧，你主动申请周末加班。", effect: { money: 600, san: -15, love: 5 } }
        ],
        create: [
            { title: "手感火热", text: "文思泉涌，下笔如有神，这篇绝对是神作！", effect: { tech: 15, myHeat: 20, works: 0.5 } },
            { title: "遭遇瓶颈", text: "卡文了，坐了三个小时只写了三百字。", effect: { san: -10, stamina: -20, works: 0.1 } },
            { title: "忘记保存", text: "软件崩溃了...你的心也碎了。", effect: { san: -30, passion: -10 } },
            { title: "被大V转了", text: "你的产出被圈内大手转发，通知栏炸了！", effect: { myHeat: 80, passion: 20, love: 5 } },
            { title: "冷圈自萌", text: "全网只有你在产粮。自己割大腿肉喂自己。", effect: { san: -10, passion: 30, myHeat: 5 } },
            { title: "战损美学", text: "画了一张战损图，伤口和血迹的质感让同好们发疯。", effect: { tech: 15, myHeat: 25, works: 1 } },
            { title: "清水也是肉", text: "全程没牵手，但眼神拉丝比R18还色。", effect: { tech: 20, myHeat: 15, works: 0.5 } },
            { title: "甚至过度", text: "画人体练习走偏变成了车图，犹豫再三打码发了小号。", effect: { passion: 20, san: -5, myHeat: 30 } },
            { title: "百合车文", text: "写了一篇隐晦的R18G，湿漉漉的氛围感让你自己脸红。", effect: { passion: 25, san: -5, works: 0.5 } },
            { title: "光影练习", text: "画了一张夕阳下的接吻剪影，朦胧的唯美感。", effect: { tech: 15, myHeat: 15, works: 1 } }
        ],
        consume: [
            { title: "神仙太太", text: "在AO3读到一篇绝世好文，哭得稀里哗啦。", effect: { love: 20, passion: 10, san: 10 } },
            { title: "OOC警告", text: "不仅逆了CP，还把你推写成了恋爱脑。想吐。", effect: { san: -20, passion: -5 } },
            { title: "官方发糖", text: "最新一集动画里他们牵手了！", effect: { love: 15, san: 5, cpHeat: 10 } },
            { title: "海鲜市场", text: "高价收的谷子快递暴力运输折角了，心碎。", effect: { money: -300, san: -20, love: 5 } },
            { title: "对家骑脸", text: "对家大手发了张神图，虽然不想承认但真的好看。", effect: { san: -10, tech: 5, passion: -5 } },
            { title: "塌房预警", text: "你的坑被爆出丑闻。是出二手止损还是装死？", effect: { san: -50, money: 0, cpHeat: -50 } },
            { title: "绝美切页", text: "收到了绝版杂志切页，他们在画面边缘也在对视！", effect: { love: 25, money: -100, san: 10 } },
            { title: "视觉污染", text: "首页误刷到对家神图，生理性厌恶。", effect: { san: -25, passion: -10 } },
            { title: "官方背刺", text: "新剧情里你推和对家互动比和你CP还多！天塌了。", effect: { san: -50, love: -20, cpHeat: 20 } },
            { title: "指尖温存", text: "这篇清水文写得太好了，吹头发的情节让你脸红心跳。", effect: { love: 15, passion: 20, san: 5 } }
        ],
        social: [
            { title: "由于太现充", text: "群里在聊CP，你在聊今晚吃什么，被冷落了。", effect: { social: 10, myHeat: -5 } },
            { title: "小团体撕逼", text: "群主和管理吵起来了，你被要求站队。", effect: { san: -20, social: -10 } },
            { title: "扩列成功", text: "勾搭到了一个同城同好，相谈甚欢。", effect: { social: 15, passion: 10 } },
            { title: "挂人贴", text: "你在广场吐槽了一句，被对家截图挂了。", effect: { myHeat: 30, san: -30, toxic: 20 } },
            { title: "无效扩列", text: "加了互暖群，结果群主半夜发虐文说是糖。", effect: { san: -15, social: 5 } },
            { title: "赛博背刺", text: "亲友退群了，私聊发现她们拉了新群吐槽你文风土。", effect: { san: -50, myHeat: 10, toxic: 30 } },
            { title: "漫展无料", text: "准备了50份无料，被粉丝喊‘妈咪’心里暖暖的。", effect: { social: 20, passion: 15, money: -100 } },
            { title: "连麦修罗场", text: "深夜语音，两个麦霸争论谁是上面的，你被迫当裁判。", effect: { social: 10, san: -15 } },
            { title: "约稿翻车", text: "大价钱约的图人体崩坏，还不如自己画的草稿。", effect: { money: -500, san: -20 } },
            { title: "一眼顶针", text: "识破了群里的对家视奸号并挂了出来。", effect: { social: 15, combat: 20, san: 5 } }
        ]
    }
};