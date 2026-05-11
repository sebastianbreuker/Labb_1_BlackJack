import { rankOf } from "./deck.js";

const cardValue = (card) => {
  const rank = rankOf(card);
  if (rank === "A") return 11;
  if (rank === "J" || rank === "Q" || rank === "K") return 10;
  return parseInt(rank, 10);
};

export const calculateScore = (hand) => {
  let total = 0;
  let aces  = 0;

  for (const card of hand) {
    total += cardValue(card);
    if (rankOf(card) === "A") aces++;
  }

  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }

  return total;
};

export const isBust = (hand) => calculateScore(hand) > 21;

export const isBlackjack = (hand) =>
  hand.length === 2 && calculateScore(hand) === 21;
