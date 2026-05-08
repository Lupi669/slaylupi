const app = document.querySelector("#app");
const fallbackHero = "./assets/hero.jpeg";
const spriteSources = {
  normal: "./assets/characters/hero-normal.png",
  worn: "./assets/characters/hero-worn.png",
  danger: "./assets/characters/hero-danger.png",
  defeat: "./assets/characters/hero-defeat.png",
  victory: "./assets/characters/hero-victory.png",
};
const sprites = { ...spriteSources };

const oldCards = {
  strike: { name: "リボンストライク", cost: 1, type: "攻撃", text: "7ダメージ", play: s => damageEnemy(s, 7) },
  guard: { name: "フリルガード", cost: 1, type: "防御", text: "6ブロック", play: s => gainBlock(s, 6) },
  tea: { name: "ひとくち紅茶", cost: 1, type: "回復", text: "HPを4回復", play: s => healHero(s, 4) },
  heavy: { name: "お掃除スマッシュ", cost: 2, type: "攻撃", text: "14ダメージ", play: s => damageEnemy(s, 14) },
  brace: { name: "勇気を出す", cost: 1, type: "防御", text: "4ブロック。次の攻撃+3", play: s => { gainBlock(s, 4); s.hero.strength += 3; log(s, "ルピっこは勇気をふりしぼった。"); } },
  sparkle: { name: "きらめく一撃", cost: 0, type: "攻撃", text: "4ダメージ", play: s => damageEnemy(s, 4) },
  mend: { name: "応急手当", cost: 2, type: "回復", text: "HPを8回復", play: s => healHero(s, 8) },
  shieldWall: { name: "レースの壁", cost: 2, type: "防御", text: "12ブロック", play: s => gainBlock(s, 12) },
};

const cards = {
  strike: { name: "リボンストライク", cost: 1, type: "攻撃", text: "7ダメージ", play: s => damageEnemy(s, 7) },
  guard: { name: "フリルガード", cost: 1, type: "防御", text: "6ブロック", play: s => gainBlock(s, 6) },
  tea: { name: "ひとくち紅茶", cost: 1, type: "回復", text: "HPを4回復", play: s => healHero(s, 4) },
  heavy: { name: "お掃除スマッシュ", cost: 2, type: "攻撃", text: "14ダメージ", play: s => damageEnemy(s, 14) },
  brace: { name: "勇気を出す", cost: 1, type: "防御", text: "4ブロック。戦闘中、攻撃+3", play: s => { gainBlock(s, 4); s.hero.strength += 3; log(s, "攻撃力が3上がった。"); } },
  sparkle: { name: "きらめく一撃", cost: 0, type: "攻撃", text: "4ダメージ", play: s => damageEnemy(s, 4) },
  mend: { name: "応急手当", cost: 2, type: "回復", text: "HPを8回復", play: s => healHero(s, 8) },
  shieldWall: { name: "レースの壁", cost: 2, type: "防御", text: "12ブロック", play: s => gainBlock(s, 12) },
  allIn: { name: "全力スマッシュ", cost: 3, type: "攻撃", text: "28ダメージ。このターンはブロックを得られない", play: s => { s.hero.block = 0; s.hero.noBlock = true; damageEnemy(s, 28); log(s, "守りを捨てて全力で踏み込んだ。"); } },
  poisonNeedle: { name: "毒針リボン", cost: 1, type: "搦め手", text: "毒5を与える。敵ターン開始時に毒ダメージ", play: s => addPoison(s, 5) },
  venomTea: { name: "しびれ紅茶", cost: 2, type: "搦め手", text: "毒8を与える", play: s => addPoison(s, 8) },
  desperatePace: { name: "無理をする", cost: 0, type: "技", text: "HPを5失い、エナジー+2", play: s => { loseHeroHp(s, 5); s.hero.energy += 2; addEffect("hero", "heal", "+2E"); log(s, "無理をしてエナジーを2得た。"); } },
  battleRhythm: { name: "戦いのリズム", cost: 2, type: "強化", text: "この戦闘中、カードのダメージ+2", play: s => { s.hero.powerDamage += 2; addEffect("hero", "heal", "+2"); log(s, "カードのダメージが2上がった。"); } },
  twinRibbon: { name: "双子リボン", cost: 1, type: "攻撃", text: "5ダメージを2回", play: s => { damageEnemy(s, 5); if (s.enemy.hp > 0) damageEnemy(s, 5); } },
  focusGuard: { name: "集中ガード", cost: 1, type: "防御", text: "9ブロック。弱体ならさらに+3", play: s => gainBlock(s, 9 + (s.hero.weak > 0 ? 3 : 0)) },
};

