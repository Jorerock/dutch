// Logique principale du jeu Dutch
// (distribution, pioche, pile de rejet, gestion des tours, actions spéciales, scoring)
export type CardSuit = "hearts" | "diamonds" | "clubs" | "spades";
export type CardValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;
export interface Card {
  suit: CardSuit;
  value: CardValue;
}

export interface Player {
  hand: (Card | null)[];
  score: number;
  name: string;
  penalty: number;
}

export interface GameState {
  players: Player[];
  deck: Card[];
  discardPile: Card[];
  currentPlayer: number;
  roundEnded: boolean;
  dutchCalled: boolean;
  dutchCaller: number | null;
}

export function createDeck(): Card[] {
  const suits: CardSuit[] = ["hearts", "diamonds", "clubs", "spades"];
  const deck: Card[] = [];
  for (const suit of suits) {
    for (let value = 1; value <= 13; value++) {
      deck.push({ suit, value: value as CardValue });
    }
  }
  return deck;
}

export function shuffle<T>(array: T[]): T[] {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function startRound(playerNames: string[]): GameState {
  const deck = shuffle(createDeck());
  const players: Player[] = playerNames.map((name) => ({
    hand: [null, null, null, null],
    score: 0,
    name,
    penalty: 0,
  }));
  // Distribution des cartes
  for (let i = 0; i < 4; i++) {
    for (const player of players) {
      player.hand[i] = deck.pop()!;
    }
  }
  // Initialisation de la pile de rejet
  const discardPile = [deck.pop()!];
  return {
    players,
    deck,
    discardPile,
    currentPlayer: 0,
    roundEnded: false,
    dutchCalled: false,
    dutchCaller: null,
  };
}

export function cardPoints(card: Card): number {
  if (card.value === 1) return 1; // As
  if (card.value === 11) return 11; // Valet
  if (card.value === 12) return 10; // Dame
  if (card.value === 13)
    return card.suit === "hearts" || card.suit === "diamonds" ? 0 : 13; // Roi
  return card.value;
}

// Pioche une carte depuis la pioche ou la pile de rejet
export function drawCard(state: GameState, fromDiscard: boolean): Card | null {
  if (fromDiscard) {
    if (state.discardPile.length === 0) return null;
    return state.discardPile[state.discardPile.length - 1];
  } else {
    if (state.deck.length === 0) return null;
    return state.deck[state.deck.length - 1];
  }
}

// Retire la carte piochée du deck ou de la pile de rejet
export function removeDrawnCard(state: GameState, fromDiscard: boolean): void {
  if (fromDiscard) {
    state.discardPile.pop();
  } else {
    state.deck.pop();
  }
}

// Échange une carte de la main du joueur avec une carte piochée
export function exchangeCard(
  state: GameState,
  playerIdx: number,
  handIdx: number,
  card: Card,
): Card | null {
  const oldCard = state.players[playerIdx].hand[handIdx];
  state.players[playerIdx].hand[handIdx] = card;
  return oldCard;
}

// Joue une carte spéciale (Valet, Dame, As, Roi)
export function playSpecialCard(
  state: GameState,
  playerIdx: number,
  handIdx: number,
  card: Card,
  targetPlayerIdx?: number,
  targetHandIdx?: number,
): string {
  // Valet : échange deux cartes sur la table
  if (
    card.value === 11 &&
    targetPlayerIdx !== undefined &&
    targetHandIdx !== undefined
  ) {
    const tmp = state.players[playerIdx].hand[handIdx];
    state.players[playerIdx].hand[handIdx] =
      state.players[targetPlayerIdx].hand[targetHandIdx];
    state.players[targetPlayerIdx].hand[targetHandIdx] = tmp;
    return "valet";
  }
  // Dame : regarder une de ses cartes
  if (card.value === 12) {
    // L'UI peut afficher la carte au joueur
    return "dame";
  }
  // As : donner une carte de la pioche à un joueur
  if (card.value === 1 && targetPlayerIdx !== undefined) {
    const newCard = state.deck.pop();
    if (newCard) {
      for (let i = 0; i < state.players[targetPlayerIdx].hand.length; i++) {
        if (state.players[targetPlayerIdx].hand[i] === null) {
          state.players[targetPlayerIdx].hand[i] = newCard;
          break;
        }
      }
    }
    return "as";
  }
  // Roi : rien à faire ici, le score est géré dans cardPoints
  return "";
}

// Appeler "Dutch"
export function callDutch(state: GameState, playerIdx: number): void {
  state.dutchCalled = true;
  state.dutchCaller = playerIdx;
}

// Calcul des scores à la fin d'une ronde
export function computeScores(state: GameState): void {
  for (const player of state.players) {
    let total = 0;
    for (const card of player.hand) {
      if (card) total += cardPoints(card);
    }
    player.score += total + player.penalty;
    player.penalty = 0;
  }
  // Pénalité Dutch
  if (state.dutchCalled && state.dutchCaller !== null) {
    const minScore = Math.min(
      ...state.players.map((p) =>
        p.hand.reduce((s, c) => s + (c ? cardPoints(c) : 0), 0),
      ),
    );
    const callerScore = state.players[state.dutchCaller].hand.reduce(
      (s, c) => s + (c ? cardPoints(c) : 0),
      0,
    );
    if (callerScore > minScore) {
      state.players[state.dutchCaller].score += 10;
    }
  }
}

// Vérifie si la partie est terminée (un joueur atteint 100 points)
export function isGameOver(state: GameState): boolean {
  return state.players.some((p) => p.score >= 100);
}
