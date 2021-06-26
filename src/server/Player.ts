import {CollectionSchema, Schema, type} from '@colyseus/schema'
import IPlayer from "../types/IPlayer"

export class Player extends Schema implements IPlayer
{

    public static playersColors:number[] = [0x4AC6B7, 0x4F5E7F, 0x965F8A, 0xFF7070];


    @type("number")
    id: number

    @type("string")
    sessionId: string

    @type("number")
    color: number

    constructor(id: number, sessionId: string,color: number) {
        super();
        this.id = id
        this.sessionId = sessionId
        this.color = color
    }
}

export default Player