const rewardPool = [
  "heavy", "brace", "sparkle", "mend", "shieldWall",
  "allIn", "poisonNeedle", "venomTea", "desperatePace",
  "battleRhythm", "twinRibbon", "focusGuard",
];

const route = [
  { kind: "battle", enemy: "dust" },
  { kind: "reward" },
  { kind: "battle", enemy: "slime" },
  { kind: "event" },
  { kind: "battle", enemy: "bat" },
  { kind: "elite", enemy: "knight" },
  { kind: "rest" },
  { kind: "battle", enemy: "doll" },
  { kind: "battle", enemy: "mirror" },
  { kind: "boss", enemy: "boss" },
];

const enemies = {
  dust: { name: "ほこりの精", hp: 30, actions: [{ type: "attack", value: 6 }, { type: "block", value: 5 }] },
  slime: { name: "ぷにスライム", hp: 38, actions: [{ type: "attack", value: 7 }, { type: "attack", value: 9 }, { type: "block", value: 6 }] },
  bat: { name: "夜更かしコウモリ", hp: 34, actions: [{ type: "attack", value: 5 }, { type: "attack", value: 5 }, { type: "block", value: 8 }] },
  knight: { name: "ブリキの中ボス", hp: 58, actions: [{ type: "attack", value: 11 }, { type: "block", value: 10 }, { type: "attack", value: 14 }] },
  doll: { name: "迷子の人形", hp: 44, actions: [{ type: "attack", value: 8 }, { type: "attack", value: 10 }, { type: "block", value: 8 }] },
  mirror: { name: "くもり鏡", hp: 48, actions: [{ type: "block", value: 12 }, { type: "attack", value: 12 }, { type: "attack", value: 8 }] },
  boss: { name: "黒薔薇の魔女", hp: 92, actions: [{ type: "attack", value: 13 }, { type: "block", value: 14 }, { type: "attack", value: 17 }, { type: "attack", value: 10 }] },
};

const enemyBook = {
  dust: {
    name: "ほこりリボン",
    hp: 34,
    image: "./assets/enemies/dust.png",
    actions: [
      { type: "attack", value: 7 },
      { type: "debuff", value: 1, status: "weak" },
      { type: "block", value: 8 },
    ],
  },
  slime: {
    name: "ティーカップスライム",
    hp: 44,
    image: "./assets/enemies/slime.png",
    actions: [
      { type: "attack", value: 8 },
      { type: "heal", value: 7 },
      { type: "attack", value: 11 },
      { type: "block", value: 9 },
    ],
  },
  bat: {
    name: "星夜こうもり",
    hp: 40,
    image: "./assets/enemies/bat.png",
    actions: [
      { type: "multi", value: 4, hits: 2 },
      { type: "debuff", value: 1, status: "frail" },
      { type: "multi", value: 5, hits: 2 },
    ],
  },
  knight: {
    name: "ブリキの騎士",
    hp: 70,
    image: "./assets/enemies/knight.png",
    actions: [
      { type: "block", value: 14 },
      { type: "attack", value: 15 },
      { type: "charge", value: 20 },
    ],
  },
  doll: {
    name: "ねじまき人形",
    hp: 54,
    image: "./assets/enemies/doll.png",
    actions: [
      { type: "debuff", value: 2, status: "weak" },
      { type: "attack", value: 12 },
      { type: "block", value: 12 },
    ],
  },
  mirror: {
    name: "きらめき鏡",
    hp: 58,
    image: "./assets/enemies/mirror.png",
    actions: [
      { type: "block", value: 16 },
      { type: "debuff", value: 1, status: "weak" },
      { type: "attack", value: 14 },
      { type: "heal", value: 8 },
    ],
  },
  boss: {
    name: "黒薔薇の魔女",
    hp: 112,
    image: "./assets/enemies/boss.png",
    actions: [
      { type: "block", value: 18 },
      { type: "multi", value: 6, hits: 3 },
      { type: "debuff", value: 2, status: "frail" },
      { type: "charge", value: 26 },
      { type: "heal", value: 10 },
    ],
  },
};

let state;

function newGame() {
  state = createInitialState();
  renderTitle();
}

