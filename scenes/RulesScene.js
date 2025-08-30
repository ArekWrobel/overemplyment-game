export default class RulesScene extends Phaser.Scene {
  constructor(){ super('Rules'); }
  create(){
    const { width } = this.scale;
    this.add.text(width/2, 60, 'Zasady Gry', { fontFamily:'Arial', fontSize:36, color:'#ffffff' }).setOrigin(0.5);
    const body = [
      'Cel: zbalansuj wiele projektów i zarób 120$, nie dopuszczając do wykrycia ani wypalenia.',
      '',
      'Tura:',
      '• Na starcie każdej tury masz 5 PA (punkty akcji).',
      '• Kliknij projekt, aby zrobić 1 zadanie (koszt 1 PA, modyfikatory mogą zmieniać koszt).',
      '• Redukcja stresu — koszt 1 PA, efekt: −1 stres.',
      '• Redukcja ryzyka wykrycia — koszt 2 PA, efekt: −2% ryzyka.',
      '• Stres i ryzyko rosną wraz z działaniami i zdarzeniami.',
      '',
      'Karty Zdarzeń:',
      '• W każdej chwili możesz dobrać kartę – działa natychmiast. kosztuje 1 PA',
      '• Karty mogą dodać PA/stres/ryzyko, usunąć zadania, dorzucić projekt itp.',
      '',
      'Role i Perki:',
      '• Każda rola ma pasywne bonusy.',
      '• Z ekranu postaci wybierz 1 perk (ikony i rzadkości). Efekty działają w trakcie gry.',
      '',
      'Koniec Gry:',
      '• Wygrana: 120$.',
      '• Przegrana: Stres ≥ 25 albo Ryzyko ≥ 40.',
      '',
      'Zapisywanie:',
      '• Gra automatycznie zapisuje postęp (localStorage).',
      '• Z menu możesz kontynuować ostatnią rozgrywkę.'
    ].join('\n');
    this.add.text(80, 120, body, { fontFamily:'Arial', fontSize:20, color:'#e6e6e6', wordWrap:{ width: width-160 }});
    this.add.text(40, 20, '← Wróć', { fontFamily:'Arial', fontSize:18, color:'#9ef01a'}).setInteractive({useHandCursor:true}).on('pointerdown', ()=> this.scene.start('Menu'));
  }
}
