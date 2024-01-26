const { exit } = require('process');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Mockup card library
const cardLib = {
    createCard: (rank, suit, isTrump = false, isPlayable = true) => ({ rank, suit, isTrump, isPlayable }),
    shuffleDeck: (deck) => deck.sort(() => Math.random() - 0.5),
};

// Create a deck of cards
const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
const ranks = ['7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace'];

const deck = [];

for (const suit of suits) {
    for (const rank of ranks) {
        deck.push(cardLib.createCard(rank, suit, false, true));
    }
}

// Shuffle the deck
cardLib.shuffleDeck(deck);

// Initialize players
function initializePlayers() {
    const players = {
        player1: { nickname: '', hand: [], teammate: null, position: null, nextPlayer: null, teamRoundScore: 0, teamTotalScore: 0, roundDeclarations: [], declarationPoints: 0 },
        player2: { nickname: '', hand: [], teammate: null, position: null, nextPlayer: null, teamRoundScore: 0, teamTotalScore: 0, roundDeclarations: [], declarationPoints: 0 },
        player3: { nickname: '', hand: [], teammate: null, position: null, nextPlayer: null, teamRoundScore: 0, teamTotalScore: 0, roundDeclarations: [], declarationPoints: 0 },
        player4: { nickname: '', hand: [], teammate: null, position: null, nextPlayer: null, teamRoundScore: 0, teamTotalScore: 0, roundDeclarations: [], declarationPoints: 0 },
    };

    const playerOrder = ['player1', 'player2', 'player3', 'player4'];
    const randomIndex = Math.floor(Math.random() * playerOrder.length);

    for (let i = 0; i < playerOrder.length; i++) {
        const currentPlayer = players[playerOrder[(randomIndex + i) % playerOrder.length]];
        currentPlayer.position = i + 1;
    }

    players.player1.teammate = players.player3;
    players.player3.teammate = players.player1;
    players.player2.teammate = players.player4;
    players.player4.teammate = players.player2;

    players.player1.nextPlayer = players.player2;
    players.player2.nextPlayer = players.player3;
    players.player3.nextPlayer = players.player4;
    players.player4.nextPlayer = players.player1;

    return players;
}

function displayPlayers(players) {
    for (let i = 1; i <= 4; i++) {
        const player = players[`player${i}`];
        console.log(`Player ${i}: ${player.nickname}, Position: ${player.position}`);
    }
    console.log('\n');
}

// Prompt each player for a nickname
function getPlayerNickname(playerNumber) {
    return new Promise(resolve => {
        rl.question(`Enter nickname for Player ${playerNumber}: `, (nickname) => {
            resolve({ nickname });
        });
    });
}

// Display player hand
function displayPlayerHand(player) {
    console.log(`${player.nickname}'s hand:`);
    player.hand.forEach((card, index) => {
        prinString = `Card ${index + 1}: ${card.rank} of ${card.suit} is trump:${card.isTrump}`
        if (!card.isPlayable) {
            prinString += ' (Not playable)';
        }
        console.log(prinString);
    });
    console.log('\n');
}

// Deal cards
function dealCards(deck, players) {
    for (let i = 0; i < 5; i++) {
        players.player1.hand.push(deck.pop());
        players.player2.hand.push(deck.pop());
        players.player3.hand.push(deck.pop());
        players.player4.hand.push(deck.pop());
    }
    // Sort cards by suit for each player
    for (let i = 1; i <= 4; i++) {
        const player = players[`player${i}`];
        player.hand = sortCardsBySuit(player.hand);
    }
}

function sortCardsBySuit(hand) {
    const suits = ['Clubs', 'Diamonds', 'Spades', 'Hearts'];
    const sortedHand = [];

    for (const suit of suits) {
        const cardsOfSuit = hand.filter(card => card.suit === suit);
        sortedHand.push(...cardsOfSuit);
    }

    return sortedHand;
}

function sortCardsByPokerOrder(cards) {
    const pokerOrder = ['Ace', 'King', 'Queen', 'Jack', '10', '9', '8', '7'];
    return cards.sort((a, b) => {
        const rankA = pokerOrder.indexOf(a.rank);
        const rankB = pokerOrder.indexOf(b.rank);
        return rankA - rankB;
    });
}

function sortPlayerHandByPokerOrder(hand) {
    const suits = ['Clubs', 'Diamonds', 'Spades', 'Hearts'];
    for (const suit of suits) {
        const cardsOfSuit = hand.filter(card => card.suit === suit);
        const sortedCardsOfSuit = sortCardsByPokerOrder(cardsOfSuit);
        hand = hand.filter(card => card.suit !== suit);
        hand.push(...sortedCardsOfSuit);
    }
    return hand;
}

async function requestBids(players) {
    let passCount = 0;
    let bidCount = 0;
    let currentPlayerIndex = 1;
    let gameBid = 'Pass';
    let biddingPlayer = null;
    let validBids = ['Clubs', 'Diamonds', 'Hearts', 'Spades', 'No Trumps', 'All Trumps'];
    let multiplier = 1;

    
    //console.log("passCount: " + passCount + "\n");
    //console.log("bidCount: " + bidCount + "\n");
    //console.log("We'll be in + " + (passCount < 4 && (bidCount === 0 || passCount < 3)))

    while (passCount < 4 && (bidCount === 0 || passCount < 3)) {
        //const player = players[`player${currentPlayerIndex}`];

        const player = Object.values(players).find(player => player.position === currentPlayerIndex);
        console.log('\n');
        displayPlayerHand(player);
        console.log('\n');
        console.log(`Player at position ${player.position}: ${player.nickname} is bidding.`);
        const bid = await getPlayerBid(player, validBids);


        doubleBreak: if (bid === 'Pass') {
            passCount++;
        } else {
            bidCount++;
            passCount = 0;
            biddingPlayer = player;

            if (bid === 'Double') {
                multiplier = 2;
                validBids.push('Re-Double');
                validBids = validBids.filter(bid => bid !== 'Double');
                break doubleBreak;

            } else if (bid === 'Re-Double') {
                multiplier = 4;
                validBids = validBids.filter(bid => bid !== 'Re-Double');
                break doubleBreak
            }
            multiplier = 1;

            gameBid = bid;
            // Get the index of the current game bid
            const gameBidIndex = validBids.indexOf(gameBid);

            if (!validBids.includes('Double')) {
                validBids.push('Double');
            }

            // Remove bids with lower index than the current game bid
            validBids = validBids.slice(gameBidIndex + 1);
        }

        currentPlayerIndex = (currentPlayerIndex % 4) + 1;

        //console.log("passCount: " + passCount + "\n");
        //console.log("bidCount: " + bidCount + "\n");
        //console.log("We'll be in + " + (passCount < 4 && (bidCount === 0 || passCount < 3)))
    }
    return {
        gameBid: gameBid,
        biddingPlayer: biddingPlayer,
        multiplier: multiplier
    };
}

