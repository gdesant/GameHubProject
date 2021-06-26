import {CollectionSchema, Schema, type} from '@colyseus/schema'
import IPlayer from "../../types/IPlayer"
import ITexto from "../../types/ITexto";

export class Texto extends Schema implements ITexto
{

    @type("number")
    sender: number

    @type("string")
    senderSessionId: string

    @type("string")
    messageId: string

    @type("string")
    message: string

    @type("number")
    time: number

    @type("boolean")
    isBan: boolean

    @type("string")
    beforeBanMessage: string

    constructor(sender: number, senderSessionId: string, message: string) {
        super();
        this.sender = sender
        this.senderSessionId = senderSessionId
        this.message = message
        this.time = Date.now()
        this.messageId = this.senderSessionId + '_' + this.time
        this.isBan = false
        this.beforeBanMessage = message
    }
}

export default Texto
