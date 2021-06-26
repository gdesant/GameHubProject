import Phaser from 'phaser';
import Server from '../services/Server'
import {IGameHubData} from "../../types/scenes";

export default  class Bootstrap extends Phaser.Scene {
    private server?: Server

    constructor() {
        super('bootstrap')
    }

    init() {
        this.server = new Server()
    }

    create() {
        this.createNewHub()
    }

    private createNewHub() {
        this.scene.start('hub', {
            server: this.server,
            onGameLaunch: this.handleGameLaunch
        })
    }

    private handleGameLaunch = (data: IGameHubData) => {
        console.log('next')
    }

}