function createInitialState() {
  return {
    screen: "title",
    node: 0,
    kills: 0,
    rewards: 0,
    hero: { maxHp: 72, hp: 72, block: 0, maxEnergy: 3, energy: 3, strength: 0, powerDamage: 0, weak: 0, frail: 0, noBlock: false },
    deck: ["strike", "strike", "strike", "strike", "guard", "guard", "guard", "tea"],
    draw: [],
    discard: [],
    hand: [],
    enemy: null,
    effects: [],
    turn: 0,
    messages: [],
  };
}

function startRun() {
  state = createInitialState();
  state.screen = "node";
  advance();
}

function prepareCharacterAssets() {
  ["normal", "worn", "danger"].forEach(key => {
    chromaKey(spriteSources[key])
      .then(url => {
        sprites[key] = url;
        renderCurrentScreen();
      })
      .catch(() => {
        sprites[key] = spriteSources[key] || fallbackHero;
      });
  });
}

function chromaKey(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = frame.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (g > 130 && g > r * 1.35 && g > b * 1.35) {
          const greenScore = Math.min(255, g - Math.max(r, b));
          data[i + 3] = greenScore > 90 ? 0 : Math.max(0, data[i + 3] - greenScore * 2);
          data[i] = Math.min(r, 180);
          data[i + 1] = Math.min(g, 180);
        }
      }
      ctx.putImageData(frame, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = src;
  });
}

function renderCurrentScreen() {
  if (!state) return;
  if (state.screen === "title") renderTitle();
  if (state.screen === "battle") renderBattle();
}

function advance() {
  const node = route[state.node];
  if (!node) return renderVictory();
  if (node.kind === "battle" || node.kind === "elite" || node.kind === "boss") return startBattle(node.enemy);
  if (node.kind === "reward") return renderReward();
  if (node.kind === "event") return renderEvent();
  if (node.kind === "rest") return renderRest();
}

function startBattle(enemyId) {
  const base = enemyBook[enemyId];
  state.enemy = { ...base, maxHp: base.hp, block: 0, poison: 0, actionIndex: 0 };
  state.effects = [];
  state.draw = shuffle([...state.deck]);
  state.discard = [];
  state.hand = [];
  state.turn = 0;
  state.messages = [`${base.name}が現れた。`];
  state.screen = "battle";
  startPlayerTurn();
}

function startPlayerTurn() {
  state.turn += 1;
  state.hero.block = 0;
  state.hero.energy = state.hero.maxEnergy;
  state.hero.noBlock = false;
  state.hero.weak = Math.max(0, state.hero.weak - 1);
  state.hero.frail = Math.max(0, state.hero.frail - 1);
  drawCards(5);
  renderBattle();
}

function drawCards(n) {
  for (let i = 0; i < n; i++) {
    if (state.draw.length === 0) {
      state.draw = shuffle(state.discard);
      state.discard = [];
    }
    const card = state.draw.pop();
    if (card) state.hand.push(card);
  }
}

function playCard(index) {
  const id = state.hand[index];
  const card = cards[id];
  if (!card || state.hero.energy < card.cost) return;
  state.hero.energy -= card.cost;
  state.hand.splice(index, 1);
  card.play(state);
  state.discard.push(id);
  if (state.hero.hp <= 0) return renderDefeat();
  if (state.enemy.hp <= 0) return winBattle();
  renderBattle();
}

function endTurn() {
  state.discard.push(...state.hand);
  state.hand = [];
  enemyTurn();
}

function enemyTurn() {
  applyPoisonTick();
  if (state.enemy.hp <= 0) return winBattle();
  const action = currentIntent();
  executeEnemyAction(action);
  state.enemy.actionIndex = (state.enemy.actionIndex + 1) % state.enemy.actions.length;
  if (state.hero.hp <= 0) return renderDefeat();
  startPlayerTurn();
}

function executeEnemyAction(action) {
  if (action.type === "attack" || action.type === "charge") {
    receiveAttack(action.value);
    log(state, `${state.enemy.name}の攻撃。${action.value}ダメージの一撃。`);
    return;
  }
  if (action.type === "multi") {
    let total = 0;
    for (let i = 0; i < action.hits; i++) total += receiveAttack(action.value);
    log(state, `${state.enemy.name}の連撃。合計${total}ダメージを受けた。`);
    return;
  }
  if (action.type === "block") {
    state.enemy.block += action.value;
    addEffect("enemy", "block", `+${action.value}`);
    log(state, `${state.enemy.name}は守りを固めた。`);
    return;
  }
  if (action.type === "heal") {
    const before = state.enemy.hp;
    state.enemy.hp = Math.min(state.enemy.maxHp, state.enemy.hp + action.value);
    addEffect("enemy", "heal", `+${state.enemy.hp - before}`);
    log(state, `${state.enemy.name}は体勢を立て直した。`);
    return;
  }
  if (action.type === "debuff") {
    state.hero[action.status] += action.value;
    addEffect("hero", "debuff", action.status === "weak" ? "弱体" : "脆弱");
    log(state, `${state.enemy.name}の搦め手。${action.status === "weak" ? "弱体" : "脆弱"}を受けた。`);
  }
}

