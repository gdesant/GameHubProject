import {Client, Room} from 'colyseus'
import { Dispatcher} from "@colyseus/command";
import GameHubState from './GameHubState';
import Player from "./Player";
import {Message} from "../types/messages";
import PlayerSelectionCommand from "./commands/PlayerSelectionCommand";
import SendMessageCommand from "./commands/SendMessage";
import BanMessage from "./commands/BanMessage";
import {DisconnectAlertsID} from "../types/disconnectAlerts";

export default class Game extends Room<GameHubState>
{
    private dispatcher = new Dispatcher(this)
    private  stat = new GameHubState()
    private playerBanned: string[] | undefined

    onCreate() {
        this.maxClients = 10
        this.setState(this.stat)

        //Declare event attemptToSendPlayerSelection
        this.onMessage(Message.PlayerSelection, (client, message: { index: number }) => {
            this.dispatcher.dispatch(new PlayerSelectionCommand(), {
                client,
                index: message.index
            })
        })

        //Declare event attemptToSendMsg
        this.onMessage(Message.SendMsg, (client, message: { message: string }) => {
            this.dispatcher.dispatch(new SendMessageCommand(), {
                client,
                message: message.message
            })
        })

        //Declare event attemptToBanMSG
        this.onMessage(Message.BanMsg, (client, message: { messageId: string }) => {
            console.log('redirecting ban mesg')
            this.dispatcher.dispatch(new BanMessage(), {
                client,
                state: this.state,
                messageId: message.messageId
            })
        })

        //Declare event attemptToBanPlayer
        this.onMessage(Message.BanPlayer, (client, message: { playerSessionId: string }) => {
            console.log('redirecting ban player: ' + message.playerSessionId)
            if (client.sessionId === this?.state?.players?.at(0)?.sessionId && message.playerSessionId !== client.sessionId)
                this.banPlayer(message.playerSessionId)
        })

    }

    private banPlayer(sessionId: string) {
        console.log('Ban Player: ' + sessionId)
        this.clients.forEach(client => {
            if (client.sessionId === sessionId) {
                this.playerBanned?.push(sessionId)
                console.log('BanSure Player: ' + sessionId)
                client.leave(DisconnectAlertsID.PlayerBanned, 'You got banned by player_' + sessionId)
            }
        })
    }

    async onAuth(client: Client) {
        this.playerBanned?.forEach(pl => {
            if (pl === client.sessionId)
                throw new Error("You are banned from this lobby !");
        })
        return client
    }

    onJoin(client: Client): void | Promise<any> {
        let player: Player | undefined

        //Check if player has already make a connection
        this.state.players.forEach(pl => {
            if (pl.sessionId == client.sessionId)
                player = pl
        })

        //If first connection of the client, create client Player Object
        if (player === undefined){
            let id = this.state.players.size
            player = new Player(id, client.sessionId, Player.playersColors[id])
            console.log('Client Join id: ' + player.id + ' sessionID: ' + player.sessionId +' ! client size: ' + this.state.players.size.toString() + ' --> ' + (this.state.players.size+1).toString())
            this.state.players.add(player)
        }

        //Send Players Connected before the client initial connection
        this.state.players.forEach(pl => {
            // @ts-ignore
            if (pl.id < player?.id) {
                client.send(Message.PlayerJoin, {player: pl})
            }
        })

        //Send Client Info to the client at the initial connection
        client.send(Message.ClientReturn, { playerIndex: player.id, player: player, sessionId: client.sessionId, state: this.state})


        //Send Players Connected after the client initial connection
        this.state.players.forEach(pl => {
            // @ts-ignore
            if (pl.id > player?.id) {
                client.send(Message.PlayerJoin, {player: pl})
            }
        })


        //Alert Other Client of the Connection
        this.clients.forEach(cli => {
            if (cli.sessionId !== client.sessionId)
                cli.send(Message.PlayerJoin, {player: player})
        })
    }

    onLeave(client: Client): void | Promise<any> {
        let id = -1
        let pl: Player | undefined

        //Looking for the player in the State.Players
        this.state.players.forEach(player => {
            if (player.sessionId === client.sessionId){
                id = player.id
                pl = player
            }

        })

        //Check if player is registered
        if (pl !== undefined && id !== -1){

            const sess = pl.sessionId
            //Log the disconnection
            console.log('Client leave id: ' + id + ' sessionID: ' + client.sessionId + ' ! client size: ' + this.state.players.size.toString() + ' --> ' + (this.state.players.size-1).toString())


            //Alerting other client that the player has disconect
            this.clients.forEach(cli => {
                if (cli !== client)
                    cli.send(Message.PlayerLeave, { playerSessId: sess, state: this.stat})
            })

            //Delete the player
            this.state.players.delete(<Player>this.state.players.at(id))

            //Refreshing other Player id/color
            if (id !==  this.state.players.size){
                this.state.players.forEach(pl => {
                    if (pl.id > id) {
                        pl.id = pl.id - 1
                        if (pl.color === Player.playersColors[pl.id + 1])
                            pl.color = Player.playersColors[pl.id]
                    }
                })
            }

        }

    }
}
