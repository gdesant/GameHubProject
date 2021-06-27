import {Schema} from '@colyseus/schema'

export interface IPlayer extends Schema
{
    id: number
    name: string
    customName: boolean
    color: number
    sessionId: string
}

export default IPlayer
