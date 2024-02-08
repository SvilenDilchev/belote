class Lobby{

    static lobbyCodes = [];

    constructor(){
        this.players = {};
        this.code = this.generateUniqueCode();

    }

    generateUniqueCode(){
        let code;
        do{
            code = Math.floor(1000 + Math.random() * 9000);
        } while (this.codeIsTaken(code))
        return code.toString();
    }

    codeIsTaken(code){
        return Lobby.lobbyCodes.includes(code);
    }

    addPlayer(player){
        this.players[player.id] = player;
    }
    getCode(){
        return this.code;
    }
}

module.exports = Lobby;
