const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Mockup card library
const cardLib = {
    createCard: (rank, suit, isTrump = false) => ({ rank, suit, isTrump }),
    shuffleDeck: (deck) => deck.sort(() => Math.random() - 0.5),
};

// Create a deck of cards
const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
const ranks = ['7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace'];

const deck = [];

for (const suit of suits) {
    for (const rank of ranks) {
        deck.push(cardLib.createCard(rank, suit, false));
    }
}

// Shuffle the deck
cardLib.shuffleDeck(deck);

// Initialize players
function initializePlayers() {
    return {
        player1: { nickname: '', hand: [] },
        player2: { nickname: '', hand: [] },
        player3: { nickname: '', hand: [] },
        player4: { nickname: '', hand: [] },
    };
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

        const player = players[`player${currentPlayerIndex}`];
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

async function startBeloteRound() {
    const players = initializePlayers();

    for (let i = 1; i <= 4; i++) {
        const { nickname } = await getPlayerNickname(i);
        players[`player${i}`].nickname = nickname;
        console.log(`${players[`player${i}`].nickname}'s nickname is ${nickname}`);
    }

    console.log('\nBelote game started!\n');

    // Deal cards before displaying hands
    dealCards(deck, players);

    // Call the function to start the bidding phase
    const gameBid = await biddingPhase(players);

    if (gameBid === 'Pass') {
        console.log('The round is passed. Game over.');
        process.exit(0);
    }

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

    rl.close();
}


async function startBeloteGame(){
    startBeloteRound();
}

startBeloteGame();