const socket = io()

socket.on('lobbyCreated', (lobby) => {
    console.log('lobby created')
    const codeLabel = document.getElementById('lobby-code')
    codeLabel.innerHTML = lobby.code
})

socket.on('test', (lobby) => {
    console.log("test")
})