function receiveAttack(amount) {
  const taken = Math.max(0, amount - state.hero.block);
  state.hero.block = Math.max(0, state.hero.block - amount);
  state.hero.hp = Math.max(0, state.hero.hp - taken);
  addEffect("hero", "hit", taken > 0 ? `-${taken}` : "BLOCK");
  return taken;
}

function winBattle() {
  state.kills += 1;
  state.effects = [];
  state.node += 1;
  if (!route[state.node]) return renderVictory();
  if (route[state.node]?.kind === "reward") return advance();
  renderReward();
}

function chooseReward(id) {
  state.deck.push(id);
  state.rewards += 1;
  state.node += route[state.node]?.kind === "reward" ? 1 : 0;
  advance();
}

function skipReward() {
  state.node += route[state.node]?.kind === "reward" ? 1 : 0;
  advance();
}

function damageEnemy(s, amount) {
  const total = Math.max(0, amount + s.hero.strength + s.hero.powerDamage - (s.hero.weak > 0 ? 2 : 0));
  const taken = Math.max(0, total - s.enemy.block);
  s.enemy.block = Math.max(0, s.enemy.block - total);
  s.enemy.hp = Math.max(0, s.enemy.hp - taken);
  addEffect("enemy", "hit", taken > 0 ? `-${taken}` : "BLOCK");
  log(s, `${taken}ダメージを与えた。`);
}

function gainBlock(s, amount) {
  if (s.hero.noBlock) {
    addEffect("hero", "debuff", "防御不可");
    log(s, "今ターンはブロックを得られない。");
    return;
  }
  const total = Math.max(0, amount - (s.hero.frail > 0 ? 2 : 0));
  s.hero.block += total;
  addEffect("hero", "block", `+${total}`);
  log(s, `${total}ブロックを得た。`);
}

function healHero(s, amount) {
  const before = s.hero.hp;
  s.hero.hp = Math.min(s.hero.maxHp, s.hero.hp + amount);
  log(s, `HPを${s.hero.hp - before}回復した。`);
}

function loseHeroHp(s, amount) {
  s.hero.hp = Math.max(0, s.hero.hp - amount);
  addEffect("hero", "hit", `-${amount}`);
  if (s.hero.hp <= 0) renderDefeat();
}

function addPoison(s, amount) {
  s.enemy.poison += amount;
  addEffect("enemy", "debuff", `毒${amount}`);
  log(s, `${s.enemy.name}に毒を${amount}与えた。`);
}

function applyPoisonTick() {
  if (state.enemy.poison <= 0) return;
  const amount = state.enemy.poison;
  state.enemy.hp = Math.max(0, state.enemy.hp - amount);
  addEffect("enemy", "debuff", `毒-${amount}`);
  log(state, `毒で${amount}ダメージ。`);
  state.enemy.poison = Math.max(0, state.enemy.poison - 1);
}

function currentIntent() {
  return state.enemy.actions[state.enemy.actionIndex];
}

function log(s, msg) {
  s.messages.unshift(msg);
  s.messages = s.messages.slice(0, 6);
}

function hpState() {
  const rate = state.hero.hp / state.hero.maxHp;
  if (rate < 0.3) return "danger";
  if (rate < 0.7) return "worn";
  return "normal";
}

function progressText() {
  return `${Math.min(state.node + 1, route.length)} / ${route.length}`;
}

function renderTitle() {
  app.innerHTML = `
    <section class="screen title-screen">
      <div class="title-wrap">
        <div class="title-art">
          <div class="hero-frame"><img class="hero-img" src="${sprites.normal || fallbackHero}" alt="主人公ルピっこ"></div>
          <div class="copy">
            <h1>ルピっこ<br>カードローグ</h1>
            <p>一本道を進み、カードを集めて、最後に待つ黒薔薇の魔女へ挑む短編デッキ構築ローグライク。</p>
            <button class="primary" onclick="startRun()">ゲーム開始</button>
          </div>
        </div>
      </div>
    </section>`;
}

