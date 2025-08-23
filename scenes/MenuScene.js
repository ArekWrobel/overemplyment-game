export default class MenuScene extends Phaser.Scene {
  constructor(){ super('Menu'); }
  init(){ this.deferredPrompt = null; }
  create(){
    const { width, height } = this.scale;
    this.add.text(width/2, height*0.25, 'Gra Overemployment', { fontFamily:'Arial', fontSize:64, color:'#ffffff' }).setOrigin(0.5);
    this.add.text(width/2, height*0.35, 'Wybierz rolę i rozpocznij', { fontFamily:'Arial', fontSize:22, color:'#9ef01a' }).setOrigin(0.5);
    const roles = ['Frontend','Backend','Fullstack','DevOps/AI']; let selected = 0;
    const roleText = this.add.text(width/2, height*0.45, `Rola: ${roles[selected]}`, { fontFamily:'Arial', fontSize:28, color:'#ffffff' }).setOrigin(0.5).setInteractive({useHandCursor:true});
    roleText.on('pointerdown', ()=> { selected = (selected+1)%roles.length; roleText.setText(`Rola: ${roles[selected]}`); });
    const startBtn = this.add.text(width/2, height*0.55, 'START', { fontFamily:'Arial', fontSize:36, color:'#0e1014', backgroundColor:'#9ef01a', padding:{x:20,y:12} }).setOrigin(0.5).setInteractive({useHandCursor:true});
    startBtn.on('pointerdown', ()=> this.scene.start('Character', { role: roles[selected] }));
    // Kontynuuj jeśli jest zapis
    const hasSave = !!localStorage.getItem('overemp.save');
    if (hasSave) {
      const contBtn = this.add.text(width/2, height*0.65, 'KONTYNUUJ', { fontFamily:'Arial', fontSize:28, color:'#0e1014', backgroundColor:'#9ef01a', padding:{x:16,y:10} }).setOrigin(0.5).setInteractive({useHandCursor:true});
      contBtn.on('pointerdown', ()=> {
        const save = JSON.parse(localStorage.getItem('overemp.save'));
        this.scene.start('Game', { continue:true, save });
      });
    }
    const rulesBtn = this.add.text(width/2, height*0.72, 'ZASADY', { fontFamily:'Arial', fontSize:22, color:'#9ef01a' }).setOrigin(0.5).setInteractive({useHandCursor:true});
    rulesBtn.on('pointerdown', ()=> this.scene.start('Rules'));

    // PWA install
    const installBtn = document.createElement('button');
    installBtn.className = 'install-btn'; installBtn.textContent = 'Zainstaluj aplikację'; installBtn.hidden = true; document.body.appendChild(installBtn);
    window.addEventListener('beforeinstallprompt', (e)=>{ e.preventDefault(); this.deferredPrompt = e; installBtn.hidden = false; });
    installBtn.addEventListener('click', async ()=> { if (!this.deferredPrompt) return; this.deferredPrompt.prompt(); await this.deferredPrompt.userChoice; this.deferredPrompt = null; installBtn.hidden = true; });
  }
}
