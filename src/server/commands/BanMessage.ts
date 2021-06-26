import {Command} from '@colyseus/command'
import IGameHubState from "../../types/IGameHubState";
import {Client} from "colyseus";
import Player from "../Player";
import GameHubState from "../GameHubState";
import Texto from "../Chat/Texto";

type Payload = {
    client: Client
    state: GameHubState
    messageId:  string
}

export default class BanMessage extends Command<IGameHubState> {
    execute(data: Payload) {
        const { client, state, messageId } = data

        let player: Player | undefined

        this.room.state.players.forEach(pl => {
            if (pl.sessionId === client.sessionId)
                player = pl
        })

        console.log('Hello ban server Pl_Id: ' + player?.id + ' | sessionId: '+ client.sessionId)
        if (player !== undefined && player.sessionId === client.sessionId) {
            console.log('Hello ban server 2')
            let msg: Texto | undefined
            this.room.state.chat.messages.forEach(message => {
                if (messageId == message.messageId)
                    msg = message
            })
            if (msg !== undefined) {
                msg.message = 'Deleted by Player_' + player.id
                msg.isBan = true
                console.log('msg: ' + msg.messageId + ' has been ban by Player: ' + client.sessionId)
            }
            this.room.state.chat.messages.forEach(message => {
                if (messageId == message.messageId && msg !== undefined)
                    message = msg
            })

        }

    }
}
