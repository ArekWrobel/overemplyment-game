import CardDeck from '../systems/CardDeck.js';
import { EVENT_CARDS } from '../data/cards.js';
import { openFeedbackModal } from '../ui/FeedbackModal.js';


const CARD_RARITY = {
  // epickie
  'genius_commit': 'epic',
  'ai_help': 'epic',
  'design_system': 'epic',
  'postmortem': 'epic',
  // rzadkie
  'bonus': 'rare',
  'less_meetings': 'rare',
  'security_patch': 'rare',
  'observability': 'rare',
  'focus_mode': 'rare',
  'automation_script': 'rare',
  'greenfield': 'rare',
  // reszta będzie common
};

// === Highlight: kolory typów ===
const TYPE_COLORS = {
  Frontend: 0x39d353,   // zielonkawy
  Backend:  0x58a6ff,   // niebieski
  Fullstack:0xf2cc60,   // żółtawy
  DevOps:    0xff7b72,  // koral
};

// Czy perk/rola daje „afinity” do typu projektu (mocniejsze podświetlenie)
function hasTypeAffinity(role, perk, projectType) {
  const perkId = perk?.id || null;
  if (role?.startsWith('Frontend'))  return projectType === 'Frontend';
  if (role?.startsWith('Backend'))   return projectType === 'Backend';
  if (role?.startsWith('DevOps'))    return projectType === 'DevOps';
  if (role?.startsWith('Fullstack')) {
    // Fullstack: delikatna afinity do wszystkich, ale mocniejsza gdy perk "context_juggler"
    if (perkId === 'context_juggler') return true; // mocniej na wszystkich
    return true; // lekko na wszystkich
  }
  return false;
}



export default class GameScene extends Phaser.Scene {
  constructor(){ super('Game'); }
  init(data){
    this.role = data.role || localStorage.getItem('overemp.role') || 'Fullstack';
    this.perk = data.perk || JSON.parse(localStorage.getItem('overemp.perk')||'null');
    this.turn = 1;
    this.state = {
      role: this.role,
      actionsPerTurn: 5,
      actionsLeft: 5,
      stress: 0,
      detectionRisk: 3,
      money: 20,
      projects: [],
      modifiers: { apCost: 0 },
      skipTurn: false,
      pendingNewProject: false,
      log: []
    };
    this.deck = new CardDeck(EVENT_CARDS);

    if (data.continue && data.save) {
      this.turn = data.save.turn;
      this.state = data.save.state;
      this.role = data.save.role;
      this.perk = data.save.perk;
    }
  }
  
  createButton(x, y, label, callback) {
    const WIDTH = 180;
    const HEIGHT = 32;

    const bg = this.add.rectangle(x, y, WIDTH, HEIGHT, 0x9ef01a)
      .setOrigin(0,0).setInteractive({ useHandCursor:true }).setDepth(500);
    const txt = this.add.text(x + WIDTH/2, y + HEIGHT/2, label, {
      fontFamily: 'Arial', fontSize: 18, color: '#0e1014'
    }).setOrigin(0.5).setDepth(501);

    bg.on('pointerdown', () => {
      this.sfx?.click?.play({volume:0.6});
      callback();
    });

    // hover efekt
    bg.on('pointerover', () => bg.setFillStyle(0xbff94a));
    bg.on('pointerout', () => bg.setFillStyle(0x9ef01a));

    return { bg, txt };
  }

