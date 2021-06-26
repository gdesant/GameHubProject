import Phaser from 'phaser'
import {IGameHubData} from "../../types/scenes";
import {CollectionSchema} from "@colyseus/schema";
import Player from "../../server/Player";
import Server from "../services/Server";
import IGameHubState from "../../types/IGameHubState";
import GameObject = Phaser.GameObjects.GameObject;
import Container = Phaser.GameObjects.Container;
import {DataChange} from "colyseus.js";
import {Message} from "../../types/messages";
import Texto from "../../server/Chat/Texto";
import {
    createMessageDiv,
    getScrollHeightPercentage,
    initInputMessageDiv,
    initMessageDiv
} from "./components/GameHubComponentsChat";
import {createPlayerDiv} from "./components/GameHubComponentsPlayersBoard";

export default class GameHub extends Phaser.Scene {

    public hubMaxCharMessage = 100

    private clientPlayer: Player | undefined
    private server: Server | undefined
    private players: CollectionSchema<Player> | undefined
    private playersObjects: Container | undefined
    private UI: HTMLElement | undefined
    private stat: IGameHubState | undefined

    public getClient(): Player | undefined {
        return this.clientPlayer
    }

    constructor() {
        super('hub');
    }

     async create(data: IGameHubData) {
        const { server } = data

         this.UI = undefined

        this.players = new CollectionSchema<Player>()

        this.server = server

        if(!this.server) {
            throw new Error('server instance failed')
        }

        await this.server.join()

        if (this.server !== undefined) {
            this.server.onClientReturn(this.handleClientReturn, this)

            this.server.firstStateChanged(this.handleInitHub, this)
            this.server.onStateChanged(this.stateRefresh, this)

            this.server.onAddMessage(this.handleAddMessage, this)
            this.server.onChangeMessage(this.handleChangeMessage, this)

            this.server.onPlayerJoin(this.handlePlayersJoin, this)
            this.server.onPlayerChange(this.handleChangePlayer, this)
            this.server.onPlayerLeave(this.handlePlayersLeave, this)

            this.server.onMasterLaunch(this.handleMasterLaunch, this)
        }
    }

    //Refresh state when change
    private handleInitHub = (state: IGameHubState) =>{
        this.stat = state
        this.initHub(state)
    }

    private stateRefresh = (state: IGameHubState) => {
        this.stat = state
    }


    //init Hub
    private initHub(state: IGameHubState) {

        let background = this.add.rectangle(0, 0, window.innerWidth, window.innerHeight, 0x2C2C2C)
        this.UI = document.createElement('div')
        this.UI.id = 'UIDiv'

        let hubTitleDiv = document.createElement('div')
        hubTitleDiv.id = 'hubTitleDiv'

        this.UI.appendChild(hubTitleDiv)


        let middleHubDiv = document.createElement('div')
        middleHubDiv.id = 'middleHubDiv'

        this.initChat(middleHubDiv);
        this.initPlayers(middleHubDiv);

        this.UI.appendChild(middleHubDiv)

        let launchDiv = document.createElement('div')
        launchDiv.id = 'launchDiv'
        this.UI.appendChild(launchDiv)


        this.cameras.main.centerOn(0, 0)
        this.add.dom(0, 0, this.UI)
    }


    //ChatPart

    private initChat(middleHubDiv: HTMLElement) {
        let chatDiv = document.createElement('div')
        chatDiv.id = 'chatDiv'
        let messagesDiv = initMessageDiv()

        let inputDiv = initInputMessageDiv(this)
        inputDiv.id = 'inputDiv'

        chatDiv.appendChild(messagesDiv)
        chatDiv.appendChild(inputDiv)
        middleHubDiv.appendChild(chatDiv)
    }

