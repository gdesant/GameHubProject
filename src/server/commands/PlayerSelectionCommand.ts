import {Command} from '@colyseus/command'
import IGameHubState from "../../types/IGameHubState";
import {Client} from "colyseus";

type Payload = {
    client: Client
    index:  number
}

export default class PlayerSelectionCommand extends Command<IGameHubState> {
    execute(data: Payload) {
        const { client, index } = data

        let clientId = 0
        this.room.state.players.forEach(pl => {
            if (pl.sessionId === client.sessionId)
                clientId = pl.id
        })

        if(clientId !== this.room.state.activePlayer) {
            return
        }
        console.log('PlayerSelection: ' + index)
    }
}
