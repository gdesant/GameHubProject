import Phaser from 'phaser'
import {IGameHubData} from "../../types/scenes";
import {CollectionSchema} from "@colyseus/schema";
import Player from "../../server/Player";
import Server from "../services/Server";
import IGameHubState from "../../types/IGameHubState";
import Texto from "../../server/Chat/Texto";
import {
    createMessageDiv,
    getScrollHeightPercentage,
    initInputMessageDiv,
    initMessageDiv, scrollToBottom
} from "./components/GameHubComponentsChat";
import {createPlayerDiv, refreshPlayerDiv} from "./components/GameHubComponentsPlayersBoard";

export default class GameHub extends Phaser.Scene {

    public hubMaxCharMessage = 100

    private clientPlayer: Player | undefined
    private server: Server | undefined
    private players: CollectionSchema<Player> | undefined
    private UI: HTMLElement | undefined
    private stat: IGameHubState | undefined
    private oldId: number | undefined

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

        this.initChat(state, middleHubDiv);
        this.initPlayers(middleHubDiv);

        this.UI.appendChild(middleHubDiv)

        let launchDiv = document.createElement('div')
        launchDiv.id = 'launchDiv'
        this.UI.appendChild(launchDiv)


        this.cameras.main.centerOn(0, 0)
        this.add.dom(0, 0, this.UI)
        // @ts-ignore
        this.UI.parentElement.setAttribute('style', this.UI.parentElement.getAttribute('style'))
    }


    //ChatPart

    private initChat(state: IGameHubState, middleHubDiv: HTMLElement) {
        let chatDiv = document.createElement('div')
        chatDiv.id = 'chatDiv'
        let messagesDiv = initMessageDiv(state, this)

        let inputDiv = initInputMessageDiv(this)
        inputDiv.id = 'inputDiv'

        chatDiv.appendChild(messagesDiv)
        chatDiv.appendChild(inputDiv)
        middleHubDiv.appendChild(chatDiv)
    }

    private handleAddMessage(msg: Texto) {
        console.log('handleAddMessage')

        msg.onChange = () => {
            this.handleChangeMessage(msg)
        }

        let parent = document.getElementById('messagesDiv')

        let messageDiv: HTMLElement = createMessageDiv(msg, this)

        let percent: number | undefined = 0

        if (parent !== null){
            percent = getScrollHeightPercentage(parent)
            parent.appendChild(messageDiv)
        }

        scrollToBottom(parent, percent)


        let messagesDiv = document.getElementById('messagesDiv')
    }

    private handleChangeMessage(msg: Texto) {
        console.log('Handle changeMsg')
        let message = document.getElementById('message_' + msg.messageId)
        if (message !== null){
            if (msg.isBan)
                message.innerHTML = msg.message
            else {
                let playerTag = document.getElementById('playerTag_' + msg.messageId)
                message = document.getElementById('messageContentText_' + msg.messageId)
                if (message !== null)
                    message.innerHTML = msg.message
                if (playerTag !== null)
                    playerTag.innerHTML = msg.sender
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

    private initPlayerDivs(players: CollectionSchema<Player>){
        if (players !== undefined){
            players.forEach(player => {
                this.handleAddPlayer(player)
            })
        }
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

    private handleChangePlayer(player: Player, state: IGameHubState){
        if (player.sessionId === this.clientPlayer?.sessionId){
            console.log('HandleChangeClient: ' + player.name + ' | NewId === ' + player.id )
            this.clientPlayer = player
            if (player.id === 0 && this.oldId !== 0){
                this.UI?.remove()
                if (this.stat !== undefined){
                    this.initHub(state)
                    this.initPlayerDivs(state.players)
                }
                console.log('You are now the master')
            }else {
                refreshPlayerDiv(player, this)
            }
            this.oldId = player.id
        }else {
            console.log('HandleChangePlayer: ' + player.name )
            refreshPlayerDiv(player, this)
        }
    }

    banPlayer(playerSessionId: string): void {
        if (this.server !== undefined){
            console.log('Trying to Kick: ' + playerSessionId)
            this.server.banPlayer(playerSessionId)
        }
    }

    tryToChangeName(playerSessionId: string, newName: string): void {
        if (this.server !== undefined){
            console.log('Trying to Kick: ' + playerSessionId)
            this.server.tryToChangePlayerName(playerSessionId, newName)
        }
    }

    //Handlers

    private handlePlayersJoin(player: Player) {
        this.handleAddPlayer(player)
        console.log('PlayerJoin: ' + player.sessionId)
    }


    private handleClientReturn(playerIndex: number, player: Player, sessionId: string, state: IGameHubState) {
        this.clientPlayer = player
        this.initPlayerDivs(state.players)
        this.oldId = player.id
        console.log('ClientReturn: ' + this.clientPlayer.sessionId)
    }

    private handlePlayersLeave(playerSessId: string, state: IGameHubState) {
        this.handleRemovePlayer(playerSessId)
    }

    private handleMasterLaunch(players: CollectionSchema<Player>) {
        console.log('Launch!!' + players.size.toString());
    }

}
