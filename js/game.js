import { createDeck, shuffleDeck, drawCard, rankOf } from "./deck.js";
import { calculateScore, isBust, isBlackjack }      from "./score.js";

const STARTING_BALANCE = 1000;
const DEPOSIT_AMOUNT   = 500;

const state = {
  deck:           [],
  dealerHand:     [],
  dealerHidden:   false,
  playerHands:    [],
  activeHandIndex: 0,
  balance:        STARTING_BALANCE,
  phase:          "betting",
  resultMessage:  "",
};

export const getState = () => state;

export const deposit = () => {
  state.balance += DEPOSIT_AMOUNT;
};

export const startRound = (bet) => {
  if (state.phase !== "betting" && state.phase !== "roundOver") return;
  if (!Number.isFinite(bet) || bet <= 0 || bet > state.balance) return;

  state.balance -= bet;

  state.deck = createDeck();
  shuffleDeck(state.deck);

  state.dealerHand   = [drawCard(state.deck), drawCard(state.deck)];
  state.dealerHidden = true;
  state.playerHands  = [{
    cards: [drawCard(state.deck), drawCard(state.deck)],
    bet,
    done: false,
  }];
  state.activeHandIndex = 0;
  state.resultMessage   = "";
  state.phase           = "playing";

  const playerBJ = isBlackjack(state.playerHands[0].cards);
  const dealerBJ = isBlackjack(state.dealerHand);
  if (playerBJ || dealerBJ) {
    state.playerHands[0].done = true;
    state.dealerHidden = false;
    state.phase = "roundOver";
    settle();
  }
};

export const hit = () => {
  if (state.phase !== "playing") return;
  const hand = activeHand();
  if (hand.done) return;

  hand.cards.push(drawCard(state.deck));

  const score = calculateScore(hand.cards);
  if (score >= 21) {
    hand.done = true;
    advance();
  }
};

export const stand = () => {
  if (state.phase !== "playing") return;
  const hand = activeHand();
  if (hand.done) return;
  hand.done = true;
  advance();
};

export const canDouble = () => {
  if (state.phase !== "playing") return false;
  const hand = activeHand();
  return hand.cards.length === 2 && !hand.done && state.balance >= hand.bet;
};

export const double = () => {
  if (!canDouble()) return;
  const hand = activeHand();

  state.balance -= hand.bet;
  hand.bet      *= 2;
  hand.cards.push(drawCard(state.deck));
  hand.done = true;
  advance();
};

export const canSplit = () => {
  if (state.phase !== "playing") return false;
  if (state.playerHands.length > 1) return false;
  const hand = activeHand();
  if (hand.cards.length !== 2) return false;
  if (state.balance < hand.bet) return false;
  return rankOf(hand.cards[0]) === rankOf(hand.cards[1]);
};

export const prepareNextRound = () => {
  if (state.phase !== "roundOver") return;
  state.phase          = "betting";
  state.resultMessage  = "";
  state.dealerHand     = [];
  state.dealerHidden   = false;
  state.playerHands    = [];
  state.activeHandIndex = 0;
};

export const split = () => {
  if (!canSplit()) return;
  const hand = activeHand();
  const [c1, c2] = hand.cards;

  state.balance -= hand.bet;

  state.playerHands = [
    { cards: [c1, drawCard(state.deck)], bet: hand.bet, done: false },
    { cards: [c2, drawCard(state.deck)], bet: hand.bet, done: false },
  ];
  state.activeHandIndex = 0;

  if (rankOf(c1) === "A") {
    state.playerHands[0].done = true;
    state.playerHands[1].done = true;
    state.phase = "dealer";
    playDealer();
  }
};

const activeHand = () => state.playerHands[state.activeHandIndex];

const advance = () => {
  if (state.activeHandIndex < state.playerHands.length - 1) {
    state.activeHandIndex++;
  } else {
    state.phase = "dealer";
    playDealer();
  }
};

const playDealer = () => {
  state.dealerHidden = false;

  const everyHandBusted = state.playerHands.every((h) => isBust(h.cards));
  if (!everyHandBusted) {
    while (calculateScore(state.dealerHand) < 17) {
      state.dealerHand.push(drawCard(state.deck));
    }
  }

  state.phase = "roundOver";
  settle();
};

const settle = () => {
  const dealerScore = calculateScore(state.dealerHand);
  const dealerBust  = isBust(state.dealerHand);
  const dealerBJ    = isBlackjack(state.dealerHand);

  const lines = [];

  state.playerHands.forEach((hand, index) => {
    const score    = calculateScore(hand.cards);
    const playerBJ = isBlackjack(hand.cards) && state.playerHands.length === 1;

    let outcome;
    if (isBust(hand.cards))            outcome = "lose";
    else if (playerBJ && !dealerBJ)    outcome = "blackjack";
    else if (playerBJ && dealerBJ)     outcome = "push";
    else if (!playerBJ && dealerBJ)    outcome = "lose";
    else if (dealerBust)               outcome = "win";
    else if (score > dealerScore)      outcome = "win";
    else if (score < dealerScore)      outcome = "lose";
    else                               outcome = "push";

    let payout = 0;
    let text   = "";
    const prefix = state.playerHands.length > 1 ? `Hand ${index + 1}: ` : "";

    if (outcome === "blackjack") {
      const winnings = Math.floor(hand.bet * 1.5);
      payout = hand.bet + winnings;
      text   = `${prefix}Blackjack! Du vinner ${winnings} kr`;
    } else if (outcome === "win") {
      payout = hand.bet * 2;
      text   = `${prefix}Du vinner ${hand.bet} kr`;
    } else if (outcome === "push") {
      payout = hand.bet;
      text   = `${prefix}Lika – du får tillbaka din insats`;
    } else {
      payout = 0;
      text   = `${prefix}Du förlorar ${hand.bet} kr`;
    }

    state.balance += payout;
    lines.push(text);
  });

  state.resultMessage = lines.join("  |  ");
};
