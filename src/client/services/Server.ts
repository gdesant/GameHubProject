import {Client, DataChange, Room} from 'colyseus.js'
import Phaser from 'phaser'
import {CollectionSchema} from "@colyseus/schema";
import {Message} from "../../types/messages";
import Player from "../../server/Player";
import IGameHubState from "../../types/IGameHubState";
import Texto from "../../server/Chat/Texto";

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

        this.room.onMessage(Message.PlayerIndex, (message: { playerIndex: number }) => {
            this._playerIndex = message.playerIndex
            console.log(this.playerIndex)
        })

        this.room.onMessage(Message.PlayerJoin, (message: { playerIndex: number, player: Player, sessionId: string, state: IGameHubState }) => {
            console.log(message.playerIndex + ' has Join !')
            this.events.emit('player-join', message.playerIndex, message.player, message.sessionId, message.state)
        })

        this.room.onMessage(Message.PlayerLeave, (message: { playerIndex: number, state: IGameHubState}) => {
            console.log(message.playerIndex+ ' has Leave !')
            this.events.emit('player-leave', message.playerIndex, message.state)
        })

        this.room.onStateChange.once(state => {
            this.events.emit('first-state-changed', state)
        })

        this.room.onStateChange(state => {
            this.events.emit('on-state-changed', state)
        })

        this.room.state.players.onAdd = (changes) => {
        }

        this.room.state.chat.onChange = (changes) => {
            console.log('Chat change')
            if (this.initChat === 0 && this.room?.state.chat.messages !== undefined){
                this.room.state.chat.messages.onChange = (item, key) => {
                    console.log('Message Change')
                    this.events.emit('on-ban-msg', item)
                }
                this.room.state.chat.messages.onAdd = (change) => {
                    console.log('Message Add')
                    this.events.emit('on-add-msg', change)
                }
                this.initChat = 1
            }
        }

       // this.room.state.board.onAdd = (cell, key) => {
            //console.log('cell added', cell, key)
        //}
    }

    makeSelection(id: number) {
        if(!this.room) {
            return
        }

        if(this.playerIndex !== this.room.state.activePlayer) {
            console.warn('this is not your turn')
            return
        }

        this.room.send(Message.PlayerSelection, {index: id})
    }

    leave() {
        this.room?.leave()
        this.events.removeAllListeners()
    }

    //Emit Events
    sendMsg(msg: string) {
        if (this.room !== undefined)
            this.room.send(Message.SendMsg, {message: msg})
    }

    banMsg(messageId: string) {
        if (this.room !== undefined){
            this.room.send(Message.BanMsg, {messageId: messageId})
        }

    }


    //Local Events
    onAddMessage(cb: (msg: Texto) => void, context?: any) {
        this.events.on('on-add-msg', cb, context)
    }

    onChangeMessage(cb: (msg: Texto) => void, context?: any) {
        this.events.on('on-ban-msg', cb, context)
    }

    firstStateChanged(cb: (state: IGameHubState) => void, context?: any) {
        this.events.once('first-state-changed', cb, context)
    }

    onStateChanged(cb: (state: IGameHubState) => void, context?: any) {
        this.events.on('on-state-changed', cb, context)
    }

    onPlayerJoin(cb: (playerIndex: number, player: Player, sessionId: string, state: IGameHubState) => void, context?: any) {
        this.events.on('player-join', cb, context)
    }

    onPlayerLeave(cb: (playerIndex: number, state: IGameHubState) => void, context?: any) {
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