function getPlayerBid(player, validBids) {
    return new Promise((resolve) => {
        console.log(`Valid bids: ${validBids.join(', ')}, or Pass.`);

        const askBid = () => {
            rl.question(`${player.nickname}, enter your bid: `, (bid) => {
                if (validBids.includes(bid) || bid === 'Pass') {
                    resolve(bid);
                } else {
                    console.log(`Invalid bid. Please enter one of the following: ${validBids.join(', ')}, or Pass.`);
                    askBid();
                }
            });
        };

        askBid();
    });
}

function dealRestOfDeck(deck, players) {
    let currentPlayerIndex = 1;
    let cardIndex = 0;

    while (cardIndex < deck.length) {
        const player = players[`player${currentPlayerIndex}`];
        player.hand.push(deck[cardIndex]);
        cardIndex++;
        currentPlayerIndex = (currentPlayerIndex % 4) + 1;
    }
}

function changeIsTrumpValue(player, suit) {
    player.hand.forEach(card => {
        if (suit === 'All Trumps') {
            card.isTrump = true;
        } else if (card.suit === suit) {
            card.isTrump = true;
        } else {
            card.isTrump = false;
        }
    });
}

async function biddingPhase(players) {
    // Sort cards by suit for each player
    for (let i = 1; i <= 4; i++) {
        const player = players[`player${i}`];

        player.hand = sortCardsBySuit(player.hand);
        player.hand = sortPlayerHandByPokerOrder(player.hand);
    }

    // Call the function to start requesting bids from players
    const gameBid = await requestBids(players);
    return gameBid;
}

async function startSuitedGame(players, gameBid, roundNumber, bidder, multiplier) {

    function updatePlayableCards(player, requestedSuit, currentTaker, winningCard, gameBid) {

        /*
        console.log("\n");
        console.log("current player is: " + player.nickname);
        console.log(requestedSuit + " is requested suit");
        console.log("current taker is: " + currentTaker.nickname);
        console.log("winning card: " + winningCard.rank + " of " + winningCard.suit);
        console.log("game bid: " + gameBid);
        */

        const hasRequestedSuit = player.hand.some(card => card.suit === requestedSuit);

        if (hasRequestedSuit) {
            player.hand.forEach(card => {
                if (card.suit !== requestedSuit) {
                    card.isPlayable = false;
                }
            });
            if (requestedSuit === gameBid) {

                //console.log("requested suit is game bid");
                let hasOverTrump = false;

                player.hand.forEach(card => {
                    if (card.isTrump && (compareCardRankTrump(card, winningCard) > 0)) {
                        hasOverTrump = true;
                    }
                });
                //console.log("has over trump: " + hasOverTrump);
                if (hasOverTrump) {
                    player.hand.forEach(card => {
                        if (card.isTrump && !(compareCardRankTrump(card, winningCard) > 0)) {
                            card.isPlayable = false;
                        }
                    });
                }
            }
        } else {
            if (currentTaker !== player.teammate) {

                let hasTrump = player.hand.some(card => card.isTrump);
                if (!hasTrump) {
                    return;
                }
                if (winningCard.isTrump) {

                    //console.log("winning card is trump");
                    let hasOverTrump = false;

                    player.hand.forEach(card => {
                        if (card.isTrump && (compareCardRankTrump(card, winningCard) > 0)) {
                            hasOverTrump = true;
                        }
                    });
                    //console.log("has over trump: " + hasOverTrump);
                    if (hasOverTrump) {
                        player.hand.forEach(card => {
                            if ((!card.isTrump) || (card.isTrump && !(compareCardRankTrump(card, winningCard) > 0))) {
                                card.isPlayable = false;
                            }
                        });
                    }
                } else {
                    player.hand.forEach(card => {
                        if (!card.isTrump) {
                            card.isPlayable = false;
                        }
                    });
                }
            }
        }
    }

    const cardsPlayed = []; // Initialize an empty list to store played cards

    let winningCard = null;
    let currentTaker = null;
    let requestedSuit = null;
    let player = null;
    let selectedCardIndex = null;
    let currentPlayerIndex = 1;

    for (let i = 1; i <= 4; i++) {
        if (currentPlayerIndex == 1) {
            resetCardsToPlayable(players);
            player = Object.values(players).find(player => player.position === 1);
            console.log("\n ROUND -- " + roundNumber + "\n");
            if(roundNumber === 0){
                declarationString = await askPlayerToDeclare(player);
                printPlayerDeclarations(declarationString, player);
                savePlayerDeclarations(declarationString, player);
            }
            selectedCardIndex = await getPlayerCardIndex(player) - 1;
            currentTaker = player;
            winningCard = player.hand[selectedCardIndex];
            requestedSuit = player.hand[selectedCardIndex].suit;
        } else {
            player = Object.values(players).find(player => player.position === currentPlayerIndex);
            console.log("\n ROUND -- " + roundNumber + "\n");
            if(roundNumber === 0){
                declarationString = await askPlayerToDeclare(player);
                printPlayerDeclarations(declarationString, player);
                savePlayerDeclarations(declarationString, player);
            }
            updatePlayableCards(player, requestedSuit, currentTaker, winningCard, gameBid);
            //console.log("\n");
            selectedCardIndex = await getPlayerCardIndex(player) - 1;
        }

        const selectedCard = player.hand[selectedCardIndex]; // Get the selected card
        beloteCheck(selectedCard, requestedSuit, player)
        cardsPlayed.push(selectedCard); // Add the selected card to the cardsPlayed list

        if (!winningCard.isTrump) {
            if (!selectedCard.isTrump) {
                if (compareCardRankNotTrump(selectedCard, winningCard) > 0) {
                    winningCard = selectedCard;
                    currentTaker = player;
                }
            } else {
                winningCard = selectedCard;
                currentTaker = player;
            }
        } else {
            console.log("selected card: " + selectedCard.rank + " of " + selectedCard.suit + " is trump");
            console.log("winning card: " + winningCard.rank + " of " + winningCard.suit + " is trump");
            console.log(selectedCard.isTrump);
            if (selectedCard.isTrump) {
                console.log(compareCardRankTrump(selectedCard, winningCard));
                if (compareCardRankTrump(selectedCard, winningCard) > 0) {
                    winningCard = selectedCard;
                    currentTaker = player;
                }
            }
        }

        currentPlayerIndex = (currentPlayerIndex % 4) + 1;
        console.log(`${player.nickname} played: ${selectedCard.rank} of ${selectedCard.suit}`);
        player.hand.splice(selectedCardIndex, 1); // Remove the selected card from the player's hand
    }

    console.log(`\n${currentTaker.nickname} took the cards!`);
    roundPoints = countPoints(cardsPlayed);
    console.log(`Round points: ${roundPoints}\n`);
    currentTaker.teamRoundScore += roundPoints;
    currentTaker.teammate.teamRoundScore += roundPoints;

    let hangingPoints = 0;
    let winners = null;

    if (roundNumber == 7) {
        calculationResult = calculatePoints(currentTaker, bidder, players, "Suited", multiplier);
        winners = calculationResult.winners;
        hangingPoints = calculationResult.hangingPoints;
    }

    currentTaker.position = 1;
    currentTaker.nextPlayer.position = 2;
    currentTaker.nextPlayer.nextPlayer.position = 3;
    currentTaker.nextPlayer.nextPlayer.nextPlayer.position = 4;

    return {
        winners: winners,
        hangingPoints: hangingPoints
    };
}

