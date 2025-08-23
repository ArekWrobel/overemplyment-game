// export default class BootScene extends Phaser.Scene {
//   constructor(){ super('Boot'); }
//   preload(){ this.load.setBaseURL('./'); }
//   create(){ this.scene.start('Menu'); }
// }
export default class BootScene extends Phaser.Scene {
  constructor(){ super('Boot'); }

  preload(){
    this.load.setBaseURL('./');
    // Sounds
    this.load.audio('sfx_click', 'assets/sounds/click.wav');
    this.load.audio('sfx_whoosh', 'assets/sounds/whoosh.wav');
    this.load.audio('sfx_card', 'assets/sounds/card.wav');
    this.load.audio('sfx_success', 'assets/sounds/success.wav');
    this.load.audio('sfx_fail', 'assets/sounds/fail.wav');

    // Tiny texture for particles/bars
    const g = this.make.graphics({x:0,y:0,add:false});
    g.fillStyle(0xffffff,1).fillRect(0,0,4,4);
    g.generateTexture('dot4', 4, 4);

    const { width, height } = this.scale;
    // Title
    const title = this.add.text(width/2, height*0.34, 'Gra Overemployment', { fontFamily:'Arial', fontSize:60, color:'#ffffff' }).setOrigin(0.5);
    title.alpha = 0;
    this.tweens.add({ targets: title, alpha:1, y:height*0.32, duration:800, ease:'Cubic.easeOut', onComplete:()=>{ this.sound.play('sfx_whoosh', { volume: 0.5 }); } });
    
    const subtitle = this.add.text(width/2, height*0.40, 'PWA • Phaser 3', { fontFamily:'Arial', fontSize:22, color:'#9ef01a' }).setOrigin(0.5);
    subtitle.alpha = 0;
    this.tweens.add({ targets: subtitle, alpha:1, delay:300, duration:700 });

    // Loading bar
    this.add.rectangle(width/2, height/2, 380, 16, 0x1f2430).setStrokeStyle(2, 0x3a3f46);
    const bar = this.add.rectangle(width/2 - 180, height/2, 0, 12, 0x9ef01a).setOrigin(0,0.5);
    this.load.on('progress', (p)=>{ bar.width = 360*p; });

    // Particles (rising)
    this.add.particles(0, 0, 'dot4', {
      x: { min: 0, max: width },
      y: height + 10,
      speedY: { min: -40, max: -90 },
      scale: { start: 0.6, end: 0.2 },
      alpha: { start: 0.5, end: 0 },
      lifespan: 3800,
      quantity: 3,
      tint: 0x9ef01a
    });
  }

  create(){
    this.time.delayedCall(900, ()=> this.scene.start('Menu'));
  }
}