  create(){
    this.sfx = {
      click: this.sound.add('sfx_click'),
      whoosh: this.sound.add('sfx_whoosh'),
      card: this.sound.add('sfx_card'),
      success: this.sound.add('sfx_success'),
      fail: this.sound.add('sfx_fail')
    };
    // Zastosuj perki startowe (Swiss Knife)
    if (this.perk && this.perk.id === 'swiss_knife' && this.state.projects.length) {
      this.state.money += 10;
      const i = Math.floor(Math.random()*this.state.projects.length);
      this.state.projects[i].tasksRemaining = Math.max(0, this.state.projects[i].tasksRemaining - 1);
    }

    const { width, height } = this.scale;
    this.add.text(20, 16, `Rola: ${this.role}  v${window.__GAME_VERSION__}`, { fontFamily: 'Arial', fontSize: 16, color: '#9ef01a' });
    this.hud = this.add.text(20, 40, '', { fontFamily: 'Arial', fontSize: 18, color: '#ffffff' });
    
    const BTN_X = width - 180;

    // Prawa kolumna przycisków
    this.endTurnBtn = this.createButton(BTN_X, 16, 'Zakończ turę', () => this.endTurn());
    this.cardBtn    = this.createButton(BTN_X, 56, 'Dobierz kartę', () => this.drawCard());
    this.reduceStressBtn = this.createButton(BTN_X, 96, 'Zredukuj stres', () => this.reduceStressAction());
    this.reduceRiskBtn   = this.createButton(BTN_X, 136, 'Zredukuj ryzyko', () => this.reduceRiskAction());

    this.grid = { cols: 3, rows: 3, cellW: 300, cellH: 160, startX: 60, startY: 120 };
    this.cells = [];

    for (let i=0;i<5;i++) this.addProject();
    const legend = [
      ['Frontend', TYPE_COLORS.Frontend],
      ['Backend', TYPE_COLORS.Backend],
      ['Fullstack', TYPE_COLORS.Fullstack],
      ['DevOps', TYPE_COLORS.DevOps],
    ];
    let lx = 20, ly = 68;
    legend.forEach(([label, col]) => {
      const r = this.add.rectangle(lx, ly, 16, 10, col).setStrokeStyle(1, 0x1f242d).setOrigin(0,0.5).setDepth(400);
      const t = this.add.text(lx + 22, ly, label, { fontFamily:'Arial', fontSize:14, color:'#cfd1d4' }).setOrigin(0,0.5).setDepth(400);
      lx += 110;
    });

    // w create() np. GameScene i MenuScene
    const scene = this;
    const icons = [
      { key:'github',   url:'https://github.com/twojrepo', tooltip:'Zgłoś błąd na GitHub' },
      { key:'patronite',url:null, tooltip:'Patronite – wkrótce' },
      { key:'wspieram', url:null, tooltip:'Wspieram.to – wkrótce' },
      { key:'blog',     url:'https://blog.softwareveteran.dev', tooltip:'Mój blog' },
      { key:'feedback', url:null, tooltip:'Prześlij opinię', action:()=> openFeedbackModal(this) }
    ];

    const dockY = this.scale.height - 40;
    let posX = this.scale.width/2 - (icons.length*50)/2;

    icons.forEach(icon => {
      const active = !!(icon.url || icon.action);
      const img = this.add.image(posX, dockY, icon.key)
        .setInteractive({ useHandCursor:true })
        .setScale(0.5)
        .setAlpha(active ? 1 : 0.4);

      img.on('pointerdown', () => {
        if (icon.action) { 
          this.sfx?.click?.play?.({ volume:0.6 });
          icon.action(); 
          return; 
        }
        if (icon.url) { 
          this.sfx?.click?.play?.({ volume:0.6 });
          window.open(icon.url, '_blank'); 
        } else {
          // MenuScene zwykle nie ma this.toast — użyj helpera:
          showToast ? showToast(this, icon.tooltip || 'Wkrótce dostępne') 
                    : (this.toast && this.toast(icon.tooltip || 'Wkrótce dostępne'));
        }
      });

      posX += 50;
    });


    this.renderBoard();
    this.updateHUD();
    this.toast('Kliknij projekt, aby wykonać zadanie.');
  }

