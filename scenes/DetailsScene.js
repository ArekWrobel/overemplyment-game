export default class DetailsScene extends Phaser.Scene {
  constructor(){ super('Details'); }
  init(data){ this.role = data.role || localStorage.getItem('overemp.role') || 'Fullstack'; }
  create(){
    const { width } = this.scale;
    this.add.text(width/2, 60, `Szczegóły – ${this.role}`, { fontFamily:'Arial', fontSize:34, color:'#ffffff' }).setOrigin(0.5);
    const base = {
      'Frontend': { ap:3, stress:0, risk:2, desc:'Spec od UI/UX, szybki na frontendowych zadaniach, zmniejsza ryzyko przy pracy na FE.'},
      'Backend': { ap:3, stress:0, risk:3, desc:'Silny w API/DB. Na backendowych zadaniach robi dodatkowy postęp.'},
      'Fullstack': { ap:3, stress:1, risk:4, desc:'Ogarnia cały stos, ale łatwiej o context switch. Zyskuje przy różnorodności.'},
      'DevOps/AI': { ap:3, stress:0, risk:3, desc:'Automatyzuje, skraca koszty akcji i stabilizuje ryzyko.'}
    };
    const b = base[this.role];
    const txt = [
      `Startowe PA: ${b.ap}`,
      `Początkowy stres: ${b.stress}`,
      `Początkowe ryzyko: ${b.risk}%`,
      '',
      `${b.desc}`,
      '',
      `Wybrany perk: ${JSON.parse(localStorage.getItem('overemp.perk')||'{}').name || '(jeszcze nie wybrano)'}`
    ].join('\n');
    this.add.text(80, 120, txt, { fontFamily:'Arial', fontSize:20, color:'#e6e6e6', wordWrap:{ width: width-160 }});
    this.add.text(40, 20, '← Wróć', { fontFamily:'Arial', fontSize:18, color:'#9ef01a'}).setInteractive({useHandCursor:true}).on('pointerdown', ()=> this.scene.start('Character', { role: this.role }));
  }
}
