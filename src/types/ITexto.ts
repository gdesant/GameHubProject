import {Schema} from '@colyseus/schema'

export interface ITexto extends Schema
{
    sender: number
    senderSessionId: string
    message: string
    time: number
    messageId: string
    isBan: boolean
    beforeBanMessage: string
}

export default ITexto
