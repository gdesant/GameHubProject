import {Client, Room} from 'colyseus.js'
import Phaser from 'phaser'
import {CollectionSchema} from "@colyseus/schema";
import {Message} from "../../types/messages";
import Player from "../../server/Player";
import IGameHubState from "../../types/IGameHubState";
import Texto from "../../server/Chat/Texto";
import {DisconnectAlertsID} from "../../types/disconnectAlerts";

export default class Server {
    private client: Client
    private events: Phaser.Events.EventEmitter

    private room?: Room<IGameHubState>
    private _playerIndex = -1
    private initChat = 0

    get playerIndex() {
        return this._playerIndex
    }

    constructor() {
        this.client = new Client('ws://localhost:2567')
        this.events = new Phaser.Events.EventEmitter()
    }

    async join() {
        this.room = await this.client.joinOrCreate<IGameHubState>('hub')

        this.room.onLeave(code => {
            var modal = document.getElementById("myModal");
            var ui = document.getElementById('UIDiv')
            if (ui !== null)
                ui.remove()

            var alert = document.getElementById('alertMSG')
            var alertplus = document.getElementById('alertMSGplus')

            if (code === DisconnectAlertsID.PlayerBanned) {
                if (alert !== null)
                    alert.innerHTML = 'You got banned from this lobby !'
                if (alertplus !== null)
                    alertplus.innerHTML = 'You can try to access another lobby !'
            }
            else {
                if (alert !== null)
                    alert.innerHTML = 'You got disconnected from this lobby !'
                if (alertplus !== null)
                    alertplus.innerHTML = 'You can try to reconnect ...'
            }


            if (modal !== null)
                modal.style.display = "block";
        })

        this.room.onMessage(Message.PlayerIndex, (message: { playerIndex: number }) => {
            this._playerIndex = message.playerIndex
            console.log(this.playerIndex)
        })

        this.room.onMessage(Message.ClientReturn, (message: { playerIndex: number, player: Player, sessionId: string, state: IGameHubState }) => {
            console.log(message.playerIndex + ' is You !')
            this.events.emit('client-return', message.playerIndex, message.player, message.sessionId, message.state)
        })



        this.room.onStateChange.once(state => {
            this.events.emit('first-state-changed', state)
        })

        this.room.onStateChange(state => {
            this.events.emit('on-state-changed', state)
        })

        //Handle Message PlayerJoin from server
        this.room.onMessage(Message.PlayerJoin, (message: { player: Player }) => {
            console.log(message.player.id +' - ('+ message.player.sessionId+ ') ' + ' has Join !')
            this.events.emit('player-join', message.player)
        })

        //Handle Changes on each player MasterSide
        this.room.state.players.onChange = (pl) => {
            pl.onChange = () => {
                this.events.emit('player-change', pl)
            }
        }

        //Handle Changes on each player PlayersSide
        this.room.state.players.onAdd = (pl) => {
            pl.onChange = () => {
                this.events.emit('player-change', pl, this.room?.state)
            }
        }

        //Handle Message PlayerLeave from server
        this.room.onMessage(Message.PlayerLeave, (message: { playerSessId: Player, state: IGameHubState}) => {
            console.log(message.playerSessId + ' has Leave !')
            this.events.emit('player-leave', message.playerSessId, message.state)
        })

        //handle chat events
        this.room.state.chat.onChange = () => {
            console.log('Chat change')
            if (this.initChat === 0 && this.room?.state.chat.messages !== undefined){

                //Declare event that declare when there is a Change of chat.messages
                this.room.state.chat.messages.onChange = (item) => {
                    console.log('Message Change')
                    this.events.emit('on-change-msg', item)
                }

                //Declare event that declare when there is an Add of chat.messages
                this.room.state.chat.messages.onAdd = (change) => {
                    console.log('Message Add')
                    this.events.emit('on-add-msg', change)
                }

                this.initChat = 1
            }
        }
    }

    leave() {
        this.room?.leave()
        this.events.removeAllListeners()
    }

//Emit Events
    //If attempt to change Player
    sendMsg(msg: string) {
        if (this.room !== undefined)
            this.room.send(Message.SendMsg, {message: msg})
    }

    //If attempt to BanMsg
    banMsg(messageId: string) {
        if (this.room !== undefined){
            this.room.send(Message.BanMsg, {messageId: messageId})
        }

    }

    //If attempt to BanPlayer
    banPlayer(playerSessionId: string) {
        if (this.room !== undefined){
            this.room.send(Message.BanPlayer, {playerSessionId: playerSessionId})
        }
    }

    tryToChangePlayerName(playerSessionId: string, newName: string) {
        if (this.room !== undefined){
            this.room.send(Message.ChangeName, {playerSessionId: playerSessionId, newName: newName})
        }
    }

//Local Events
    //Event on the connection of the client
    onClientReturn(cb: (playerIndex: number, player: Player, sessionId: string, state: IGameHubState) => void, context?: any) {
        this.events.on('client-return', cb, context)
    }


    //Event on State init
    firstStateChanged(cb: (state: IGameHubState) => void, context?: any) {
        this.events.once('first-state-changed', cb, context)
    }

    //Event on a State change
    onStateChanged(cb: (state: IGameHubState) => void, context?: any) {
        this.events.on('on-state-changed', cb, context)
    }


    //Event on sendBan
    onAddMessage(cb: (msg: Texto) => void, context?: any) {
        this.events.on('on-add-msg', cb, context)
    }

    //Event on msgBan
    onChangeMessage(cb: (msg: Texto) => void, context?: any) {
        this.events.on('on-change-msg', cb, context)
    }


    //Event when player different than the client is joining
    onPlayerJoin(cb: (player: Player) => void, context?: any) {
        this.events.on('player-join', cb, context)
    }

    onPlayerChange(cb: (player: Player, state: IGameHubState) => void, context?: any) {
        this.events.on('player-change', cb, context)
    }

    onPlayerLeave(cb: (playerSessId: string, state: IGameHubState) => void, context?: any) {
        this.events.on('player-leave', cb, context)
    }


    onMasterLaunch(cb: (players: CollectionSchema<Player>) => void, context?: any) {
        this.events.once('master-launch', cb, context)
    }

    onPlayerTurnChanged(cb: (playerIndex: number) => void, context?: any) {
        this.events.on('player-turn-changed', cb, context)
    }

    onPlayerWon(cb: (playerIndex: number) => void, context?: any) {
        this.events.on('player-win', cb, context)
    }
}
