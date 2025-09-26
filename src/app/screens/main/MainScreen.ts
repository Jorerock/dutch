import type { Ticker } from "pixi.js";
import { Container, Text, Graphics } from "pixi.js";
import {
  startRound,
  drawCard,
  removeDrawnCard,
  exchangeCard,
  playSpecialCard,
  callDutch,
  computeScores,
  isGameOver,
  GameState,
  Card,
} from "../../dutch/dutchGame";
import { CardComponent } from "./CardComponent";

export class MainScreen extends Container {
  private state: GameState | null = null;
  private drawnCard: Card | null = null;
  private ui: {
    deck?: Graphics;
    discard?: Graphics;
    dutchBtn?: Graphics;
    dutchBtnText?: Text;
    hands?: Container[]; // <-- Remplace Graphics[] par Container[]
    cardTexts?: Text[];
    discardLabel?: Text;
    scores?: Text[];
    [key: string]: Graphics | Text | Container[] | Text[] | undefined;
    drawnCardDisplay?: Container; // Pour afficher la carte piochée
  } = {};

  constructor() {
    super();
    // Démarre une partie à 2 joueurs pour la démo
    this.state = startRound(["Joueur 1", "Joueur 2"]);
    this.createUI();
    this.renderState();
  }

  private createUI() {
    // Zone de pioche
    const deckGfx = new Graphics();
    deckGfx.rect(0, 0, 60, 90).fill({ color: 0x444488 });
    deckGfx.interactive = true;
    deckGfx.on("pointerdown", () => this.onDraw(false));
    this.addChild(deckGfx);
    this.ui.deck = deckGfx;

    // Zone de pile de rejet
    const discardGfx = new Graphics();
    discardGfx.rect(0, 0, 60, 90).fill({ color: 0x884444 });
    discardGfx.interactive = true;
    discardGfx.on("pointerdown", () => this.onDraw(true));
    this.addChild(discardGfx);
    this.ui.discard = discardGfx;

    // Bouton Dutch
    const dutchBtn = new Graphics();
    dutchBtn.rect(0, 0, 100, 40).fill({ color: 0x228822 });
    dutchBtn.interactive = true;
    dutchBtn.on("pointerdown", () => this.onDutch());
    this.addChild(dutchBtn);
    this.ui.dutchBtn = dutchBtn;

    const dutchText = new Text("Dutch", { fontSize: 20, fill: 0xffffff });
    this.addChild(dutchText);
    this.ui.dutchBtnText = dutchText;

    // Positionnement initial (sera recalculé dans renderState)
    deckGfx.x = 0;
    deckGfx.y = 0;
    discardGfx.x = 80;
    discardGfx.y = 0;
    dutchBtn.x = 0;
    dutchBtn.y = 120;
    dutchText.x = dutchBtn.x + 20;
    dutchText.y = dutchBtn.y + 10;
  }