function beloteCheck(selectedCard, wantedSuit, player){
    if ((selectedCard.rank === 'King' || selectedCard.rank === 'Queen') && selectedCard.isTrump) {
        const selectedSuit = selectedCard.suit;
        const hasKing = player.hand.some(card => card.rank === 'King' && card.suit === selectedSuit);
        const hasQueen = player.hand.some(card => card.rank === 'Queen' && card.suit === selectedSuit);
        
        if (hasKing && hasQueen && selectedSuit === wantedSuit) {
            console.log(`${player.nickname} declares Belote.`);
            player.roundDeclarations.push('Belote');
        }
    }
}

async function askPlayerToDeclare(player) {
    if(player.roundDeclarations.length === 0){
        return "";
    }    
    return new Promise((resolve) => {
        const askForDeclarations = () => {
            console.log(`${player.nickname}'s declarations: ${player.roundDeclarations.join(', ')}`);
            rl.question(`${player.nickname}, enter the indexes of the declarations you want to play separated by spaces: `, (declarationString) => {
                if (isDeclarationStringValid(declarationString, player)) {
                    resolve(declarationString);
                } else {
                    console.log("Invalid declaration string.");
                    askForDeclarations(); // Ask again for a valid card index
                }
            });

        };

        askForDeclarations();
    });
}

function printPlayerDeclarations(declarationString, player) {
    const declarationIndexes = declarationString.split(' ').filter(index => index.trim() !== '');
    for (const index of declarationIndexes) {
        
        const declarationIndex = parseInt(index);
        let declaration = player.roundDeclarations[declarationIndex];

        if(declaration.includes('fourOfAKind')){
            console.log(`${player.nickname} declares a four of a kind.`);
        }

        if(declaration.includes("straightFlush")){
            let count = parseInt(declaration.substring(13, 14));
            switch(count){
                case 3:
                    console.log(`${player.nickname} declares a tierce.`);
                    break;
                case 4:
                    console.log(`${player.nickname} declares a 50.`);
                    break;
                case 5:
                    console.log(`${player.nickname} declares an 100.`);
                    break;
                default:
                    break;
            }
        }
    }
}

function savePlayerDeclarations(declarationString, player) {
    const declarationIndexes = declarationString.split(' ').filter(index => index.trim() !== '');
    const validDeclarations = [];

    for (const index of declarationIndexes) {
        const declarationIndex = parseInt(index);
        if (declarationIndex >= 0 && declarationIndex < player.roundDeclarations.length) {
            validDeclarations.push(player.roundDeclarations[declarationIndex]);
        }
    }

    player.roundDeclarations = validDeclarations;
}

function isDeclarationStringValid(declarationString, player) {
    const declarationIndexes = declarationString.split(' ').filter(index => index.trim() !== '');
    const declarations = [];

    for (const index of declarationIndexes) {
        if (isNaN(index)) {
            return false;
        }
        const declarationIndex = parseInt(index);
        if (declarationIndex >= 0 && declarationIndex < player.roundDeclarations.length) {
            declarations.push(player.roundDeclarations[declarationIndex]);
        } else {
            return false;
        }
    }

    if (declarations.some(declaration => declaration.includes('fourOfAKind'))) {
        const fourOfAKindDeclarations = declarations.filter(declaration => declaration.includes('fourOfAKind'));
        if (fourOfAKindDeclarations.length === 1 && declarations.some(declaration => declaration.includes('straightFlush'))) {
            let kareType = fourOfAKindDeclarations[0].substring(12, fourOfAKindDeclarations[0].length);
            let straightFlushType = declarations.find(declaration => declaration.includes('straightFlush')).substring(15, declarations.find(declaration => declaration.includes('straightFlush')).length);
            let straightFlushCount = parseInt(declarations.find(declaration => declaration.includes('straightFlush')).substring(13, 14));
            let straightFlushCardRanks = getCardRanks(straightFlushType, straightFlushCount);
            if(straightFlushCardRanks.includes(kareType)){
                return false;
            }
        }
    }

    return true;
}