  toast(msg) {
    if (this.toastText) this.toastText.destroy();
    const { width } = this.scale;
    // niżej, żeby nie kolidowało z legendą (~y=110)
    this.toastText = this.add.text(width/2, 110, msg, {
      fontFamily: 'Arial', fontSize: 18, color: '#ffffff',
      backgroundColor: '#222', padding: { x: 10, y: 6 }
    }).setOrigin(0.5).setDepth(1000);
  
    // delikatny fade + lekki „slide”
    this.toastText.alpha = 0;
    this.tweens.add({ targets: this.toastText, alpha: 1, y: 104, duration: 200, ease: 'Quad.easeOut' });
  
    // dłuższy czas widoczności (4.5s)
    this.time.delayedCall(4500, () => this.toastText?.destroy());
  }
  
// --- UI helper: zaokrąglony panel jako Graphics ---
createRoundedPanel(x, y, w, h, fill = 0x1a1f28, radius = 12, stroke = 0x3a3f46) {
  const g = this.add.graphics().setDepth(1000);
  g.fillStyle(fill, 1);
  g.lineStyle(2, stroke, 1);
  g.beginPath();
  // rounded rect path
  const r = radius;
  g.moveTo(x - w/2 + r, y - h/2);
  g.lineTo(x + w/2 - r, y - h/2);
  g.arc(x + w/2 - r, y - h/2 + r, r, -Math.PI/2, 0);
  g.lineTo(x + w/2, y + h/2 - r);
  g.arc(x + w/2 - r, y + h/2 - r, r, 0, Math.PI/2);
  g.lineTo(x - w/2 + r, y + h/2);
  g.arc(x - w/2 + r, y + h/2 - r, r, Math.PI/2, Math.PI);
  g.lineTo(x - w/2, y - h/2 + r);
  g.arc(x - w/2 + r, y - h/2 + r, r, Math.PI, 1.5*Math.PI);
  g.closePath();
  g.fillPath();
  g.strokePath();
  return g;
}
// --- Overlay karty przy doborze ---
showCardOverlay(card, rarity = 'common') {
  const { width } = this.scale;

  // rozmiar panelu i pozycja (poniżej HUD/legendy)
  const panelW = 560;
  const panelH = 190;
  const px = width/2;
  const py = 190;

  // tło
  const panel = this.createRoundedPanel(px, py, panelW, panelH, 0x141820);
  panel.setAlpha(0).setScale(0.98);

  // ikonka rzadkości (lewy górny róg panelu)
  const key = rarity === 'epic' ? 'rarity_epic' : rarity === 'rare' ? 'rarity_rare' : 'rarity_common';
  const badge = this.add.image(px - panelW/2 + 24, py - panelH/2 + 24, key)
    .setOrigin(0,0).setDepth(1001).setScale(0.8).setAlpha(0);

  // tytuł (pogrubiony) i treść
  const title = this.add.text(px - panelW/2 + 86, py - panelH/2 + 18, card.title, {
    fontFamily: 'Arial', fontSize: 24, color: '#ffffff', fontStyle: 'bold'
  }).setDepth(1001).setAlpha(0);

  const desc = this.add.text(px - panelW/2 + 24, py - panelH/2 + 58, card.description, {
    fontFamily: 'Arial', fontSize: 18, color: '#cfd1d4',
    wordWrap: { width: panelW - 48 }
  }).setDepth(1001).setAlpha(0);

  // wejście (animki)
  this.tweens.add({ targets: panel, alpha: 1, scaleX: 1, scaleY: 1, duration: 180, ease: 'Quad.easeOut' });
  this.tweens.add({ targets: [badge, title, desc], alpha: 1, duration: 220, delay: 100, ease: 'Quad.easeOut' });

  // dźwięk wg rzadkości
  if (this.sfx) {
    if (rarity === 'epic') this.sfx.success?.play({ volume: 0.7 });
    else if (rarity === 'rare') this.sfx.card?.play({ volume: 0.55 });
    else this.sfx.click?.play({ volume: 0.5 });
  }

  // zamknięcie po ~5.5s lub kliknięciem
  const close = () => {
    [badge, title, desc].forEach(o => this.tweens.add({ targets: o, alpha: 0, duration: 150, onComplete: () => o.destroy() }));
    this.tweens.add({ targets: panel, alpha: 0, duration: 150, onComplete: () => panel.destroy() });
  };
  const timer = this.time.delayedCall(5500, close);
  panel.setInteractive(new Phaser.Geom.Rectangle(px - panelW/2, py - panelH/2, panelW, panelH), Phaser.Geom.Rectangle.Contains)
       .on('pointerdown', () => { timer.remove(false); close(); });
}


