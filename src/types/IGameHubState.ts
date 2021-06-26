import { Schema, CollectionSchema } from '@colyseus/schema'
import Player from "../server/Player";
import Texto from "../server/Chat/Texto";
import Chat from "../server/Chat/Chat";


export enum GameState
{
	WaitingForPlayers,
	Playing,
	Finished
}

export interface IGameHubState extends Schema
{
	activeState: number
	activePlayer: number
	players: CollectionSchema<Player>
	chat: Chat

	getPlayerBySessionId(sessionId: string): Player | undefined;
	getPlayerById(id: number): Player |undefined;
}

export default IGameHubState