function getCardRanks(highestRank, count) {
    // Define your logic to get the card ranks based on the highest rank and count
    // You can use the highestRank and count parameters to generate the card ranks

    // Example: Assuming 'highestRank' is 'K' and 'count' is 5
    const ranks = ['7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace'];
    const startIndex = ranks.indexOf(highestRank);

    // Ensure startIndex is valid
    if (startIndex !== -1) {
        return ranks.slice(startIndex, startIndex + count);
    }

    // Handle the case when the highestRank is not found
    return [];
}

function resetCardsToPlayable(players) {
    for (let i = 1; i <= 4; i++) {
        const player = players[`player${i}`];
        player.hand.forEach(card => {
            card.isPlayable = true;
        });
    }
}

function countPoints(cards) {
    let points = 0;

    for (const card of cards) {
        switch (card.rank) {
            case 'Ace':
                points += 11;
                break;
            case '10':
                points += 10;
                break;
            case 'King':
                points += 4;
                break;
            case 'Queen':
                points += 3;
                break;
            case 'Jack':
                if (card.isTrump) {
                    points += 20;
                } else {
                    points += 2;
                }
                break;
            case '9':
                if (card.isTrump) {
                    points += 14;
                } else {
                    points += 0;
                }
                break;
            default:
                // Handle other cases if needed
                break;
        }
    }

    return points;
}

function compareCardRankNotTrump(card1, card2) {
    const rankOrder = ['7', '8', '9', 'Jack', 'Queen', 'King', '10', 'Ace'];
    return rankOrder.indexOf(card1.rank) - rankOrder.indexOf(card2.rank);
}

function compareCardRankTrump(card1, card2) {
    const rankOrder = ['7', '8', 'Queen', 'King', '10', 'Ace', '9', 'Jack'];
    return rankOrder.indexOf(card1.rank) - rankOrder.indexOf(card2.rank);
}

async function getPlayerCardIndex(player) {
    displayPlayerHand(player);
    const playableCards = getPlayableCards(player.hand); // Get the playable cards

    return new Promise((resolve) => {
        const askForCardIndex = () => {
            console.log(`Playable cards: ${playableCards.join(', ')}`);
            rl.question(`${player.nickname}, enter the index of the card you want to play: `, (cardIndex) => {

                cardIndex = parseInt(cardIndex);
                console.log('cardIndex: ' + cardIndex + '\n');
                //console.log('playables include cardIndex: ' + playableCards.includes(cardIndex) + '\n');
                if (!playableCards.includes(cardIndex - 1)) {
                    console.log("Invalid card index. Please enter a playable card index.");
                    askForCardIndex(); // Ask again for a valid card index
                } else {
                    resolve(cardIndex);
                }
            });
        };

        askForCardIndex();
    });
}

function getPlayableCards(hand) {
    const playableCards = [];
    for (let i = 0; i < hand.length; i++) {
        if (hand[i].isPlayable) {
            playableCards.push(i);
        }
    }
    return playableCards;
}

async function startBeloteRound(players) {

    deck.length = 0; // Clear the deck
    for (const suit of suits) {
        for (const rank of ranks) {
            deck.push(cardLib.createCard(rank, suit, false, true));
        }
    }
    cardLib.shuffleDeck(deck);

    // Clear each player's hand
    for (let i = 1; i <= 4; i++) {
        const player = players[`player${i}`];
        player.hand = [];
    }

    dealCards(deck, players);

    // Display players
    displayPlayers(players);
    let biddingResult = await biddingPhase(players);
    while (biddingResult.gameBid === 'Pass') {

        // Deal new cards
        deck.length = 0; // Clear the deck
        for (const suit of suits) {
            for (const rank of ranks) {
                deck.push(cardLib.createCard(rank, suit, false, true));
            }
        }
        cardLib.shuffleDeck(deck);

        // Clear each player's hand
        for (let i = 1; i <= 4; i++) {
            const player = players[`player${i}`];
            player.hand = [];
        }

        dealCards(deck, players);

        // Display players
        displayPlayers(players);

        // Shift the positions by 1
        let currentFirst = Object.values(players).find(player => player.position === 1);
        shiftPositionsByOne(currentFirst);

        biddingResult = await biddingPhase(players);
    }

    console.log(`The game bid is: ${biddingResult.gameBid}\n`);

    // Deal the rest of the deck
    dealRestOfDeck(deck, players);
    for (let i = 1; i <= 4; i++) {
        const player = players[`player${i}`];
        player.hand = sortCardsBySuit(player.hand);
        player.hand = sortPlayerHandByPokerOrder(player.hand);
    }

    // Change the isTrump value for each card
    for (let i = 1; i <= 4; i++) {
        const player = players[`player${i}`];
        changeIsTrumpValue(player, biddingResult.gameBid);
        //console.log('\n');
        //displayPlayerHand(player);
    }

    // Display players
    //displayPlayers(players);

    //Save player positions
    let firstPlayer = Object.values(players).find(player => player.position === 1);

    // Start a trick
    let hangingPoints = 0;
    for (let i = 0; i < 8; i++) {
        switch (biddingResult.gameBid) {
            case 'Clubs':
            case 'Diamonds':
            case 'Hearts':
            case 'Spades':
                if(i == 0){
                    calculateDeclarations(players);
                    printDeclarations(players);
                }
                gameResult = await startSuitedGame(players, biddingResult.gameBid, i, biddingResult.biddingPlayer, biddingResult.multiplier);
                break;
            case "No Trumps":
                gameResult = await startNoTrumpsGame(players, i, biddingResult.biddingPlayer, biddingResult.multiplier);
                break;
            case "All Trumps":
                if(i == 0){
                    calculateDeclarations(players);
                    printDeclarations(players);    
                }
                gameResult = await startAllTrumpsGame(players, i, biddingResult.biddingPlayer, biddingResult.multiplier);
                break;
            default:
                // Handle other cases if needed
                break;
        }
    }

    if (gameResult.hangingPoints === 0) {
        if (hangingPoints !== 0) {
            gameResult.winners[0].teamTotalScore += hangingPoints;
            gameResult.winners[1].teamTotalScore += hangingPoints;
            hangingPoints = 0;
        }
    } else {
        hangingPoints += gameResult.hangingPoints;
    }

    // Display players and their teamRoundScores
    for (let i = 1; i <= 4; i++) {
        const player = players[`player${i}`];
        console.log(`Player ${i}: Team Total Score - ${player.teamTotalScore}`);
    }

    shiftPositionsByOne(firstPlayer);

}