  showRarityBadge(rarity, title) {
    const { width } = this.scale;
    const key = rarity === 'epic' ? 'rarity_epic' : rarity === 'rare' ? 'rarity_rare' : 'rarity_common';
  
    // ustawiamy obok toasta (toast y≈110) — „po prawej” od środka
    const x = Math.min(width - 60, width/2 + 320);
    const y = 104;
  
    const icon = this.add.image(x, y, key).setOrigin(0.5).setScale(0.85).setAlpha(0).setDepth(1001);
    const glow = this.add.image(x, y, key).setOrigin(0.5).setScale(1.05).setAlpha(0).setDepth(1001);
  
    // wejście
    this.tweens.add({ targets: [icon, glow], alpha: 1, duration: 180, ease: 'Quad.easeOut' });
    // puls
    this.tweens.add({ targets: icon, scale: { from: 0.85, to: 1.06 }, yoyo: true, repeat: 2, duration: 260, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: glow, scale: { from: 1.05, to: 1.25 }, alpha: { from: 0.5, to: 0.0 }, duration: 520, ease: 'Quad.easeOut' });
  
    // dźwięk wg rzadkości (opcjonalnie)
    if (this.sfx) {
      if (rarity === 'epic') this.sfx.success?.play({ volume: 0.7 });
      else if (rarity === 'rare') this.sfx.card?.play({ volume: 0.55 });
      else this.sfx.click?.play({ volume: 0.5 });
    }
  
    // dłużej niż toast — 5s
    this.time.delayedCall(5000, () => {
      this.tweens.add({ targets: icon, alpha: 0, duration: 200, onComplete: () => icon.destroy() });
      this.tweens.add({ targets: glow, alpha: 0, duration: 200, onComplete: () => glow.destroy() });
    });
  }
  

  addProject() {
    const names = ['Frontend SPA', 'Backend API', 'Aplikacja mobilna', 'Panel Admina', 'Integracja płatności', 'Monitoring', 'CI/CD', 'Landing Page', 'Konsola danych'];
    const types = ['Frontend', 'Backend', 'Fullstack', 'DevOps'];
    const name = names[Math.floor(Math.random()*names.length)];
    const type = types[Math.floor(Math.random()*types.length)];
    const tasks = Phaser.Math.Between(3,6);
    this.state.projects.push({ name, type, tasksRemaining: tasks, revenue: Phaser.Math.Between(8,16) });
  }

  renderBoard(){
    if (this.cellGraphics) this.cellGraphics.destroy();
    this.cells.forEach(c => c.rect?.destroy());
    this.cells = [];

    this.cellGraphics = this.add.graphics();
    const { startX, startY, cols, rows, cellW, cellH } = this.grid;

    for (let r=0;r<rows;r++){
      for (let c=0;c<cols;c++){
        const x = startX + c*(cellW+20);
        const y = startY + r*(cellH+20);
        const rect = this.add.rectangle(x, y, cellW, cellH, 0x11161c).setOrigin(0,0).setStrokeStyle(2, 0x3a3f46).setInteractive({ useHandCursor: true });
        const index = r*cols + c;
        rect.on('pointerdown', () => this.onCellClicked(index));
        this.cells.push({ rect, index });
      }
    }
    // Zastosuj podświetlenie komórek względem typu i perka
    this.state.projects.forEach((p, i) => this.updateCellHighlight(i, p));

    this.renderProjects();
  }

  renderProjects(){
    if (this.projectTexts) this.projectTexts.forEach(t => t.destroy());
    this.projectTexts = [];

    const { startX, startY, cols, cellW } = this.grid;
    this.state.projects.forEach((p, i) => {
      const r = Math.floor(i/cols);
      const c = i % cols;
      const x = startX + c*(cellW+20) + 14;
      const y = startY + r*(160+20) + 12;
      const t = this.add.text(x, y, `${p.name} [${p.type}]\nZadania: ${p.tasksRemaining}\nPrzychód: ${p.revenue}$`, { fontFamily: 'Arial', fontSize: 18, color: '#ffffff', wordWrap: { width: 300 - 28 } }).setDepth(1);
      const progX = x, progY = y + 90, progW = 300 - 30, progH = 12;
      const g = this.add.graphics();
      g.fillStyle(0x2a2f36).fillRect(progX, progY, progW, progH);
      const done = Math.max(0, 1 - (p.tasksRemaining / 6));
      g.fillStyle(0x9ef01a).fillRect(progX, progY, progW * done, progH);
      this.projectTexts.push(t, g);
    });
  }

