import {CollectionSchema, Schema} from '@colyseus/schema'
import Texto from "../server/Chat/Texto";
import Player from "../server/Player";

export interface IChat extends Schema
{
    initTime: number
    messages: CollectionSchema<Texto>

    addMessage(sender: Player, message: string): void;
    getMessageById(messageId: string): Texto | undefined;
}

export default IChat