async function calculateDeclarations(players) {
    for (let i = 1; i <= 4; i++) {
        const player = players[`player${i}`];
        const jacks = player.hand.filter(card => card.rank === 'Jack');
        const nines = player.hand.filter(card => card.rank === '9');
        const aces = player.hand.filter(card => card.rank === 'Ace');
        const tens = player.hand.filter(card => card.rank === '10');
        const kings = player.hand.filter(card => card.rank === 'King');
        const queens = player.hand.filter(card => card.rank === 'Queen');

        if (jacks.length === 4) {
            player.roundDeclarations.push('fourOfAKindJacks');
        }
        if (nines.length === 4) {
            player.roundDeclarations.push('fourOfAKindNines');
        }
        if (aces.length === 4) {
            player.roundDeclarations.push('fourOfAKindAces');
        }
        if (tens.length === 4) {
            player.roundDeclarations.push('fourOfAKindTens');
        }
        if (kings.length === 4) {
            player.roundDeclarations.push('fourOfAKindKings');
        }
        if (queens.length === 4) {
            player.roundDeclarations.push('fourOfAKindQueens');
        }

        const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
        for (const suit of suits) {
            const straightFlush = player.hand.filter(card => card.suit === suit)
                .sort((a, b) => ranks.indexOf(a.rank) - ranks.indexOf(b.rank));

            if (straightFlush.length >= 3) {
                let count = 1;
                let prevIndex = ranks.indexOf(straightFlush[0].rank);
                let highestRank = straightFlush[0].rank;

                for (let i = 1; i < straightFlush.length; i++) {
                    const currentIndex = ranks.indexOf(straightFlush[i].rank);
                    if (currentIndex - prevIndex === 1) {
                        count++;
                        if(i === straightFlush.length - 1){
                            if (count >= 3) {
                                highestRank = straightFlush[i].rank;
                                if(count > 5){
                                    count = 5;
                                }
                                player.roundDeclarations.push(`straightFlush${count} ${highestRank}`);
                            }
                        }
                    } else {
                        if (count >= 3) {
                            highestRank = ranks[prevIndex];
                            if(count > 5){
                                count = 5;
                            }
                            player.roundDeclarations.push(`straightFlush${count} ${highestRank}`);
                        }
                        count = 1;
                    }
                    prevIndex = currentIndex;
                }
            }
        }
    }
}

async function printDeclarations(players) {
    for (let i = 1; i <= 4; i++) {
        const player = players[`player${i}`];
        console.log(`${player.nickname}'s declarations: ${player.roundDeclarations.join(', ')}`);
    }
}

async function startNoTrumpsGame(players, roundNumber, bidder, multiplier) {

    function updatePlayableCards(player, requestedSuit) {
        if (player.hand.some(card => card.suit === requestedSuit)) {
            player.hand.forEach(card => {
                if (card.suit !== requestedSuit) {
                    card.isPlayable = false;
                }
            });
        }
    }

    const cardsPlayed = []; // Initialize an empty list to store played cards

    let winningCard = null;
    let currentTaker = null;
    let requestedSuit = null;
    let player = null;
    let selectedCardIndex = null;
    let currentPlayerIndex = 1;

    for (let i = 1; i <= 4; i++) {

        if (currentPlayerIndex == 1) {
            resetCardsToPlayable(players);
            player = Object.values(players).find(player => player.position === 1);
            selectedCardIndex = await getPlayerCardIndex(player) - 1;
            currentTaker = player;
            winningCard = player.hand[selectedCardIndex];
            requestedSuit = player.hand[selectedCardIndex].suit;
        } else {
            player = Object.values(players).find(player => player.position === currentPlayerIndex);
            updatePlayableCards(player, requestedSuit);
            console.log("\n");
            selectedCardIndex = await getPlayerCardIndex(player) - 1;
        }

        const selectedCard = player.hand[selectedCardIndex]; // Get the selected card
        cardsPlayed.push(selectedCard); // Add the selected card to the cardsPlayed list

        if (selectedCard.suit === requestedSuit) {
            if (compareCardRankNotTrump(selectedCard, winningCard) > 0) {
                winningCard = selectedCard;
                currentTaker = player;
            }
        }

        currentPlayerIndex = (currentPlayerIndex % 4) + 1;
        console.log(`${player.nickname} played: ${selectedCard.rank} of ${selectedCard.suit}`);
        player.hand.splice(selectedCardIndex, 1); // Remove the selected card from the player's hand
    }

    console.log(`\n${currentTaker.nickname} took the cards!`);
    roundPoints = countPoints(cardsPlayed);
    console.log(`Round points: ${roundPoints}\n`);
    currentTaker.teamRoundScore += roundPoints;
    currentTaker.teammate.teamRoundScore += roundPoints;

    let hangingPoints = 0;
    let winners = null;

    if (roundNumber == 7) {
        calculationResult = calculatePoints(currentTaker, bidder, players, "No Trumps", multiplier);
        winners = calculationResult.winners;
        hangingPoints = calculationResult.hangingPoints;
    }

    currentTaker.position = 1;
    currentTaker.nextPlayer.position = 2;
    currentTaker.nextPlayer.nextPlayer.position = 3;
    currentTaker.nextPlayer.nextPlayer.nextPlayer.position = 4;

    return {
        winners: winners,
        hangingPoints: hangingPoints
    };
}

