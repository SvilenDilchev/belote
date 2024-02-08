const socket = io()

const allFrontEndPlayers = {}

socket.on('updateAllPlayers', (allBackEndPlayers) => {
    for (const id in allBackEndPlayers){
        const backEndPlayer = allBackEndPlayers[id]
        if(!allFrontEndPlayers[id]){
            allFrontEndPlayers[id] = new Player({
              id: backEndPlayer.id
            })
        }
    }

    for(const id in allFrontEndPlayers){
        if(!allBackEndPlayers[id]){
          delete allFrontEndPlayers[id]
        }
    }
})

socket.on('enterLobby', (lobby, player) => {
    console.log(`${player.id} entered lobby ${lobby.code}`)
    //window.location.href = `/lobby/${lobby.code}`
})

socket.on('lobbyCreated', (lobby) => {
    console.log('lobby created')
    const codeLabel = document.getElementById('lobby-code')
    codeLabel.innerHTML = lobby.code
})

function createLobby(){
    socket.emit('createLobby')
}

function joinLobby(){    
    lobbyCode = document.getElementById('lobby-code').value
    socket.emit('joinLobby', lobbyCode)
}

function buttonTest(){
    console.log("button test")
}