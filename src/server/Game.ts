import {Client, Room} from 'colyseus'
import { Dispatcher} from "@colyseus/command";
import GameHubState from './GameHubState';
import Player from "./Player";
import {Message} from "../types/messages";
import PlayerSelectionCommand from "./commands/PlayerSelectionCommand";
import SendMessageCommand from "./commands/SendMessage";
import BanMessage from "./commands/BanMessage";

export default class Game extends Room<GameHubState>
{
    private dispatcher = new Dispatcher(this)
    private  stat = new GameHubState()

    onCreate() {
        this.maxClients = 10
        this.setState(this.stat)

        this.onMessage(Message.PlayerSelection, (client, message: { index: number }) => {
            this.dispatcher.dispatch(new PlayerSelectionCommand(), {
                client,
                index: message.index
            })
        })

        this.onMessage(Message.SendMsg, (client, message: { message: string }) => {
            this.dispatcher.dispatch(new SendMessageCommand(), {
                client,
                message: message.message
            })
        })

        this.onMessage(Message.BanMsg, (client, message: { messageId: string }) => {
            console.log('redirecting ban mesg')
            this.dispatcher.dispatch(new BanMessage(), {
                client,
                state: this.state,
                messageId: message.messageId
            })
        })

    }

    onJoin(client: Client): void | Promise<any> {
        let id = -1
        this.state.players.forEach(pl => {
            if (pl.sessionId == client.sessionId)
                id = pl.id
        })
        if (id === -1){
            id = this.state.players.size
            this.state.players.add(new Player(id, client.sessionId, Player.playersColors[id]))
        }
        client.send(Message.PlayerJoin, { playerIndex: id, player: this.state.players.at(id), sessionId: client.sessionId, state: this.state})
    }

    onLeave(client: Client): void | Promise<any> {
        let id = -1
        this.state.players.forEach(pl => {
            if (pl.sessionId == client.sessionId)
                id = pl.id
        })
        console.log('Client leave id: ' + id + ' sessionID: ' + client.sessionId +' ! client size: ' + this.state.players.size)
        if (this.state.players.at(id) !== undefined){
            console.log('delete player: ' + id + ' !')
            this.state.players.delete(<Player>this.state.players.at(id))
            if (id !==  this.state.players.size){
                this.state.players.forEach(pl => {
                    if (pl.id > id) {
                        pl.id = pl.id - 1
                        if (pl.color === Player.playersColors[pl.id + 1])
                            pl.color = Player.playersColors[pl.id]
                    }
                })
            }
            console.log('client size: ' + this.state.players.size)
        }
        this.clients.forEach(cli => {
            cli.send(Message.PlayerLeave, { playerIndex: id, state: this.stat})
        })


    }
}
