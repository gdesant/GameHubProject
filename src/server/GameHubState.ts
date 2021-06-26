import {CollectionSchema, MapSchema, Schema, type} from '@colyseus/schema'
import Player from "./Player";
import IGameHubState, {GameState} from "../types/IGameHubState";
import Texto from "./Chat/Texto";
import Chat from "./Chat/Chat";

export default class GameHubState extends Schema implements IGameHubState {


  @type("number")
  activeState: number

  @type("number")
  activePlayer: number

  @type( {collection: Player} )
  players: CollectionSchema<Player>

  @type( Chat )
  chat: Chat

  constructor() {
    super()
    this.activePlayer = 0
    this.activeState = 0
    this.players = new CollectionSchema<Player>()
    this.chat= new Chat()

  }

  getPlayerById(id: number): Player | undefined{
    this.players.forEach(pl => {
      if (pl.id === id)
        return pl
    })
    return undefined
  }

  getPlayerBySessionId(sessionId: string): Player | undefined{
    this.players.forEach(pl => {
      if (pl.sessionId == sessionId)
        return pl
    })
    return undefined
  }

}

