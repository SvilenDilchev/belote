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
        player1: { nickname: '', hand: [], teammate: null, position: null, nextPlayer: null, teamRoundScore: 0, teamTotalScore: 0 },
        player2: { nickname: '', hand: [], teammate: null, position: null, nextPlayer: null, teamRoundScore: 0, teamTotalScore: 0 },
        player3: { nickname: '', hand: [], teammate: null, position: null, nextPlayer: null, teamRoundScore: 0, teamTotalScore: 0 },
        player4: { nickname: '', hand: [], teammate: null, position: null, nextPlayer: null, teamRoundScore: 0, teamTotalScore: 0 },
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
            biddingPlayer = player;
            // Get the index of the current game bid
            const gameBidIndex = validBids.indexOf(gameBid);

            // Remove bids with lower index than the current game bid
            validBids = validBids.slice(gameBidIndex + 1);
        }

        currentPlayerIndex = (currentPlayerIndex % 4) + 1;
    }
    return {
        gameBid: gameBid,
        biddingPlayer: biddingPlayer,
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

    for (let i = 1; i <= 4; i++) {
        const player = players[`player${i}`];
        displayPlayerHand(player);
        console.log('\n');
    }

    // Call the function to start requesting bids from players
    const gameBid = await requestBids(players);
    return gameBid;
}



