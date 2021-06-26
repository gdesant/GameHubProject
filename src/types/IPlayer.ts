import {Schema} from '@colyseus/schema'

export interface IPlayer extends Schema
{
    id: number
    color: number
    sessionId: string
}

export default IPlayer