  private renderState() {
    if (this.ui.hands) {
      for (const container of this.ui.hands) {
        this.removeChild(container);
      }
    }
    this.ui.hands = [];

    if (!this.state) return;

    // Responsive : récupère la taille de l'écran
    const width = window.innerWidth;
    const height = window.innerHeight;
    console.log("Screen size: %dx%d", width, height);

    // Paramètres de taille
    const cardW = 100;
    const cardH = 140;
    const margin = 40;

    // Positions prédéfinies
    const positions = [
      { y: margin, label: "top" }, // Joueur 1 en haut
      { y: height - cardH - margin, label: "bottom" }, // Joueur 2 en bas
    ];

    // Affiche la main de chaque joueur
    this.state.players.forEach((player, pIdx) => {
      const n = player.hand.length;
      const totalWidth = n * cardW + (n - 1) * 20;
      const baseX = Math.max((width - totalWidth) / 2, margin);
      const y = positions[pIdx]?.y || margin; // Fallback sur margin si plus de 2 joueurs
      player.hand.forEach((card, cIdx) => {
        const cardComponent = new CardComponent(card, () =>
          this.onExchange(pIdx, cIdx),
        );
        cardComponent.x = baseX + cIdx * (cardW + 20);
        cardComponent.y = y;
        this.addChild(cardComponent);
        this.ui.hands!.push(cardComponent);
      });
    });

    // Affiche le dessus de la pile de rejet
    if (this.ui.discardLabel) this.removeChild(this.ui.discardLabel);
    if (this.state.discardPile.length > 0) {
      const top = this.state.discardPile[this.state.discardPile.length - 1];
      const t = new Text(this.cardLabel(top), { fontSize: 22, fill: 0xffffff });
      t.x = width / 2 + 80;
      t.y = height / 2 - 45;
      this.addChild(t);
      this.ui.discardLabel = t;
    }

    // // // Affiche scores à droite de chaque main
    // // TODO : faire un tableau de scores en haut à droite
    // if (this.ui.scores) for (const s of this.ui.scores) this.removeChild(s);
    // this.ui.scores = [];
    // this.state.players.forEach((player, idx) => {
    //   const t = new Text(`${player.name}: ${player.score} pts`, {
    //     fontSize: 18,
    //     fill: 0xffffff,
    //   });
    //   t.x = width - 180;
    //   t.y = margin + idx * spacingY + 20;
    //   this.addChild(t);
    //   this.ui.scores.push(t);
    // });

    // Repositionne la pioche et le bouton Dutch
    if (this.ui.deck) {
      this.ui.deck.x = width / 2 - 140;
      this.ui.deck.y = height / 2 - 45;
    }
    if (this.ui.discard) {
      this.ui.discard.x = width / 2 + 70;
      this.ui.discard.y = height / 2 - 45;
    }
    if (this.ui.dutchBtn) {
      this.ui.dutchBtn.x = width / 2 - 50;
      this.ui.dutchBtn.y = height - 80;
    }
    if (this.ui.dutchBtnText) {
      this.ui.dutchBtnText.x = width / 2 - 20;
      this.ui.dutchBtnText.y = height - 70;
    }

    this.state.players.forEach((player, pIdx) => {
      const n = player.hand.length;
      const totalWidth = n * cardW + (n - 1) * 20;
      const baseX = Math.max((width - totalWidth) / 2, margin);
      const y = positions[pIdx]?.y || margin;

      // Ajouter un indicateur visuel pour le joueur courant
      if (pIdx === this.state!.currentPlayer && !this.drawnCard) {
        const indicator = new Text("← Votre tour", {
          fontSize: 18,
          fill: 0x00ff00,
        });
        indicator.x = baseX - 100;
        indicator.y = y + 60;
        this.addChild(indicator);
      }

      player.hand.forEach((card, cIdx) => {
        const cardComponent = new CardComponent(card, () =>
          this.onExchange(pIdx, cIdx),
        );

        // Mettre en surbrillance les cartes échangeables
        if (pIdx === this.state!.currentPlayer && this.drawnCard) {
          // Ajouter un effet visuel (bordure verte par exemple)
          const highlight = new Graphics();
          highlight.lineStyle(3, 0x00ff00);
          highlight.drawRect(-2, -2, 104, 144);
          cardComponent.addChild(highlight);
        }

        cardComponent.x = baseX + cIdx * (cardW + 20);
        cardComponent.y = y;
        this.addChild(cardComponent);
        this.ui.hands!.push(cardComponent);
      });
    });
  }

  private cardLabel(card: Card): string {
    const names = { 1: "A", 11: "J", 12: "Q", 13: "K" };
    const v = names[card.value as 1 | 11 | 12 | 13] || card.value;
    const s = { hearts: "♥", diamonds: "♦", clubs: "♣", spades: "♠" }[
      card.suit
    ];
    return `${v}${s}`;
  }

  private onDraw(fromDiscard: boolean) {
    if (!this.state) return;
    if (this.drawnCard) {
      alert("Vous devez d'abord échanger la carte piochée !");
      return;
    }
    const card = drawCard(this.state, fromDiscard);
    if (!card) return;

    this.drawnCard = card;
    removeDrawnCard(this.state, fromDiscard);
    this.showDrawnCard();
    // // Pour la démo, échange la première carte du joueur courant
    // const old = exchangeCard(this.state, this.state.currentPlayer, 0, card);
    // removeDrawnCard(this.state, fromDiscard);
    // if (old) this.state.discardPile.push(old);
    // // Tour suivant
    // this.state.currentPlayer =
    //   (this.state.currentPlayer + 1) % this.state.players.length;
    // this.renderState();
  }

