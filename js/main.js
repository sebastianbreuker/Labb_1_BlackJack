import { calculateScore } from "./score.js";
import {
  getState,
  startRound,
  hit,
  stand,
  double,
  split,
  canDouble,
  canSplit,
  deposit,
  prepareNextRound,
} from "./game.js";

const VALID_USERNAME = "admin";
const VALID_PASSWORD = "admin";

const loginScreen   = document.getElementById("login-screen");
const gameScreen    = document.getElementById("game-screen");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginButton   = document.getElementById("login-button");
const loginError    = document.getElementById("login-error");

const attemptLogin = () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (username === VALID_USERNAME && password === VALID_PASSWORD) {
    loginError.textContent = "";
    loginScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");
    render();
  } else {
    loginError.textContent = "Fel användarnamn eller lösenord";
  }
};

loginButton.addEventListener("click", attemptLogin);
[usernameInput, passwordInput].forEach((input) => {
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") attemptLogin(); });
});

const balanceEl     = document.getElementById("balance");
const dealerScoreEl = document.getElementById("dealer-score");
const dealerCardsEl = document.getElementById("dealer-cards");
const playerScoreEl = document.getElementById("player-score");
const playerHandsEl = document.getElementById("player-hands");
const resultEl      = document.getElementById("result");

const betBar    = document.getElementById("bet-bar");
const actionBar = document.getElementById("action-bar");
const roundBar  = document.getElementById("round-bar");

const betInput       = document.getElementById("bet-input");
const dealButton     = document.getElementById("deal-button");
const hitButton      = document.getElementById("hit-button");
const standButton    = document.getElementById("stand-button");
const doubleButton   = document.getElementById("double-button");
const splitButton    = document.getElementById("split-button");
const newRoundButton = document.getElementById("new-round-button");
const depositButton  = document.getElementById("deposit-button");

const buildCardListItem = (cardName) => {
  const li  = document.createElement("li");
  const img = document.createElement("img");
  img.src = `pictures/${cardName}.png`;
  img.alt = cardName === "Hidden-Card" ? "Dolt kort" : cardName;
  li.appendChild(img);
  return li;
};

const renderDealer = (state) => {
  dealerCardsEl.innerHTML = "";

  if (state.dealerHand.length === 0) {
    dealerCardsEl.appendChild(buildCardListItem("Hidden-Card"));
    dealerCardsEl.appendChild(buildCardListItem("Hidden-Card"));
    dealerScoreEl.textContent = "—";
    return;
  }

  state.dealerHand.forEach((card, index) => {
    const showName = (state.dealerHidden && index === 1) ? "Hidden-Card" : card;
    dealerCardsEl.appendChild(buildCardListItem(showName));
  });

  if (state.dealerHidden) {
    dealerScoreEl.textContent = calculateScore([state.dealerHand[0]]);
  } else {
    dealerScoreEl.textContent = calculateScore(state.dealerHand);
  }
};

const renderPlayerHands = (state) => {
  playerHandsEl.innerHTML = "";

  if (state.playerHands.length === 0) {
    playerScoreEl.textContent = "—";

    const wrapper = document.createElement("div");
    wrapper.className = "hand";

    const cards = document.createElement("ul");
    cards.className = "cards";
    cards.appendChild(buildCardListItem("Hidden-Card"));
    cards.appendChild(buildCardListItem("Hidden-Card"));
    wrapper.appendChild(cards);

    playerHandsEl.appendChild(wrapper);
    return;
  }

  const scores = state.playerHands.map((hand) => calculateScore(hand.cards));
  playerScoreEl.textContent = scores.join(" / ");

  state.playerHands.forEach((hand, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "hand";
    if (state.phase === "playing"
        && index === state.activeHandIndex
        && !hand.done) {
      wrapper.classList.add("active");
    }

    const header = document.createElement("div");
    header.className = "hand-header";
    header.innerHTML = `<span>Insats: ${hand.bet} kr</span>`;
    wrapper.appendChild(header);

    const cards = document.createElement("ul");
    cards.className = "cards";
    hand.cards.forEach((card) => cards.appendChild(buildCardListItem(card)));
    wrapper.appendChild(cards);

    playerHandsEl.appendChild(wrapper);
  });
};

const renderBars = (state) => {
  betBar.classList.toggle("hidden",    state.phase !== "betting");
  actionBar.classList.toggle("hidden", state.phase !== "playing");
  roundBar.classList.toggle("hidden",  state.phase !== "roundOver");

  doubleButton.disabled = !canDouble();
  splitButton.disabled  = !canSplit();

  const betValue = parseInt(betInput.value, 10) || 0;
  dealButton.disabled = betValue <= 0 || betValue > state.balance;
};

const render = () => {
  const state = getState();
  balanceEl.textContent = state.balance;
  resultEl.textContent  = state.resultMessage;
  renderDealer(state);
  renderPlayerHands(state);
  renderBars(state);
};

dealButton.addEventListener("click", () => {
  const bet = parseInt(betInput.value, 10);
  startRound(bet);
  render();
});

hitButton.addEventListener("click",     () => { hit();              render(); });
standButton.addEventListener("click",   () => { stand();            render(); });
doubleButton.addEventListener("click",  () => { double();           render(); });
splitButton.addEventListener("click",   () => { split();            render(); });
newRoundButton.addEventListener("click",() => { prepareNextRound(); render(); });
depositButton.addEventListener("click", () => { deposit();          render(); });

betInput.addEventListener("input", render);
