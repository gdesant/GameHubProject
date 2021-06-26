import {Command} from '@colyseus/command'
import IGameHubState from "../../types/IGameHubState";
import {Client} from "colyseus";
import Player from "../Player";

type Payload = {
    client: Client
    message: string
}

export default class SendMessageCommand extends Command<IGameHubState> {
    execute(data: Payload) {
        const { client, message } = data

        let player: Player | undefined

        this.room.state.players.forEach(pl => {
            if (pl.sessionId === client.sessionId)
                player = pl
        })

        if (player !== undefined) {
            this.room.state.chat.addMessage(player, message)
            console.log('Player: '+ player.id + ' send the message: ' + message)
        }
    }
}
