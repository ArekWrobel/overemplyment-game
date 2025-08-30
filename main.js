import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import CharacterScene from './scenes/CharacterScene.js';
import DetailsScene from './scenes/DetailsScene.js';
import RulesScene from './scenes/RulesScene.js';
import GameScene from './scenes/GameScene.js';

window.__GAME_VERSION__ = '0.2.0';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#0e1014',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: 1280, height: 720 },
  physics: { default: 'arcade', arcade: { debug: false } },
  dom: { createContainer: true },
  scene: [BootScene, MenuScene, CharacterScene, DetailsScene, RulesScene, GameScene],
};

new Phaser.Game(config);
