import 'regenerator-runtime/runtime'
import Phaser from 'phaser'

import Bootstrap from './scenes/Bootstrap'
import GameHub from "./scenes/GameHub";


const config: Phaser.Types.Core.GameConfig = {
	type: Phaser.CANVAS,
	width: window.innerWidth,
	height: window.innerHeight,
	parent: 'phaser-container',
	dom: {
		createContainer: true
	},
	physics: {
		default: 'arcade',
		arcade: {
			debug: true,
		}
	},
	scene: [Bootstrap, GameHub]
}

export default new Phaser.Game(config)
