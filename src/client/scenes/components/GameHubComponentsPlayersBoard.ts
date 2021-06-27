import Player from "../../../server/Player";
import GameHub from "../GameHub";

export function createPlayerDiv(player: Player, slf: GameHub) {
    let playerDiv = document.createElement('li')
    playerDiv.id = 'playerDiv'+player.sessionId
    playerDiv.className = "playerCell"

    if (slf.getClient()?.id === 0 && player.id !== 0) {
        let banIcon = document.createElement('i')
        banIcon.id = 'playerBan'+player.sessionId
        banIcon.className = 'playerBan fas fa-user-alt-slash'

        banIcon.onclick = function (){
            slf.banPlayer(player.sessionId)
        }

        playerDiv.appendChild(banIcon)
    }

    let colorIcon = document.createElement('i')
    colorIcon.id = 'playerAvatar'+player.sessionId
    colorIcon.className = 'playerAvatar fas fa-user-circle'
    colorIcon.style.color = player.color.toString(16)
    playerDiv.appendChild(colorIcon)

    let name = document.createElement('h1')
    name.id = 'playerName'+player.sessionId
    name.className = 'playerName'
    name.innerHTML = 'Player 0' + (player.id+1).toString()
    playerDiv.appendChild(name)

    if (player.sessionId === slf.getClient()?.sessionId || slf.getClient()?.id === 0){
        let renameIcon = document.createElement('i')
        renameIcon.id = 'playerRename'+player.sessionId
        renameIcon.className = 'playerRename fas fa-edit'
        playerDiv.appendChild(renameIcon)

    }
    return playerDiv
}