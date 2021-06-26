import {CollectionSchema, Schema, type} from '@colyseus/schema'
import IPlayer from "../../types/IPlayer"
import IChat from "../../types/IChat";
import Texto from "./Texto";
import Player from "../Player";

export class Chat extends Schema implements IChat
{

    public static messagesMaxCount = 10

    @type('number')
    initTime: number

    @type('number')
    chatSize: number

    @type({collection: Texto})
    messages: CollectionSchema<Texto>

    constructor() {
        super();
        this.initTime = Date.now()
        this.messages = new CollectionSchema<Texto>()
        this.chatSize = 0
    }

    addMessage(sender: Player, message: string) {
        this.messages.add(new Texto(sender.id, sender.sessionId, message))
        this.chatSize++
    }

    getMessageById(messageId: string): Texto | undefined{
        this.messages.forEach(msg => {
            if (msg.messageId === messageId)
                return msg
        })
        return undefined
    }

}

export default Chat