function renderBattle() {
  const intent = currentIntent();
  app.innerHTML = `
    <section class="screen battle">
      <header class="topbar">
        <div class="stats">
          ${pill("HP", `${state.hero.hp}/${state.hero.maxHp}`, "hp")}
          ${pill("ブロック", state.hero.block, "block")}
          ${pill("エネルギー", `${state.hero.energy}/${state.hero.maxEnergy}`)}
          ${pill("ターン", state.turn)}
          ${pill("進行", progressText())}
          ${state.hero.powerDamage > 0 ? pill("火力+", state.hero.powerDamage, "status") : ""}
          ${state.hero.weak > 0 ? pill("弱体", state.hero.weak, "status") : ""}
          ${state.hero.frail > 0 ? pill("脆弱", state.hero.frail, "status") : ""}
          ${state.hero.noBlock ? pill("防御不可", "今ターン", "status") : ""}
        </div>
        <div>${state.deck.length}枚デッキ / 山札${state.draw.length} / 捨札${state.discard.length}</div>
      </header>
      <div class="field">
        <div class="combatant">
          ${renderEffects("hero")}
          <img class="hero-img ${hpState()}" src="${heroSprite()}" alt="主人公">
        </div>
        <div class="center-actions">
          <button onclick="endTurn()">ターン終了</button>
        </div>
        <div class="combatant">
          ${renderEffects("enemy")}
          <div class="intent ${intent.type}">
            <span>次の行動</span>
            <strong>${intentText(intent)}</strong>
          </div>
          <div>
            <img class="enemy-img" src="${state.enemy.image}" alt="${state.enemy.name}">
            <div class="enemy-name">${state.enemy.name}</div>
            <div class="enemy-stats">
              <div class="enemy-stat hp"><span>HP</span><strong>${state.enemy.hp}/${state.enemy.maxHp}</strong></div>
              <div class="enemy-stat block"><span>ブロック</span><strong>${state.enemy.block}</strong></div>
              ${state.enemy.poison > 0 ? `<div class="enemy-stat poison"><span>毒</span><strong>${state.enemy.poison}</strong></div>` : ""}
            </div>
          </div>
        </div>
      </div>
      <div class="log">${state.messages.map(m => `<div>${m}</div>`).join("")}</div>
      <div class="hand">
        ${state.hand.map((id, i) => renderCard(id, i)).join("")}
      </div>
    </section>`;
}

function addEffect(target, kind, text) {
  const effect = {
    id: `${Date.now()}-${Math.random()}`,
    target,
    kind,
    text,
  };
  state.effects.push(effect);
  window.setTimeout(() => {
    state.effects = state.effects.filter(item => item.id !== effect.id);
    if (state.screen === "battle") renderBattle();
  }, 620);
}

function intentText(intent) {
  if (intent.type === "attack") return `攻撃 ${intent.value}`;
  if (intent.type === "multi") return `連撃 ${intent.value}x${intent.hits}`;
  if (intent.type === "block") return `防御 ${intent.value}`;
  if (intent.type === "heal") return `回復 ${intent.value}`;
  if (intent.type === "debuff") return intent.status === "weak" ? `弱体 ${intent.value}` : `脆弱 ${intent.value}`;
  if (intent.type === "charge") return `大技 ${intent.value}`;
  return "?";
}

function renderEffects(target) {
  return state.effects
    .filter(effect => effect.target === target)
    .map(effect => `<div class="effect ${effect.kind}"><span>${effect.text}</span></div>`)
    .join("");
}

function renderCard(id, index) {
  const card = cards[id];
  const disabled = state.hero.energy < card.cost ? "disabled" : "";
  return `
    <button class="card" onclick="playCard(${index})" ${disabled}>
      <span class="cost">${card.cost}</span>
      <strong>${card.name}</strong>
      <span class="tag">${card.type}</span>
      <span>${card.text}</span>
    </button>`;
}

function renderReward() {
  state.screen = "reward";
  const rewardIds = shuffle(rewardPool).slice(0, 3);
  app.innerHTML = `
    <section class="screen choice-screen">
      <div class="choice-wrap">
        <h2>カード報酬</h2>
        <p>1枚選んでデッキに加えます。</p>
        <div class="choices">${rewardIds.map(id => rewardButton(id)).join("")}</div>
        <button onclick="skipReward()">スキップ</button>
      </div>
    </section>`;
}