  private showDrawnCard() {
    if (!this.drawnCard) return;

    // Supprimer l'ancien affichage s'il existe
    if (this.ui.drawnCardDisplay) {
      this.removeChild(this.ui.drawnCardDisplay);
    }

    // Créer un conteneur pour la carte piochée
    const drawnCardContainer = new Container();

    // Créer le composant carte
    const cardComponent = new CardComponent(this.drawnCard);
    cardComponent.x = 0;
    cardComponent.y = 0;
    drawnCardContainer.addChild(cardComponent);

    // Ajouter un texte explicatif
    const instructionText = new Text("Cliquez sur une carte pour l'échanger", {
      fontSize: 16,
      fill: 0xffffff,
    });
    instructionText.x = 0;
    instructionText.y = 80;
    drawnCardContainer.addChild(instructionText);

    // Positionner le conteneur (par exemple au centre-gauche)
    const width = window.innerWidth;
    const height = window.innerHeight;
    drawnCardContainer.x = width / 4;
    drawnCardContainer.y = height / 2 - 50;

    this.addChild(drawnCardContainer);
    this.ui.drawnCardDisplay = drawnCardContainer;
  }

  private onExchange(pIdx: number, cIdx: number) {
    if (!this.state || !this.drawnCard) {
      alert("Vous devez d'abord piocher une carte !");
      return;
    }

    // Vérifier que c'est le tour du bon joueur
    if (pIdx !== this.state.currentPlayer) {
      alert("Ce n'est pas le tour de ce joueur !");
      return;
    }

    // Effectuer l'échange
    const oldCard = exchangeCard(this.state, pIdx, cIdx, this.drawnCard);

    // Ajouter l'ancienne carte à la pile de rejet
    if (oldCard) {
      this.state.discardPile.push(oldCard);
    }

    // Réinitialiser la carte piochée
    this.drawnCard = null;

    // Supprimer l'affichage de la carte piochée
    if (this.ui.drawnCardDisplay) {
      this.removeChild(this.ui.drawnCardDisplay);
      this.ui.drawnCardDisplay = undefined;
    }

    // Passer au joueur suivant
    this.state.currentPlayer =
      (this.state.currentPlayer + 1) % this.state.players.length;

    // Re-rendre l'état du jeu
    this.renderState();
  }

  // // Optionnel : ajouter une méthode pour annuler la pioche
  // private cancelDraw() {
  //   if (!this.drawnCard || !this.state) return;

  //   // Remettre la carte dans la pioche
  //   this.state.deck.push(this.drawnCard);
  //   this.drawnCard = null;

  //   // Supprimer l'affichage
  //   if (this.ui.drawnCardDisplay) {
  //     this.removeChild(this.ui.drawnCardDisplay);
  //     this.ui.drawnCardDisplay = undefined;
  //   }

  //   this.renderState();
  // }

  private onDutch() {
    if (!this.state) return;
    callDutch(this.state, this.state.currentPlayer);
    computeScores(this.state);
    this.renderState();
    if (isGameOver(this.state)) {
      alert("Partie terminée !");
    }
  }

  /** Prepare the screen just before showing */
  public prepare() {
    // Peut être utilisé pour réinitialiser la partie
  }

  /** Update the screen */
  public update(_time: Ticker) {}

  /** Pause gameplay - automatically fired when a popup is presented */
  public async pause() {}
  /** Resume gameplay */
  public async resume() {}
  /** Fully reset */
  public reset() {
    this.state = startRound(["Joueur 1", "Joueur 2"]);
    this.renderState();
  }

  /** Resize the screen, fired whenever window size changes */
  public resize(width: number, height: number) {
    // Re-rend l'UI à chaque redimensionnement
    this.renderState();
  }

  /** Show screen with animations */
  public async show(): Promise<void> {
    this.renderState();
  }

  /** Hide screen with animations */
  public async hide() {}

  /** Auto pause the app when window go out of focus */
  public blur() {}
}
