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
        this.initHub()
        if (this.server !== undefined) {
            this.server.onStateChanged(this.handleInitHub, this)
            this.server.onAddMessage(this.handleAddMessage, this)
            this.server.onChangeMessage(this.handleChangeMessage, this)
            this.server.onPlayerJoin(this.handlePlayersJoin, this)
            this.server.onPlayerLeave(this.handlePlayersLeave, this)
            this.server.onMasterLaunch(this.handleMasterLaunch, this)
        }
    }

    private handleInitHub = (state: IGameHubState) =>{
       this.iniHub(state)
    }


    private iniHub(state: IGameHubState){
        this.stat = state
        let background = this.add.rectangle(0, 0, window.innerWidth, window.innerHeight, 0x2C2C2C)
        /*
        let title = this.add.text(-30, -200, "Hub", {
            fontSize: '40px'
        })
        //this.initPlayerBoard(state)*/
        if (state.players !== undefined){
            if (state.players.at(0) !== undefined){
                console.log("You are the master")
                const player = <Player>state.players.at(0)
            }
            else
                console.log("you are not the master !")
        }
        this.cameras.main.centerOn(0, 0)
    }

    private initPlayerBoard(state: IGameHubState){
        //fill playerElements
        this.playersObjects = this.add.container()
        let playerMark
        let playerName
        let playerColor
        state.players.forEach(player => {
            if (player.id == this.clientPlayer?.id) {
                playerMark = this.add.rectangle(4, -160 + (30*player.id) + 25/2, 165, 27, 0xDCDCDC)
                playerMark.id = 'playerMark'
                playerName = this.add.text(-40, -160 + (30*player.id), 'Player ' + player.id.toString(), {
                    fontSize: '25px',
                    color: '#2C2C2C'
                })
                this.playersObjects?.add(playerMark)

            } else{
                playerName = this.add.text(4, -160 + (30*player.id), 'Player ' + player.id.toString(), {
                    fontSize: '25px',
                    color: '#DCDCDC'
                })
            }
            playerName.id = 'playerName_' + player.id
            playerColor = this.add.rectangle(-65, -160 + (30*player.id) + 25/2, 25, 25, player.color)
            playerColor.id = 'playerColor_' + player.id
            this.playersObjects?.add(playerName)
            this.playersObjects?.add(playerColor)
        })
    }

    private initHub() {
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
        middleHubDiv.appendChild(playerDiv)
    }



    //Handlers

    private handlePlayersJoin(playerIndex: number, player: Player, sessionId: string, state: IGameHubState) {
        this.clientPlayer = player
        console.log('HandleSessionId: ' + this.clientPlayer.sessionId)
    }

    private handlePlayersLeave(playerIndex: number, state: IGameHubState) {
        console.log('PlayerLeave: ' + playerIndex)
    }

    private handleMasterLaunch(players: CollectionSchema<Player>) {
        console.log('Launch!!' + players.size.toString());
    }
}
