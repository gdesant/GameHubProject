import Texto from "../../../server/Chat/Texto";
import GameHub from "../GameHub";

export function getScrollHeightPercentage(messagesDiv: HTMLElement) {
    var h = messagesDiv,
        b = document.body,
        st = 'scrollTop',
        sh = 'scrollHeight';
    if (b !== null && h !== null)
        return (h[st] || b[st]) / ((h[sh] || b[sh]) - h.clientHeight) * 100;
    else
        return undefined
}

export function scrollToBottom(parent:HTMLElement | null, percent: number | undefined){
    if (parent !== null){
        if (percent !== undefined){
            if (percent > 85 || isNaN(percent)) {
                parent.scroll(0, parent.scrollHeight)
            }
        }
    }
}

export function initMessageDiv(): HTMLElement {
    let messagesDiv = document.createElement('ul')
    messagesDiv.id = 'messagesDiv'
    return messagesDiv
}


 export function createMessageDiv(msg: Texto, slf: GameHub): HTMLElement {
    let messageDiv = document.createElement('li')
    messageDiv.id = 'message_' + msg.messageId
    messageDiv.className = 'messageDivOther'

    let type = 0

    if (msg.senderSessionId === slf.getClient()?.sessionId) {
        type = 1
        messageDiv.className = 'messageDivMe'
    }


    if (slf.getClient()?.id === 0 && type === 0) {
        messageBan(msg, slf, messageDiv)
    }

    messagePlayer(msg, slf, messageDiv, type)
    messageContent(msg, slf, messageDiv, type)

    return messageDiv
}

function messageBan(msg: Texto, slf: GameHub, parent: HTMLElement): void {
    let messageBan = document.createElement('i')
    messageBan.className = 'messageBan fas fa-ban'
    messageBan.id = 'messageBan' + msg.messageId

    messageBan.onclick = function () {
        slf.banMsg(msg.messageId)
    }

    parent.appendChild(messageBan)
}

function messagePlayer(msg: Texto, slf: GameHub, parent: HTMLElement, type: number): void {
    let player = document.createElement('div')
    player.className = 'messagePlayer'

    if (msg.senderSessionId !== slf.getClient()?.sessionId && slf.getClient()?.id === 0)
        player.className += '_noleft'

    let playerTag = document.createElement('div')
    playerTag.id = 'playerTag'
    playerTag.innerHTML = 'Player ' + msg.sender
    player.appendChild(playerTag)

    if (slf.getClient()?.id === 0) {
        let playerSessid = document.createElement('div')
        playerSessid.className = 'playerSessid'
        playerSessid.id = 'playerSessid' + msg.senderSessionId
        playerSessid.innerHTML += '(' + msg.senderSessionId + ')'
        player.appendChild(playerSessid)
    }
    parent.appendChild(player)
}

function messageContent(msg: Texto, slf: GameHub, parent: HTMLElement, type: number): void {
    let messageContent = document.createElement('div')
    messageContent.className = 'messageContent'

    let message = document.createElement('p')
    message.className = 'messageContentText'
    message.id = 'messageContentText_' + msg.messageId
    message.innerHTML = msg.message

    messageContent.appendChild(message)
    parent.appendChild(messageContent)
}


function createOtherMessageDiv(msg: Texto) {

}

function createMeMessageDiv(msg: Texto) {

}

export function initInputMessageDiv(slf: GameHub): HTMLElement {
    let inputDiv = document.createElement('div')
    inputDiv.className = "control"
    inputDiv.id = 'inputDiv'

    let spanIco = document.createElement('span')
    let input = document.createElement('textarea')
    input.id = 'messageInput'
    input.placeholder = "Message ..."
    input.maxLength = slf.hubMaxCharMessage;

    let shift = 0

    input.addEventListener("keydown", function(event) {
        if (event.shiftKey === true)
            shift = event.keyCode
    })

    let blured = 0

    input.onfocus = function (){
        if (blured === 0){
            input.blur()
            let parent = document.getElementById('messagesDiv')

            let percent: number | undefined = 0
            if (parent !== null){
                percent = getScrollHeightPercentage(parent)
                blured = 1
                input.focus()
                scrollToBottom(parent, percent)
                if (blured === 1)
                    input.onblur = function () {blured = 0}
            }
        }
    }

    input.addEventListener("keyup", function (event){
        if (event.keyCode === shift)
            shift = 0
    })

    input.addEventListener("keydown", function(event) {
        if (event.keyCode === 13 && shift === 0) {
            event.preventDefault();
            spanIco.click();
        }
    })

    spanIco.className = "icon"
    spanIco.id = 'spawnIcoMsg'

    spanIco.onclick = function () {
        slf.sendMsg(input.value.replace(/(^[ \t]*\n)/gm, ""))
        input.value = ""
        input.disabled = true
        input.disabled = false
}


let sendIco = document.createElement('i')
sendIco.className = "fas fa-paper-plane"


spanIco.appendChild(sendIco)
inputDiv.appendChild(input)
inputDiv.appendChild(spanIco)

return inputDiv
}


