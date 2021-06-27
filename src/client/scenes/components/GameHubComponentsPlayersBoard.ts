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

    let name = document.createElement('input')
    name.id = 'playerName'+player.sessionId
    name.className = 'playerName'
    name.disabled = true
    name.value = player.name
    name.maxLength = 10
    playerDiv.appendChild(name)

    if (player.sessionId === slf.getClient()?.sessionId || slf.getClient()?.id === 0){
        let renameIcon = document.createElement('i')
        renameIcon.id = 'playerRename'+player.sessionId
        renameIcon.className = 'playerRename fas fa-edit'

        renameIcon.onclick = function(){
            name.disabled = false
            name.focus()
        }

        name.addEventListener("keydown", function(event){
            if (event.keyCode === 13) {
                event.preventDefault();
                console.log('Trying to change name !')
                if (typeof slf.getClient()?.sessionId === "string"){
                    var pl = slf.getClient()?.sessionId
                    if(pl !== undefined) {
                        slf.tryToChangeName(pl, name.value)
                        name.blur()
                        name.disabled = true
                    }
                }
            }
        })

        playerDiv.appendChild(renameIcon)
    }
    return playerDiv
}

export function refreshPlayerDiv(player: Player, slf : GameHub) {
    //Refresh Name
    let name = (<HTMLInputElement | null>document.getElementById('playerName'+player.sessionId))
    if (name !== null){
        name.value = player.name
    }


    //Refresh Avatar
    let color = document.getElementById('playerAvatar'+player.sessionId)
    if (color !== null)
        color.style.color = player.color.toString(16)

    //Remove RenameIcon
    let rename = document.getElementById('playerRename'+player.sessionId)
    if (rename !== null)
        rename.remove()



    let playerDiv = document.getElementById('playerDiv'+player.sessionId)
    if (playerDiv !== null){

        //Replace RenameIcon
        if (player.sessionId === slf.getClient()?.sessionId || slf.getClient()?.id === 0){
            let renameIcon = document.createElement('i')
            renameIcon.id = 'playerRename'+player.sessionId
            renameIcon.className = 'playerRename fas fa-edit'
            playerDiv.appendChild(renameIcon)

        }

    }
}