    private handleAddMessage(msg: Texto) {
        console.log('handleAddMessage')

        let msgid = -1

        msg.onChange = (changes) => {
            this.handleChangeMessage(msg)
        }

        let parent = document.getElementById('messagesDiv')

        let messageDiv: HTMLElement = createMessageDiv(msg, this)

        let percent: number | undefined = 0

        if (parent !== null){
            percent = getScrollHeightPercentage(parent)
            parent.appendChild(messageDiv)
        }


        let messagesDiv = document.getElementById('messagesDiv')

        if (parent !== null){
            console.log(percent + ' ScrollPercent')
            if (percent !== undefined){
                if (percent > 90 || isNaN(percent)) {
                    console.log('Scroll to the bottom')
                    parent.scroll(0, parent.scrollHeight)
                }
            }
        }
    }

    private handleChangeMessage(msg: Texto) {
        console.log('Handle changeMsg')
        let message = document.getElementById('message_' + msg.messageId)
        if (message !== null){
            if (msg.isBan)
                message.innerHTML = msg.message
            else {
                message = document.getElementById('messageContentText_' + msg.messageId)
                if (message !== null)
                    message.innerHTML = msg.message
            }
        }

    }

    sendMsg(msg: string | null): number {
        console.log('Trying to SendMSG: ' + msg + 'msg.lenght: ' + msg?.length )
        if (this.server !== undefined){
            if (msg !== null && msg.length > 1 && msg.length < 101){
                this.server.sendMsg(msg)
                return 0
            }
        }
        return 1
    }

    banMsg(msgId: string): void {
        if (this.server !== undefined){
            console.log('Trying to BanMSG: ' + msgId)
            this.server.banMsg(msgId)
        }
    }

    //PlayerPart

    private initPlayers(middleHubDiv: HTMLElement) {
        let playerDiv = document.createElement('div')
        playerDiv.id = 'playerDiv'

        let playerList = document.createElement('ul')
        playerList.id = 'playerListDiv'


        playerDiv.appendChild(playerList)
        middleHubDiv.appendChild(playerDiv)
    }

    private handleAddPlayer(player: Player){

        let parent = document.getElementById('playerListDiv')

        console.log('addPlayer: playerID' + player.id + ' - sessionID: ' + player.sessionId)

        if (parent !==  null) {
            let playerDiv = createPlayerDiv(player, this)
            parent.appendChild(playerDiv)

        }
    }

    private handleRemovePlayer(playerSessId: string){
        console.log('HandleRemovePlayer: ' + playerSessId)
        let playerDiv = document.getElementById('playerDiv'+playerSessId)
        if (playerDiv !== null)
            playerDiv.remove()
    }

    private handleChangePlayer(player: Player){
        console.log('HandleChangePlayer: ' + player.sessionId)

        //Refresh Name
        let name = document.getElementById('playerName'+player.sessionId)
        if (name !== null)
            name.innerHTML = 'Player 0' + (player.id + 1).toString()

        //Refresh Avatar
        let color = document.getElementById('playerAvatar'+player.sessionId)
        if (color !== null)
            color.style.color = player.color.toString(16)

        //Remove RenameIcon
        let rename = document.getElementById('playerRename'+player.sessionId)
        if (rename !== null)
            rename.remove()



        let playerDiv = document.getElementById('playerDiv'+player.sessionId)
        if (playerDiv !== null){

            //Replace RenameIcon
            if (player.sessionId === this.clientPlayer?.sessionId || this.clientPlayer?.id === 0){
                let renameIcon = document.createElement('i')
                renameIcon.id = 'playerRename'+player.sessionId
                renameIcon.className = 'playerRename fas fa-edit'
                playerDiv.appendChild(renameIcon)

            }

        }
    }



    //Handlers

    private handlePlayersJoin(player: Player) {
        this.handleAddPlayer(player)
        console.log('PlayerJoin: ' + player.sessionId)
    }


    private handleClientReturn(playerIndex: number, player: Player, sessionId: string, state: IGameHubState) {
        this.clientPlayer = player
        this.handleAddPlayer(player)
        console.log('ClientReturn: ' + this.clientPlayer.sessionId)
    }

    private handlePlayersLeave(playerSessId: string, state: IGameHubState) {
        this.handleRemovePlayer(playerSessId)
    }

    private handleMasterLaunch(players: CollectionSchema<Player>) {
        console.log('Launch!!' + players.size.toString());
    }

}
