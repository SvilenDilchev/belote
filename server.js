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
        player1: { nickname: '', hand: [], teammate: null, position: null },
        player2: { nickname: '', hand: [], teammate: null, position: null },
        player3: { nickname: '', hand: [], teammate: null, position: null },
        player4: { nickname: '', hand: [], teammate: null, position: null },
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
    player.hand.forEach(card => {
        if (!card.isPlayable) {
            console.log(`The following card is not playable right now.`);
        }
        console.log(`${card.rank} of ${card.suit} is trump:${card.isTrump}`);
    });
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
    let validBids = ['Clubs', 'Diamonds', 'Hearts', 'Spades', 'No Trumps', 'All Trumps'];

    while (passCount < 4 && (bidCount === 0 || passCount < 3)) {

        //const player = players[`player${currentPlayerIndex}`];
        
        const player = Object.values(players).find(player => player.position === currentPlayerIndex);
        console.log(`Player at position ${player.position}: ${player.nickname} is bidding.`);
        const bid = await getPlayerBid(player, validBids);
        

        if (bid === 'Pass') {
            passCount++;
        } else {
            bidCount++;
            passCount = 0;
            gameBid = bid;
            // Get the index of the current game bid
            const gameBidIndex = validBids.indexOf(gameBid);

            // Remove bids with lower index than the current game bid
            validBids = validBids.slice(gameBidIndex + 1);
        }

        currentPlayerIndex = (currentPlayerIndex % 4) + 1;
    }
    return gameBid;
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

    for (let i = 1; i <= 4; i++) {
        const player = players[`player${i}`];
        displayPlayerHand(player);
        console.log('\n');
    }

    // Call the function to start requesting bids from players
    const gameBid = await requestBids(players);
    return gameBid;
}



async function startSuitedGame(players, gameBid){
    
    function updatePlayableCards(players, requestedSuit, currentTaker, winningCard) {
        for (let j = 2; j <= 4; j++) {
            const player = players[`player${j}`];
            const hasRequestedSuit = player.hand.some(card => card.suit === requestedSuit);

            if (hasRequestedSuit) {
                player.hand.forEach(card => {
                    if (card.suit !== requestedSuit) {
                        card.isPlayable = false;
                    }
                });
            }else{
                if(currentTaker !== player.teammate){
                    if(winningCard.isTrump){
                        player.hand.forEach(card => {
                            if(card.isTrump){
                                if(!(compareCardRankTrump(currentBestCard) > 0)){
                                    card.isPlayable = false;
                                }
                            }else{
                                card.isPlayable = false;
                            }
                        });
                    }else{
                        player.hand.forEach(card => {
                            if(!card.isTrump){
                                card.isPlayable = false;
                            }
                        });
                    }
                }
            }
        }
    }
    
    function resetCardsToPlayable(players) {
        for (let i = 1; i <= 4; i++) {
            const player = players[`player${i}`];
            player.hand.forEach(card => {
                card.isPlayable = true;
            });
        }
    }

    const cardsPlayed = []; // Initialize an empty list to store played cards

    let winningCard = null;
    let currentTaker = null;
    let requestedSuit = null;
    for (let i = 1; i <= 4; i++) {

        
        if(i == 1){
            resetCardsToPlayable(players);
            const player = players[`player${i}`];
            const selectedCardIndex = await getPlayerCardIndex(player);
            currentTaker = player;
            winningCard = player.hand[selectedCardIndex];
            requestedSuit = player.hand[selectedCardIndex].suit;
        }else{
            updatePlayableCards(players, requestedSuit, currentTaker, winningCard);
            const player = players[`player${i}`];
            const selectedCardIndex = await getPlayerCardIndex(player);
        }

        const selectedCard = player.hand[selectedCardIndex]; // Get the selected card
        cardsPlayed.push(selectedCard); // Add the selected card to the cardsPlayed list


        console.log(`${player.nickname} played: ${selectedCard.rank} of ${selectedCard.suit}`);
    }

    requestedSuit = cardsPlayed[0].suit; // Get the suit of the first card played
    currentBestCard = cardsPlayed[0]; // Initialize the current best card to the first card played
    currentTaker = players.player1;

    for(let i = 1; i < cardsPlayed.length; i++){
        if(cardsPlayed[i].suit === requestedSuit && cardsPlayed[i].suit !== gameBid){
            if(compareCardRankNotTrump(cardsPlayed[i], currentBestCard) > 0){
                currentBestCard = cardsPlayed[i];
                currentTaker = players[`player${i + 1}`];
            }
            currentBestCard = cardsPlayed[i];
            currentTaker = players[`player${i + 1}`];
        } else if (cardsPlayed[i].suit === gameBid){
            
            
        }
    }
}



function compareCardRankNotTrump(card1, card2){
    const rankOrder = ['Seven', 'Eight', 'Nine', 'Jack', 'Queen', 'King', 'Ten', 'Ace'];
    return rankOrder.indexOf(card1.rank) - rankOrder.indexOf(card2.rank);
}

function compareCardRankTrump(card1, card2){
    const rankOrder = ['Seven', 'Eight', 'Queen', 'King', 'Ten', 'Ace', 'Nine', 'Jack'];
    return rankOrder.indexOf(card1.rank) - rankOrder.indexOf(card2.rank);
}

async function getPlayerCardIndex(player) {
    displayPlayerHand(player);
    return new Promise(resolve => {
        rl.question(`${player.nickname}, enter the index of the card you want to play: `, (cardIndex) => {
            const playableCards = getPlayableCards(player.hand); // Get the playable cards
            while (!playableCards.includes(cardIndex)) { // Check if the entered card index is playable
                console.log("Invalid card index. Please enter a playable card index.");
                rl.question(`${player.nickname}, enter the index of the card you want to play: `, (newCardIndex) => {
                    cardIndex = newCardIndex;
                });
            }
            resolve(cardIndex);
        });
    });
}

async function startBeloteRound(players) {
    
    // Deal cards before displaying hands
    dealCards(deck, players);

    // Display players
    displayPlayers(players);

    // Save the initial positions    
    let initialFirst = Object.values(players).find(player => player.position === 1);
    let initialSecond = Object.values(players).find(player => player.position === 2);
    let initialThird = Object.values(players).find(player => player.position === 3);
    let initialFourth = Object.values(players).find(player => player.position === 4);

    let gameBid = await biddingPhase(players);
    while (gameBid === 'Pass') {
        
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
        let currentSecond = Object.values(players).find(player => player.position === 2);
        let currentThird = Object.values(players).find(player => player.position === 3);
        let currentFourth = Object.values(players).find(player => player.position === 4);

        currentFirst.position = 4;
        currentFourth.position = 3;
        currentThird.position = 2;
        currentSecond.position = 1;

        gameBid = await biddingPhase(players);
    }

    // Reset back to initial positions
    initialFirst.position = 1;
    initialSecond.position = 2;
    initialThird.position = 3;
    initialFourth.position = 4;

    console.log(`The game bid is: ${gameBid}\n`);

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
        changeIsTrumpValue(player, gameBid);
        console.log('\n');
        displayPlayerHand(player);
    }

    // Display players
    displayPlayers(players);

    rl.close();
}


async function startBeloteGame(){
    
    const players = initializePlayers();

    for (let i = 1; i <= 4; i++) {
        const { nickname } = await getPlayerNickname(i);
        players[`player${i}`].nickname = nickname;
        console.log(`${players[`player${i}`].nickname}'s nickname is ${nickname}`);
    }

    console.log('\nBelote game started!\n');
    
    startBeloteRound(players);
}

startBeloteGame();