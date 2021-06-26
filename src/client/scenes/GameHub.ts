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

export default class GameHub extends Phaser.Scene {

    private hubMaxCharMessage = 100

    private clientPlayer: Player | undefined
    private server: Server | undefined
    private players: CollectionSchema<Player> | undefined
    private playersObjects: Container | undefined
    private UI: HTMLElement | undefined
    private stat: IGameHubState | undefined

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
            this.server.firstStateChanged(this.handleInitHub, this)
            this.server.onStateChanged(this.stateRefresh, this)
            this.server.onAddMessage(this.handleAddMessage, this)
            this.server.onChangeMessage(this.handleChangeMessage, this)
            this.server.onPlayerJoin(this.handlePlayersJoin, this)
            this.server.onPlayerLeave(this.handlePlayersLeave, this)
            this.server.onMasterLaunch(this.handleMasterLaunch, this)
        }
    }

    //Refresh state when change
    private handleInitHub = (state: IGameHubState) =>{
        this.stat = state
        this.stat.players.onAdd = (change) => {
            console.log('Add Player')
            this.handleAddPlayer(change)
        }
        this.initHub(state)
        this.stat.players.onRemove = (change) => {
            console.log('Remove Player')
            this.handleRemovePlayer(change)
        }
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

        let messagesDiv = this.initMessageDiv()

        let inputDiv = this.initInputMessageDiv()
        inputDiv.id = 'inputDiv'

        chatDiv.appendChild(messagesDiv)
        chatDiv.appendChild(inputDiv)
        middleHubDiv.appendChild(chatDiv)
    }

    private initMessageDiv(): HTMLElement {
        let messagesDiv = document.createElement('ul')
        messagesDiv.id = 'messagesDiv'
        return messagesDiv
    }

    private initInputMessageDiv(): HTMLElement {
        let inputDiv = document.createElement('div')
        inputDiv.className = "control"
        inputDiv.id = 'inputDiv'

        let spanIco = document.createElement('span')
        let input = document.createElement('textarea')
        input.id = 'messageInput'
        input.placeholder = "Message ..."
        input.maxLength = this.hubMaxCharMessage;

        input.addEventListener("keyup", function(event) {
            if (event.keyCode === 13) {
                event.preventDefault();
                spanIco.click();
            }
        })


        spanIco.className = "icon"
        spanIco.id = 'spawnIcoMsg'
        let slf = this
        spanIco.onclick = function () {
            if (!slf.sendMsg(input.value))
                input.value = ""
        }


        let sendIco = document.createElement('i')
        sendIco.className = "fas fa-paper-plane"


        spanIco.appendChild(sendIco)
        inputDiv.appendChild(input)
        inputDiv.appendChild(spanIco)

        return inputDiv
    }

    private handleAddMessage(msg: Texto) {
        console.log('handleAddMessage')

        let msgid = -1

        msg.onChange = (changes) => {
            this.handleChangeMessage(msg)
        }


        let parent = document.getElementById('messagesDiv')

        if (parent === null)
            return undefined
        let messageDiv = document.createElement('li')
        messageDiv.id = 'message_'+ msg.messageId
        messageDiv.className = 'messageDiv'

        if (this.clientPlayer?.id === 0) {
            let messageBan = document.createElement('i')
            messageBan.className = 'fas fa-ban'
            messageBan.id = 'messageBan'



            let slf = this
            messageBan.onclick = function () {
                slf.banMsg(msg.messageId)
            }
            messageDiv.appendChild(messageBan)
        }

        let player = document.createElement('div')
        player.className = 'messagePlayer'

        let playerTag = document.createElement('div')
        playerTag.id = 'playerTag'
        playerTag.innerHTML = 'Player ' + msg.sender
        player.appendChild(playerTag)

        if (this.clientPlayer?.id === 0){
            let playerSessid = document.createElement('div')
            playerSessid.id = 'playerSessid'
            playerSessid.innerHTML += '('+ msg.senderSessionId+')'
            player.appendChild(playerSessid)
        }

        let messageContent = document.createElement('div')
        messageContent.className = 'messageContent'

        let message = document.createElement('p')
        message.className = 'messageContentText'
        message.id = 'messageContentText_' + msg.messageId
        message.innerHTML = msg.message

        messageContent.appendChild(message)




        messageDiv.appendChild(player)
        messageDiv.appendChild(messageContent)

        parent.appendChild(messageDiv)

        parent.appendChild(messageDiv)
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

    private sendMsg(msg: string | null): number {
        console.log('Trying to SendMSG: ' + msg)
        if (this.server !== undefined){
            if (msg !== null && msg.length > 0 && msg.length < 101){
                this.server.sendMsg(msg)
                return 0
            }
        }
        return 1
    }

    private banMsg(msgId: string): void {
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

        if (parent !==  null) {
            let playerDiv = document.createElement('li')
            playerDiv.id = 'playerDiv'+player.sessionId
            playerDiv.className = "playerCell"

            if (this.clientPlayer?.id === 0) {
                let banIcon = document.createElement('i')
                banIcon.id = 'playerBan'+player.sessionId
                banIcon.className = 'playerBan fas fa-user-alt-slash'
                playerDiv.appendChild(banIcon)
            }

            let colorIcon = document.createElement('i')
            colorIcon.id = 'playerAvatar'+player.sessionId
            colorIcon.className = 'playerAvatar fas fa-user-circle'
            colorIcon.style.color = player.color.toString(16)
            playerDiv.appendChild(colorIcon)

            let name = document.createElement('h1')
            name.id = 'playerName'+player.sessionId
            name.className = 'playerName'
            name.innerHTML = 'Player 0' + player.id
            playerDiv.appendChild(name)

            if (player.sessionId === this.clientPlayer?.sessionId || this.clientPlayer?.id === 0){
                let renameIcon = document.createElement('i')
                renameIcon.id = 'playerRename'+player.sessionId
                renameIcon.className = 'playerRename fas fa-edit'
                playerDiv.appendChild(renameIcon)

            }

            player.onChange = (changes) => {
                this.handleChangePlayer(player)
            }

            parent.appendChild(playerDiv)

        }
    }

    private handleRemovePlayer(player: Player){

    }

    private handleChangePlayer(player: Player){

    }



    //Handlers

    private handlePlayersJoin(playerIndex: number, player: Player, sessionId: string, state: IGameHubState) {
        this.clientPlayer = player
        console.log('HandleSessionId: ' + this.clientPlayer.sessionId)
    }


    private handleClientJoin

    private handlePlayersLeave(playerIndex: number, state: IGameHubState) {
        console.log('PlayerLeave: ' + playerIndex)
    }

    private handleMasterLaunch(players: CollectionSchema<Player>) {
        console.log('Launch!!' + players.size.toString());
    }
}