async function startAllTrumpsGame(players, roundNumber, bidder, multiplier) {
    function updatePlayableCards(player, requestedSuit, winningCard) {
        if (player.hand.some(card => card.suit === requestedSuit)) {
            let hasOverTrump = false;
            console.log("winning card: " + winningCard.rank + " of " + winningCard.suit);
            player.hand.forEach(card => {
                if (card.suit === requestedSuit && (compareCardRankTrump(card, winningCard) > 0)) {
                    hasOverTrump = true;
                }
            });
            console.log("has over trump: " + hasOverTrump);
            if (hasOverTrump) {
                player.hand.forEach(card => {
                    if (card.suit === requestedSuit && !(compareCardRankTrump(card, winningCard) > 0)) {
                        card.isPlayable = false;
                    }
                });
            }

            player.hand.forEach(card => {
                if (card.suit !== requestedSuit) {
                    card.isPlayable = false;
                }
            });
        }
    }

    const cardsPlayed = []; // Initialize an empty list to store played cards

    let winningCard = null;
    let currentTaker = null;
    let requestedSuit = null;
    let player = null;
    let selectedCardIndex = null;
    let currentPlayerIndex = 1;

    for (let i = 1; i <= 4; i++) {

        if (currentPlayerIndex == 1) {
            resetCardsToPlayable(players);
            player = Object.values(players).find(player => player.position === 1);
            console.log("\n ROUND -- " + roundNumber + "\n");
            if(roundNumber === 0){
                declarationString = await askPlayerToDeclare(player);
                printPlayerDeclarations(declarationString, player);
                savePlayerDeclarations(declarationString, player);
            }
            selectedCardIndex = await getPlayerCardIndex(player) - 1;
            currentTaker = player;
            winningCard = player.hand[selectedCardIndex];
            requestedSuit = player.hand[selectedCardIndex].suit;
        } else {
            player = Object.values(players).find(player => player.position === currentPlayerIndex);
            console.log("\n ROUND -- " + roundNumber + "\n");
            if(roundNumber === 0){
                declarationString = await askPlayerToDeclare(player);
                printPlayerDeclarations(declarationString, player);
                savePlayerDeclarations(declarationString, player);
            }
            updatePlayableCards(player, requestedSuit, winningCard);
            console.log("\n");
            selectedCardIndex = await getPlayerCardIndex(player) - 1;
        }

        const selectedCard = player.hand[selectedCardIndex]; // Get the selected card
        beloteCheck(selectedCard, requestedSuit, player)
        cardsPlayed.push(selectedCard); // Add the selected card to the cardsPlayed list

        if (selectedCard.suit === requestedSuit) {
            if (compareCardRankTrump(selectedCard, winningCard) > 0) {
                winningCard = selectedCard;
                currentTaker = player;
            }
        }

        currentPlayerIndex = (currentPlayerIndex % 4) + 1;
        console.log(`${player.nickname} played: ${selectedCard.rank} of ${selectedCard.suit}`);
        player.hand.splice(selectedCardIndex, 1); // Remove the selected card from the player's hand
    }

    console.log(`\n${currentTaker.nickname} took the cards!`);
    roundPoints = countPoints(cardsPlayed);
    console.log(`Round points: ${roundPoints}\n`);
    currentTaker.teamRoundScore += roundPoints;
    currentTaker.teammate.teamRoundScore += roundPoints;

    let hangingPoints = 0;
    let winners = null;

    if (roundNumber == 7) {
        calculationResult = calculatePoints(currentTaker, bidder, players, "All Trumps", multiplier);
        winners = calculationResult.winners;
        hangingPoints = calculationResult.hangingPoints;
    }

    currentTaker.position = 1;
    currentTaker.nextPlayer.position = 2;
    currentTaker.nextPlayer.nextPlayer.position = 3;
    currentTaker.nextPlayer.nextPlayer.nextPlayer.position = 4;


    return {
        winners: winners,
        hangingPoints: hangingPoints
    };
}