function rewardButton(id) {
  const c = cards[id];
  return `<button class="choice-card" onclick="chooseReward('${id}')"><h3>${c.name}</h3><p>${c.type} / コスト${c.cost}</p><p>${c.text}</p></button>`;
}

function renderEvent() {
  state.screen = "event";
  app.innerHTML = `
    <section class="screen choice-screen">
      <div class="choice-wrap">
        <h2>イベント：小さなティータイム</h2>
        <p>古いテーブルに温かい紅茶が置かれている。少しだけ心が落ち着いた。</p>
        <div class="choices">
          <button class="choice-card" onclick="healAndNext(12)"><h3>休む</h3><p>HPを12回復する。</p></button>
          <button class="choice-card" onclick="addCardAndNext('sparkle')"><h3>きらめきを拾う</h3><p>きらめく一撃を1枚得る。</p></button>
          <button class="choice-card" onclick="addMaxHpAndNext()"><h3>背筋を伸ばす</h3><p>最大HPを6増やす。</p></button>
        </div>
      </div>
    </section>`;
}

function renderRest() {
  state.screen = "rest";
  app.innerHTML = `
    <section class="screen choice-screen">
      <div class="choice-wrap">
        <h2>休憩</h2>
        <p>次の戦いに向けて息を整える。</p>
        <div class="choices">
          <button class="choice-card" onclick="healAndNext(24)"><h3>しっかり休む</h3><p>HPを24回復する。</p></button>
          <button class="choice-card" onclick="addCardAndNext('heavy')"><h3>特訓する</h3><p>お掃除スマッシュを1枚得る。</p></button>
        </div>
      </div>
    </section>`;
}

function healAndNext(amount) {
  healHero(state, amount);
  state.node += 1;
  advance();
}

function addCardAndNext(id) {
  state.deck.push(id);
  state.rewards += 1;
  state.node += 1;
  advance();
}

function addMaxHpAndNext() {
  state.hero.maxHp += 6;
  state.hero.hp += 6;
  state.node += 1;
  advance();
}

function renderDefeat() {
  state.screen = "defeat";
  app.innerHTML = resultScreen("敗北", "ルピっこは力尽きた。けれど、次の挑戦のために小さな決意だけは残っている。", true);
}

function renderVictory() {
  state.screen = "victory";
  app.innerHTML = victoryScreen();
}

function resultScreen(title, message, defeat) {
  return `
    <section class="screen result-screen">
      <div class="result-wrap">
        <div class="result-grid">
          <img class="defeat-img ${defeat ? "danger" : ""}" src="${defeat ? sprites.defeat : sprites.normal}" alt="リザルトCG">
          <div>
            <h2>${title}</h2>
            <p>${message}</p>
            <p>到達地点：${progressText()}<br>撃破数：${state.kills}<br>獲得カード数：${state.rewards}<br>最終デッキ：${state.deck.length}枚</p>
            <button class="primary" onclick="startRun()">リトライ</button>
            <button onclick="newGame()">タイトルへ戻る</button>
          </div>
        </div>
      </div>
    </section>`;
}

function victoryScreen() {
  return `
    <section class="screen result-screen victory-screen">
      <div class="result-wrap victory-wrap">
        <div class="result-grid victory-grid">
          <img class="victory-img" src="${sprites.victory}" alt="ゲームクリアCG">
          <div class="victory-copy">
            <p class="ending-label">GAME CLEAR</p>
            <h2>黒薔薇の庭に、朝が来た</h2>
            <p>黒薔薇の魔女の魔法がほどけ、玩具の敵たちは小さな光へ変わった。ルピっこは少し照れながら、胸元のリボンをぎゅっと握る。</p>
            <blockquote>「えへへ……勝てました。あなたが最後までカードを選んでくれたからです。次も、いっしょに頑張りましょうね。」</blockquote>
            <p class="celebrate">おめでとうございます。ルピっこは無事、帰り道を見つけました。</p>
            <p>撃破数：${state.kills}<br>獲得カード数：${state.rewards}<br>最終デッキ：${state.deck.length}枚</p>
            <button class="primary" onclick="startRun()">もう一度遊ぶ</button>
            <button onclick="newGame()">タイトルへ戻る</button>
          </div>
        </div>
      </div>
    </section>`;
}

function pill(label, value, emphasis = "") {
  return `<div class="pill ${emphasis}"><span>${label}</span><strong>${value}</strong></div>`;
}

function heroSprite() {
  return sprites[hpState()] || fallbackHero;
}

function shuffle(array) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

prepareCharacterAssets();
newGame();