async function startSuitedGame(players, gameBid, roundNumber, bidder) {

    function updatePlayableCards(player, requestedSuit, currentTaker, winningCard, gameBid) {

        console.log("\n");
        console.log("current player is: " + player.nickname);
        console.log(requestedSuit + " is requested suit");
        console.log("current taker is: " + currentTaker.nickname);
        console.log("winning card: " + winningCard.rank + " of " + winningCard.suit);
        console.log("game bid: " + gameBid);

        const hasRequestedSuit = player.hand.some(card => card.suit === requestedSuit);

        if (hasRequestedSuit) {
            player.hand.forEach(card => {
                if (card.suit !== requestedSuit) {
                    card.isPlayable = false;
                }
            });
            if (requestedSuit === gameBid) {

                console.log("requested suit is game bid");
                let hasOverTrump = false;

                player.hand.forEach(card => {
                    if (card.isTrump && (compareCardRankTrump(card, winningCard) > 0)) {
                        hasOverTrump = true;
                    }
                });
                console.log("has over trump: " + hasOverTrump);
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

                    console.log("winning card is trump");
                    let hasOverTrump = false;

                    player.hand.forEach(card => {
                        if (card.isTrump && (compareCardRankTrump(card, winningCard) > 0)) {
                            hasOverTrump = true;
                        }
                    });
                    console.log("has over trump: " + hasOverTrump);
                    if (hasOverTrump) {
                        player.hand.forEach(card => {
                            if ((!card.isTrump) || (card.isTrump && !(compareCardRankTrump(card, winningCard) > 0))) {
                                card.isPlayable = false;
                            }
                        });
                    }
                    else {
                        player.hand.forEach(card => {
                            if (!card.isTrump) {
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
            selectedCardIndex = await getPlayerCardIndex(player) - 1;
            currentTaker = player;
            winningCard = player.hand[selectedCardIndex];
            requestedSuit = player.hand[selectedCardIndex].suit;
        } else {
            player = Object.values(players).find(player => player.position === currentPlayerIndex);
            updatePlayableCards(player, requestedSuit, currentTaker, winningCard, gameBid);
            console.log("\n");
            selectedCardIndex = await getPlayerCardIndex(player) - 1;
        }

        const selectedCard = player.hand[selectedCardIndex]; // Get the selected card
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
        currentTaker.teamRoundScore += 10;
        currentTaker.teammate.teamRoundScore += 10;

        totalRoundScore = player1.teamRoundScore + player2.teamRoundScore;

        if (bidder.teamRoundScore > totalRoundScore / 2) {
            bidderHardPoints = bidder.teamRoundScore / 10;
            bidderLastPointValue = bidder.teamRoundScore % 10;

            opponetHardPoints = bidder.nextPlayer.teamRoundScore / 10;
            opponentLastPointValue = bidder.nextPlayer.teamRoundScore % 10;

            if (bidderLastPointValue === opponentLastPointValue) {
                if (bidderHardPoints < opponetHardPoints) {
                    bidderHardPoints += 1;
                } else {
                    opponetHardPoints += 1;
                }
            } else {
                if (bidderLastPointValue >= 6) {
                    bidderHardPoints += 1;
                }
                if (opponentLastPointValue >= 6) {
                    opponetHardPoints += 1;
                }
            }
            bidder.teamTotalScore += bidderHardPoints;
            bidder.nextPlayer.teamTotalScore += opponetHardPoints;

            winners = [bidder, bidder.teammate]

        } else if (bidder.teamRoundScore === totalRoundScore / 2) {
            bidder.nextPlayer.teamTotalScore += totalRoundScore / 2;
            bidder.nextPlayer.teammate.teamTotalScore += totalRoundScore / 2;
            hangingPoints = totalRoundScore / 2;
        } else {
            bidder.nextPlayer.teamTotalScore += totalRoundScore;
            bidder.nextPlayer.teammate.teamTotalScore += totalRoundScore;

            winners = [bidder.nextPlayer, bidder.nextPlayer.teammate]
        }
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

        const biddingResult = await biddingPhase(players);
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
        console.log('\n');
        displayPlayerHand(player);
    }

    // Display players
    displayPlayers(players);

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
                gameResult = await startSuitedGame(players, biddingResult.gameBid, i, biddingResult.biddingPlayer);
                break;
            case "No Trumps":
                gameResult = await startNoTrumpsGame();
                break;
            case "All Trumps":
                gameResult = await startAllTrumpsGame();
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

async function startNoTrumpsGame() {

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
        currentTaker.teamRoundScore += 10;
        currentTaker.teammate.teamRoundScore += 10;

        totalRoundScore = 2 * (player1.teamRoundScore + player2.teamRoundScore);

        if (bidder.teamRoundScore > totalRoundScore / 2) {
            bidderHardPoints = bidder.teamRoundScore / 10;
            bidderLastPointValue = bidder.teamRoundScore % 10;

            opponetHardPoints = bidder.nextPlayer.teamRoundScore / 10;
            opponentLastPointValue = bidder.nextPlayer.teamRoundScore % 10;

            if (bidderLastPointValue === opponentLastPointValue) {
                if (bidderHardPoints < opponetHardPoints) {
                    bidderHardPoints += 1;
                } else {
                    opponetHardPoints += 1;
                }
            } else {
                if (bidderLastPointValue >= 5) {
                    bidderHardPoints += 1;
                }
                if (opponentLastPointValue >= 5) {
                    opponetHardPoints += 1;
                }
            }
            bidder.teamTotalScore += bidderHardPoints;
            bidder.nextPlayer.teamTotalScore += opponetHardPoints;

            winners = [bidder, bidder.teammate]

        } else if (bidder.teamRoundScore === totalRoundScore / 2) {
            bidder.nextPlayer.teamTotalScore += totalRoundScore / 2;
            bidder.nextPlayer.teammate.teamTotalScore += totalRoundScore / 2;
            hangingPoints = totalRoundScore / 2;
        } else {
            bidder.nextPlayer.teamTotalScore += totalRoundScore;
            bidder.nextPlayer.teammate.teamTotalScore += totalRoundScore;

            winners = [bidder.nextPlayer, bidder.nextPlayer.teammate]
        }
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

async function startAllTrumpsGame() {
    function updatePlayableCards(player, requestedSuit) {
        if (player.hand.some(card => card.suit === requestedSuit)) {

            let hasOverTrump = false;
            player.hand.forEach(card => {
                if (card.isTrump && (compareCardRankTrump(card, winningCard) > 0)) {
                    hasOverTrump = true;
                }
            });
            console.log("has over trump: " + hasOverTrump);
            if (hasOverTrump) {
                player.hand.forEach(card => {
                    if (card.isTrump && !(compareCardRankTrump(card, winningCard) > 0)) {
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
        currentTaker.teamRoundScore += 10;
        currentTaker.teammate.teamRoundScore += 10;

        totalRoundScore = player1.teamRoundScore + player2.teamRoundScore;

        if (bidder.teamRoundScore > totalRoundScore / 2) {
            bidderHardPoints = bidder.teamRoundScore / 10;
            bidderLastPointValue = bidder.teamRoundScore % 10;

            opponetHardPoints = bidder.nextPlayer.teamRoundScore / 10;
            opponentLastPointValue = bidder.nextPlayer.teamRoundScore % 10;

            if (bidderLastPointValue === opponentLastPointValue) {
                if (bidderHardPoints < opponetHardPoints) {
                    bidderHardPoints += 1;
                } else {
                    opponetHardPoints += 1;
                }
            } else {
                if (bidderLastPointValue >= 4) {
                    bidderHardPoints += 1;
                }
                if (opponentLastPointValue >= 4) {
                    opponetHardPoints += 1;
                }
            }
            bidder.teamTotalScore += bidderHardPoints;
            bidder.nextPlayer.teamTotalScore += opponetHardPoints;

            winners = [bidder, bidder.teammate]

        } else if (bidder.teamRoundScore === totalRoundScore / 2) {
            bidder.nextPlayer.teamTotalScore += totalRoundScore / 2;
            bidder.nextPlayer.teammate.teamTotalScore += totalRoundScore / 2;
            hangingPoints = totalRoundScore / 2;
        } else {
            bidder.nextPlayer.teamTotalScore += totalRoundScore;
            bidder.nextPlayer.teammate.teamTotalScore += totalRoundScore;

            winners = [bidder.nextPlayer, bidder.nextPlayer.teammate]
        }
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

    console.log(players.player1.teamTotalScore < 151)
    console.log(players.player2.teamTotalScore < 151)
    console.log(players.player1.teamTotalScore === players.player2.teamTotalScore)
    console.log(players.player1.teamTotalScore >= 151)
    while (players.player1.teamTotalScore < 151 && players.player2.teamTotalScore < 151 || (players.player1.teamTotalScore === players.player2.teamTotalScore && players.player1.teamTotalScore >= 151)) {
        await startBeloteRound(players);
    }

    if (players.player1.teamTotalScore > players.player2.teamTotalScore) {
        console.log(`${players.player1.nickname} and ${players.player3.nickname} won!`);
    } else {
        console.log(`${players.player2.nickname} and ${players.player4.nickname} won!`);
    }
}

startBeloteGame();