function calculatePoints(currentTaker, bidder, players, gameType, multiplier) {
    console.log("Calculating points...")
    let hangingPoints = 0;
    let winners = null;

    calculateDeclarationPoints(players);
    addDeclarationPoints(players);

    currentTaker.teamRoundScore += 10;
    currentTaker.teammate.teamRoundScore += 10;

    let declarationPoints = (bidder.declarationPoints + bidder.teammate.declarationPoints + bidder.nextPlayer.declarationPoints + bidder.nextPlayer.teammate.declarationPoints) / 10;

    if (gameType === "No Trumps") {
        totalRoundScore = 2 * (players.player1.teamRoundScore + players.player2.teamRoundScore);
    } else {
        totalRoundScore = players.player1.teamRoundScore + players.player2.teamRoundScore;
    }

    console.log("total round score: " + totalRoundScore);

    if (bidder.teamRoundScore > totalRoundScore / 2) {
        console.log("\nGame Taken")
        if (multiplier !== 1) {
            console.log("Double")
            switch (gameType) {
                case "Suited":
                    bidder.teamTotalScore += 16 * multiplier + declarationPoints;
                    bidder.teammate.teamTotalScore += 16 * multiplier + declarationPoints;
                    winners = [bidder, bidder.teammate]
                    return {
                        winners: winners,
                        hangingPoints: hangingPoints
                    }
                case "No Trumps":
                    bidder.teamTotalScore += 26 * multiplier;
                    bidder.teammate.teamTotalScore += 26 * multiplier;
                    winners = [bidder, bidder.teammate]
                    return {
                        winners: winners,
                        hangingPoints: hangingPoints
                    }
                case "All Trumps":
                    bidder.teamTotalScore += 26 * multiplier + declarationPoints;
                    bidder.teammate.teamTotalScore += 26 * multiplier + declarationPoints;
                    winners = [bidder, bidder.teammate]
                    return {
                        winners: winners,
                        hangingPoints: hangingPoints
                    }
                default:
                    break;
            }
        }
        bidderHardPoints = Math.floor(bidder.teamRoundScore / 10);
        bidderLastPointValue = bidder.teamRoundScore % 10;

        opponetHardPoints = Math.floor(bidder.nextPlayer.teamRoundScore / 10);
        opponentLastPointValue = bidder.nextPlayer.teamRoundScore % 10;

        let roundingIndex = 0;
        switch (gameType) {
            case "Suited":
                roundingIndex = 6;
                break;
            case "No Trumps":
                roundingIndex = 5;
                break;
            case "All Trumps":
                roundingIndex = 4;
                break;
            default:
                // Handle other cases if needed
                break;
        }

        if(bidderLastPointValue >= roundingIndex){
            if(bidderLastPointValue === opponentLastPointValue){
                if (bidderHardPoints < opponetHardPoints) {
                    bidderHardPoints += 1;
                } else {
                    opponetHardPoints += 1;
                }
            }else{
                bidderHardPoints += 1;
            }
        }
        if(opponentLastPointValue >= roundingIndex){
            opponetHardPoints += 1;
        }

        console.log("bidder hard points: " + bidderHardPoints);
        bidder.teamTotalScore += bidderHardPoints;
        bidder.teammate.teamTotalScore += bidderHardPoints;
        console.log("opponent hard points: " + opponetHardPoints);
        bidder.nextPlayer.teamTotalScore += opponetHardPoints;
        bidder.nextPlayer.teammate.teamTotalScore += opponetHardPoints;

        winners = [bidder, bidder.teammate]

    } else if (bidder.teamRoundScore === totalRoundScore / 2) {
        console.log("\nGame Hanging")
        if (multiplier !== 1) {
            console.log("Double")
            switch (gameType) {
                case "Suited":
                    bidder.nextPlayer.teamTotalScore += 8 * multiplier + declarationPoints / 2;
                    bidder.nextPlayer.teammate.teamTotalScore += 6 * multiplier + declarationPoints / 2;
                    hangingPoints = 8 * multiplier + declarationPoints / 2;
                    return {
                        winners: winners,
                        hangingPoints: hangingPoints
                    }
                case "No Trumps":
                    bidder.nextPlayer.teamTotalScore += 13 * multiplier;
                    bidder.nextPlayer.teammate.teamTotalScore += 13 * multiplier;
                    hangingPoints = 13 * multiplier;
                    return {
                        winners: winners,
                        hangingPoints: hangingPoints
                    }
                case "All Trumps":
                    bidder.nextPlayer.teamTotalScore += 13 * multiplier + declarationPoints / 2;
                    bidder.nextPlayer.teammate.teamTotalScore += 13 * multiplier + declarationPoints / 2;
                    hangingPoints = 13 * multiplier + declarationPoints / 2;
                    return {
                        winners: winners,
                        hangingPoints: hangingPoints
                    }
                default:
                    break;
            }
        }

        switch (gameType) {
            case "Suited":
                bidder.nextPlayer.teamTotalScore += Math.floor(totalRoundScore / 20);
                bidder.nextPlayer.teammate.teamTotalScore += Math.floor(totalRoundScore / 20);
                hangingPoints = Math.floor(totalRoundScore / 20);
                if (bidder.teamRoundScore % 10 === 6) {
                    bidder.nextPlayer.teamTotalScore += 1;
                    bidder.nextPlayer.teammate.teamTotalScore += 1;
                }
                break;
            case "No Trumps":
                bidder.nextPlayer.teamTotalScore += totalRoundScore / 20;
                bidder.nextPlayer.teammate.teamTotalScore += totalRoundScore / 20;
                hangingPoints = totalRoundScore / 20;
                break;
            case "All Trumps":
                bidder.nextPlayer.teamTotalScore += Math.ceil(totalRoundScore / 20);
                bidder.nextPlayer.teammate.teamTotalScore += Math.ceil(totalRoundScore / 20);
                hangingPoints = Math.ceil(totalRoundScore / 20);
                break;
            default:
                break;
        }
    } else {
        console.log("\nGame Inside")
        if (multiplier !== 1) {
            console.log("Double")
            switch (gameType) {
                case "Suited":
                    bidder.nextPlayer.teamTotalScore += 16 * multiplier + declarationPoints;
                    bidder.nextPlayer.teammate.teamTotalScore += 16 * multiplier + declarationPoints;
                    return {
                        winners: winners,
                        hangingPoints: hangingPoints
                    }
                case "No Trumps":
                    bidder.nextPlayer.teamTotalScore += 26 * multiplier;
                    bidder.nextPlayer.teammate.teamTotalScore += 26 * multiplier;
                    return {
                        winners: winners,
                        hangingPoints: hangingPoints
                    }
                case "All Trumps":
                    bidder.nextPlayer.teamTotalScore += 26 * multiplier + declarationPoints;
                    bidder.nextPlayer.teammate.teamTotalScore += 26 * multiplier + declarationPoints;
                    return {
                        winners: winners,
                        hangingPoints: hangingPoints
                    }
                default:
                    break;
            }
        }else{
            switch (gameType) {
                case "Suited":
                    bidder.nextPlayer.teamTotalScore += Math.floor(totalRoundScore / 10);
                    bidder.nextPlayer.teammate.teamTotalScore += Math.floor(totalRoundScore / 10);
                    break;
                case "No Trumps":
                    bidder.nextPlayer.teamTotalScore += totalRoundScore / 10;
                    bidder.nextPlayer.teammate.teamTotalScore += totalRoundScore / 10;
                    break;
                case "All Trumps":
                    bidder.nextPlayer.teamTotalScore += Math.ceil(totalRoundScore / 10);
                    bidder.nextPlayer.teammate.teamTotalScore += Math.ceil(totalRoundScore / 10);
                    break;
                default:
                    break;
            }
        }
    }
    winners = [bidder.nextPlayer, bidder.nextPlayer.teammate]
    resetPlayerPoints(players);
    
    return {
        winners: winners,
        hangingPoints: hangingPoints
    }
}

function resetPlayerPoints(players) {
    for (let i = 1; i <= 4; i++) {
        const player = players[`player${i}`];
        player.teamRoundScore = 0;
        player.declarationPoints = 0;
        player.roundDeclarations = [];
    }

}

