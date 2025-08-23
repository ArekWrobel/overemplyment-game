export default class CharacterScene extends Phaser.Scene {
  constructor(){ super('Character'); }
  init(data){ this.role = data.role || 'Fullstack'; }
  preload(){
    this.load.image('perk_pixel_perfect', 'assets/perks/pixel_perfect.png');
    this.load.image('perk_ui_ninja', 'assets/perks/ui_ninja.png');
    this.load.image('perk_query_tuner', 'assets/perks/query_tuner.png');
    this.load.image('perk_cache_master', 'assets/perks/cache_master.png');
    this.load.image('perk_context_juggler', 'assets/perks/context_juggler.png');
    this.load.image('perk_swiss_knife', 'assets/perks/swiss_knife.png');
    this.load.image('perk_automation_guru', 'assets/perks/automation_guru.png');
    this.load.image('perk_sre_shield', 'assets/perks/sre_shield.png');
    // this.load.image('rarity_common', 'assets/rarity/common.png');
    // this.load.image('rarity_rare', 'assets/rarity/rare.png');
    // this.load.image('rarity_epic', 'assets/rarity/epic.png');
    // rarity icons (SVG)
    this.load.svg('rarity_common', 'assets/rarity/common.svg', { width: 48, height: 48 });
    this.load.svg('rarity_rare',   'assets/rarity/rare.svg',   { width: 52, height: 52 });
    this.load.svg('rarity_epic',   'assets/rarity/epic.svg',   { width: 56, height: 56 });

  }
  create(){
    const { width, height } = this.scale;
    this.add.text(width/2, 60, `Wybór perka – ${this.role}`, { fontFamily:'Arial', fontSize:36, color:'#ffffff' }).setOrigin(0.5);
    const perkDefs = {
      'Frontend': [
        { id:'pixel_perfect', name:'Pixel Perfect', rarity:'rare', icon:'perk_pixel_perfect', desc:'Praca nad Frontend: -1 ryzyka wykrycia przy akcji.' },
        { id:'ui_ninja', name:'UI Ninja', rarity:'epic', icon:'perk_ui_ninja', desc:'Pierwsza akcja na projekcie Frontend w turze kosztuje 0 PA.' }
      ],
      'Backend': [
        { id:'query_tuner', name:'Query Tuner', rarity:'rare', icon:'perk_query_tuner', desc:'Przy akcji na Backend: -1 dodatkowe zadanie (bonus).' },
        { id:'cache_master', name:'Cache Master', rarity:'common', icon:'perk_cache_master', desc:'Co 3. turę +1 PA.' }
      ],
      'Fullstack': [
        { id:'context_juggler', name:'Context Juggler', rarity:'epic', icon:'perk_context_juggler', desc:'Przy zmianie typu projektu: -2 stresu (zamiast -1).' },
        { id:'swiss_knife', name:'Swiss Knife', rarity:'rare', icon:'perk_swiss_knife', desc:'Na starcie: +10$ i -1 zadanie w losowym projekcie.' }
      ],
      'DevOps/AI': [
        { id:'automation_guru', name:'Automation Guru', rarity:'epic', icon:'perk_automation_guru', desc:'20% szans, że akcja kosztuje 0 PA.' },
        { id:'sre_shield', name:'SRE Shield', rarity:'rare', icon:'perk_sre_shield', desc:'Na koniec każdej tury: -1 ryzyka wykrycia.' }
      ]
    };
    this.tooltip = this.add.text(0,0,'', { fontFamily:'Arial', fontSize:16, color:'#0e1014', backgroundColor:'#9ef01a', padding:{x:8,y:6} }).setDepth(5).setVisible(false);
    const perks = perkDefs[this.role];
    const drawCard = (x,y,perk) => {
      const card = this.add.rectangle(x, y, 420, 150, 0x11161c).setOrigin(0.5).setStrokeStyle(2, 0x3a3f46).setInteractive({useHandCursor:true});
      const icon = this.add.image(x-160,y,perk.icon).setDisplaySize(96,96);
      const name = this.add.text(x-100, y-40, perk.name, { fontFamily:'Arial', fontSize:24, color:'#ffffff' });
      const desc = this.add.text(x-100, y-6, perk.desc, { fontFamily:'Arial', fontSize:16, color:'#cccccc', wordWrap:{width:290} });
      const rarityIcon = this.add.image(x+180, y-55, `rarity_${perk.rarity}`).setDisplaySize(28,28);
      const showTip = ()=>{ this.tooltip.setText(`${perk.name} (${perk.rarity})\n${perk.desc}`); this.tooltip.setPosition(x-200, y-90); this.tooltip.setVisible(true); };
      const hideTip = ()=> this.tooltip.setVisible(false);
      card.on('pointerover', showTip); card.on('pointerout', hideTip);
      card.on('pointerdown', ()=> this.pickPerk(perk));
      return [card,icon,name,desc,rarityIcon];
    };
    drawCard(width/2, height/2 - 10, perks[0]);
    drawCard(width/2, height/2 + 170, perks[1]);
    this.add.text(40,20,'Szczegóły postaci',{fontFamily:'Arial',fontSize:18,color:'#9ef01a'}).setInteractive({useHandCursor:true}).on('pointerdown',()=> this.scene.start('Details',{role:this.role}));
    this.add.text(width-140,20,'Wstecz',{fontFamily:'Arial',fontSize:18,color:'#9ef01a'}).setInteractive({useHandCursor:true}).on('pointerdown',()=> this.scene.start('Menu'));
  }
  pickPerk(perk){
    this.sound.play('sfx_click', { volume:0.6 });
    localStorage.setItem('overemp.role', this.role);
    localStorage.setItem('overemp.perk', JSON.stringify(perk));
    localStorage.removeItem('overemp.save');
    this.scene.start('Game', { role:this.role, perk });
  }
}