  updateCellHighlight(index, project) {
    const cell = this.cells[index];
    if (!cell || !cell.rect || !project) return;
  
    const baseFill = 0x11161c;  // ciemne tło
    const baseStroke = 0x3a3f46;
  
    const typeColor = TYPE_COLORS[project.type] || baseStroke;
    const affinity  = hasTypeAffinity(this.role, this.perk, project.type);
  
    // Ustal nasycenie ramki w zależności od afinity i wybranego perka
    const strokeColor = affinity ? typeColor : baseStroke;
    const strokeWidth = affinity ? 3 : 2;
  
    // Nie męcz oka zbyt jaskrawym wypełnieniem – subtelny tint
    const tintFill = affinity ? 0x141b1f : baseFill;
  
    cell.rect.setFillStyle(tintFill, 1).setStrokeStyle(strokeWidth, strokeColor);
  
    // Puls dla afinity (delikatny)
    // Dbamy, żeby nie nakładać wielu tweenów na ten sam rect
    if (affinity) {
      if (!cell.rect._pulseTween || !cell.rect._pulseTween.isPlaying()) {
        // usuń stary tween jeśli jest
        if (cell.rect._pulseTween) cell.rect._pulseTween.remove();
  
        cell.rect.setScale(1,1);
        cell.rect._pulseTween = this.tweens.add({
          targets: cell.rect,
          scaleX: { from: 1.0, to: 1.02 },
          scaleY: { from: 1.0, to: 1.02 },
          duration: 500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    } else {
      // wyłącz puls jeśli nie ma afinity
      if (cell.rect._pulseTween) {
        cell.rect._pulseTween.remove();
        cell.rect._pulseTween = null;
      }
      cell.rect.setScale(1,1);
    }
  }
  

  onCellClicked(index){
    const project = this.state.projects[index];
    if (!project) return;
    if (this.state.actionsLeft <= 0) { this.toast('Brak PA w tej turze.'); return; }
    if (this.state.skipTurn) { this.toast('Ta tura jest pominięta.'); return; }

    // koszt akcji
    let apCost = 1 + (this.state.modifiers.apCost || 0);
    // Perk: UI Ninja – pierwsza akcja na FE za 0 PA
    if (!this.usedUINinja && this.perk && this.perk.id === 'ui_ninja' && project.type === 'Frontend') { apCost = 0; this.usedUINinja = true; }
    // Perk: Automation Guru – 20% szansy na darmową akcję
    if (this.perk && this.perk.id === 'automation_guru' && Math.random() < 0.20) { apCost = 0; }

    if (this.state.actionsLeft < apCost) { this.toast('Za mało PA na akcję.'); return; }
    this.state.actionsLeft -= apCost;

    // modyfikatory roli
    if (this.role.startsWith('Backend') && project.type === 'Backend') {
      project.tasksRemaining = Math.max(0, project.tasksRemaining - 1);
      // Perk: Query Tuner – dodatkowy -1
      if (this.perk && this.perk.id === 'query_tuner') project.tasksRemaining = Math.max(0, project.tasksRemaining - 1);
    }
    if (this.role.startsWith('Frontend') && project.type === 'Frontend') {
      this.state.detectionRisk = Math.max(0, this.state.detectionRisk - 1);
      // Perk: Pixel Perfect – -1 ryzyka przy akcji FE (już zastosowane powyżej, tu dodatkowo -1)
      if (this.perk && this.perk.id === 'pixel_perfect') this.state.detectionRisk = Math.max(0, this.state.detectionRisk - 1);
    }
    if (this.role.startsWith('DevOps')) {
      if (Math.random() < 0.10) this.state.actionsLeft += 1; // lekka automatyzacja: zwróć 1 PA czasem
    }

    // wykonaj jedno zadanie
    project.tasksRemaining = Math.max(0, project.tasksRemaining - 1);

    // fullstack bonus + perk Context Juggler
    if (!this.lastType) this.lastType = project.type;
    else if (this.role.startsWith('Fullstack') && this.lastType !== project.type) {
      const delta = (this.perk && this.perk.id === 'context_juggler') ? 2 : 1;
      this.state.stress = Math.max(0, this.state.stress - delta);
    }
    this.lastType = project.type;

    this.state.stress = Math.min(100, this.state.stress + 1);
    this.state.detectionRisk = Math.min(100, this.state.detectionRisk + 1);

    if (project.tasksRemaining === 0) {
      this.state.money += project.revenue;
      this.toast(`Zakończono "${project.name}"! +${project.revenue}$`);
      this.state.projects.splice(index, 1);
      if (this.state.projects.length < 5) this.addProject();
      this.renderBoard();
    } else {
      this.renderProjects();
    }

    this.updateHUD();
    this.autosave();
  }

  updateHUD(){
    const s = this.state;
    this.hud.setText([
      `Tura: ${this.turn}`,
      `PA: ${s.actionsLeft}/${s.actionsPerTurn} (modyfikator: ${s.modifiers.apCost >= 0 ? '+' : ''}${s.modifiers.apCost})`,
      `Stres: ${s.stress}`,
      `Ryzyko wykrycia: ${s.detectionRisk}%`,
      `Kasa: ${s.money}$`,
      `Projekty: ${s.projects.length}`,
      `Perk: ${this.perk ? this.perk.name : '—'}`
    ].join('    '));
  }

  drawCard(){
    if (this.state.skipTurn) { this.toast('Ta tura jest pominięta.'); return; }
    if (this.state.actionsLeft < 1) { this.toast('Brak PA.'); return; }
    
    this.state.actionsLeft -= 1;

    const card = this.deck.draw();
    const rarity = CARD_RARITY[card.id] || 'common';
  
    // ładny overlay karty (zamiast toasta + osobnej ikonki)
    this.showCardOverlay(card, rarity);
  
    // zastosuj efekt karty
    card.apply(this.state);
  
    if (this.state.pendingNewProject) {
      this.addProject();
      this.state.pendingNewProject = false;
      this.renderBoard();
    }
    this.updateHUD();
    this.autosave();
  }
  // Redukcja stresu: koszt 1 PA, −1 stres
  reduceStressAction() {
    if (this.state.skipTurn) { this.toast('Ta tura jest pominięta.'); return; }
    if (this.state.actionsLeft < 1) { this.toast('Brak PA.'); return; }

    this.state.actionsLeft -= 1;
    this.state.stress = Math.max(0, this.state.stress - 1);

    // krótka animka i komunikat
    this.cameras.main.flash(120, 30, 180, 30);
    this.toast('Stres −1');
    this.updateHUD();
    this.autosave();
  }

  // Redukcja ryzyka: koszt 2 PA, −2% ryzyka
  reduceRiskAction() {
    if (this.state.skipTurn) { this.toast('Ta tura jest pominięta.'); return; }
    if (this.state.actionsLeft < 2) { this.toast('Brak PA.'); return; }

    this.state.actionsLeft -= 2;
    this.state.detectionRisk = Math.max(0, this.state.detectionRisk - 2);

    // krótka animka i komunikat
    this.cameras.main.flash(120, 30, 30, 180);
    this.toast('Ryzyko −2%');
    this.updateHUD();
    this.autosave();
  }

  
  endTurn(){
    this.usedUINinja = false;
    if (this.state.skipTurn) {
      this.state.skipTurn = false;
      this.state.log.push('Tura pominięta.');
    } else {
      if (Math.random()*100 < this.state.detectionRisk * 0.3) {
        this.state.stress = Math.min(100, this.state.stress + 2);
        this.toast('Pogłoski o overemployment zwiększyły stres (+2).');
      }
    }

    this.turn += 1;
    this.state.actionsLeft = this.state.actionsPerTurn;
    // Perk: Cache Master – co 3. turę +1 PA
    if (this.perk && this.perk.id === 'cache_master' && this.turn % 3 === 0) this.state.actionsLeft += 1;
    // Perk: SRE Shield – -1 ryzyka na koniec tury
    if (this.perk && this.perk.id === 'sre_shield') this.state.detectionRisk = Math.max(0, this.state.detectionRisk - 1);

    this.state.modifiers.apCost = 0;

    if (this.turn % 3 === 0 && this.state.projects.length < this.grid.cols*this.grid.rows) {
      this.addProject();
      this.renderBoard();
      this.state.log.push('Presja rynku: nowy projekt!');
    }

    this.updateHUD();
    this.autosave();

    if (this.state.stress >= 25) { this.gameOver('Wypalenie! Za duży stres.'); }
    else if (this.state.detectionRisk >= 40) { this.gameOver('Wykryto overemployment!'); }
    else if (this.state.money >= 120) { this.gameWin('Awans! Udało się zbalansować wiele projektów.'); }
  }

  autosave(){
    const payload = { role: this.role, perk: this.perk, turn: this.turn, state: this.state };
    try { localStorage.setItem('overemp.save', JSON.stringify(payload)); } catch(e){ console.warn('Autosave failed', e); }
  }

  gameOver(reason){ this.scene.stop(); this.scene.start('Menu'); alert('Koniec gry: ' + reason); }
  gameWin(reason){ this.sfx.success?.play({volume:0.6}); this.scene.stop(); this.scene.start('Menu'); alert('Wygrana: ' + reason); }
}