function calculateDeclarationPoints(players) {
    let highestFourOfAKindRank = null;
    let highestKarePlayer = null;
    let highestStraightFlushType = null;
    let highestStraightFlushCount = 0;
    let highestStraightFlushPlayer = null;
    let annulStraightFlushes = false;

    for (let i = 1; i <= 4; i++) {
        const player = players[`player${i}`];
        player.declarationPoints += countBeloteDeclarations(player) * 20;

        for (const declaration of player.roundDeclarations) {
            if (declaration.includes('fourOfAKind')) {
                // Extract the rank from the declaration
                const rank = declaration.substring(12);

                // Update the highestFourOfAKindRank and highestKarePlayer
                if (highestFourOfAKindRank === null || compareDeclarationRanks(rank, highestFourOfAKindRank) > 0) {
                    highestFourOfAKindRank = rank;
                    highestKarePlayer = player;
                }
            }

            if (declaration.includes('straightFlush')) {
                // Extract type and count from the declaration
                const type = declaration.substring(15);
                const count = parseInt(declaration.substring(13, 14));
    
                // Update the highestStraightFlushType, highestStraightFlushCount, and highestStraightFlushPlayer
                if (
                    highestStraightFlushType === null ||
                    count > highestStraightFlushCount ||
                    (count === highestStraightFlushCount && compareDeclarationRanks(type, highestStraightFlushType) > 0)
                ) {
                    highestStraightFlushType = type;
                    highestStraightFlushCount = count;
                    highestStraightFlushPlayer = player;
                    annulStraightFlushes = false;
                } else if (
                    highestStraightFlushType === null ||
                    count > highestStraightFlushCount ||
                    (count === highestStraightFlushCount && compareDeclarationRanks(type, highestStraightFlushType) == 0)
                ) {
                    annulStraightFlushes = true;
                }
            }
        }
    }

    // Check if the highestKarePlayer is not null
    if (highestKarePlayer) {
        // Iterate through all "fourOfAKind" declarations of the highestKarePlayer
        for (const declaration of highestKarePlayer.roundDeclarations) {
            if (declaration.includes('fourOfAKind')) {
                // Extract the rank from the declaration
                const rank = declaration.substring(12);

                // Add points based on the specified conditions
                let pointsToAdd = 0;
                if (rank === 'Jack') {
                    pointsToAdd = 200;
                } else if (rank === '9') {
                    pointsToAdd = 150;
                } else {
                    pointsToAdd = 100;
                }

                // Add points to the highestKarePlayer's declarationPoints
                highestKarePlayer.declarationPoints += pointsToAdd;
            }
        }

        for (const declaration of highestKarePlayer.teammate.roundDeclarations) {
            if (declaration.includes('fourOfAKind')) {
                const rank = declaration.substring(12);

                let pointsToAdd = 0;
                if (rank === 'Jack') {
                    pointsToAdd = 200;
                } else if (rank === '9') {
                    pointsToAdd = 150;
                } else {
                    pointsToAdd = 100;
                }

                highestKarePlayer.teammate.declarationPoints += pointsToAdd;
            }
        }
    }
    if(highestStraightFlushPlayer && !annulStraightFlushes){
        for (const declaration of highestStraightFlushPlayer.roundDeclarations) {
            if (declaration.includes('straightFlush')) {
                const count = parseInt(declaration.substring(13, 14));

                let pointsToAdd = 0;
                if (count === 5) {
                    pointsToAdd = 100;
                } else if (count === 4) {
                    pointsToAdd = 50;
                } else {
                    pointsToAdd = 20;
                }

                highestStraightFlushPlayer.declarationPoints += pointsToAdd;
            }
        }
        for (const declaration of highestStraightFlushPlayer.teammate.roundDeclarations) {
            if (declaration.includes('straightFlush')) {
                const count = parseInt(declaration.substring(13, 14));

                let pointsToAdd = 0;
                if (count === 5) {
                    pointsToAdd = 100;
                } else if (count === 4) {
                    pointsToAdd = 50;
                } else {
                    pointsToAdd = 20;
                }

                highestStraightFlushPlayer.teammate.declarationPoints += pointsToAdd;
            }
        }
    }
}

function addDeclarationPoints(players) {
    for (let i = 1; i <= 4; i++) {
        const player = players[`player${i}`];
        player.teamRoundScore += player.declarationPoints + player.teammate.declarationPoints;
    }
}

function compareDeclarationRanks(rank1, rank2) {
    const ranksOrder = ['7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace'];

    return ranksOrder.indexOf(rank1) - ranksOrder.indexOf(rank2);
}

function countBeloteDeclarations(player) {
    let count = 0;
    for (let declaration of player.roundDeclarations) {
        if (declaration === "Belote") {
            count++;
        }
    }
    return count;
}

function shiftPositionsByOne(firstPlayer) {
    //Shift positions by one
    firstPlayer.position = 4;
    firstPlayer.nextPlayer.position = 1;
    firstPlayer.nextPlayer.nextPlayer.position = 2;
    firstPlayer.nextPlayer.nextPlayer.nextPlayer.position = 3;
}

async function startBeloteGame() {

    const players = initializePlayers();

    for (let i = 1; i <= 4; i++) {
        const { nickname } = await getPlayerNickname(i);
        players[`player${i}`].nickname = nickname;
        console.log(`${players[`player${i}`].nickname}'s nickname is ${nickname}`);
    }

    console.log('\nBelote game started!\n');

    while (players.player1.teamTotalScore < 151 && players.player2.teamTotalScore < 151 || (players.player1.teamTotalScore === players.player2.teamTotalScore && players.player1.teamTotalScore >= 151)) {
        await startBeloteRound(players);
    }

    if (players.player1.teamTotalScore > players.player2.teamTotalScore) {
        console.log(`${players.player1.nickname} and ${players.player3.nickname} won!`);
    } else {
        console.log(`${players.player2.nickname} and ${players.player4.nickname} won!`);
    }
    exit();
}


startBeloteGame();
