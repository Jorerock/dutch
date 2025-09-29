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
    deck?: CardComponent; // Changé de Graphics à CardComponent
    discard?: CardComponent; // Changé de Graphics à CardComponent
    dutchBtn?: Graphics;
    dutchBtnText?: Text;
    hands?: Container[];
    cardTexts?: Text[];
    discardLabel?: Text;
    scores?: Text[];
    [key: string]:
      | Graphics
      | Text
      | Container[]
      | Text[]
      | CardComponent
      | undefined;
    drawnCardDisplay?: Container;
  } = {};

  constructor() {
    super();
    // Démarre une partie à 2 joueurs pour la démo
    this.state = startRound(["Joueur 1", "Joueur 2"]);
    this.createUI();
    this.renderState();
  }

  private createUI() {
    // Zone de pioche - utilise CardComponent avec carte face cachée (null)
    const deckCard = new CardComponent(null, () => this.onDraw(false));
    this.addChild(deckCard);
    this.ui.deck = deckCard;

    // Zone de pile de rejet - sera mise à jour dans renderState()
    const discardCard = new CardComponent(null, () => this.onDraw(true));
    this.addChild(discardCard);
    this.ui.discard = discardCard;

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
    deckCard.x = 0;
    deckCard.y = 0;
    discardCard.x = 120; // Espacé pour tenir compte de la largeur des cartes
    discardCard.y = 0;
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
    // TODO DEFinir Emplacement pour jouer a plus de joueur
    const positions = [
      { y: margin, label: "top" }, // Joueur 1 en haut
      { y: height - cardH - margin, label: "bottom" }, // Joueur 2 en bas
    ];

    // Affiche la main de chaque joueur
    this.state.players.forEach((player, pIdx) => {
      const n = player.hand.length;
      const totalWidth = n * cardW + (n - 1) * 20;
      const baseX = Math.max((width - totalWidth) / 2, margin);
      const y = positions[pIdx]?.y || margin;

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

    // Met à jour la pile de rejet avec la carte du dessus
    if (this.ui.discard && this.state.discardPile.length > 0) {
      // Supprimer l'ancienne carte de rejet
      this.removeChild(this.ui.discard);

      // Créer une nouvelle carte avec la carte du dessus de la pile
      const topCard = this.state.discardPile[this.state.discardPile.length - 1];
      const newDiscardCard = new CardComponent(topCard, () =>
        this.onDraw(true),
      );
      this.addChild(newDiscardCard);
      this.ui.discard = newDiscardCard;
    } else if (this.ui.discard && this.state.discardPile.length === 0) {
      // Si la pile est vide, afficher une carte vide
      this.removeChild(this.ui.discard);
      const emptyDiscardCard = new CardComponent(null, () => this.onDraw(true));
      this.addChild(emptyDiscardCard);
      this.ui.discard = emptyDiscardCard;
    }

    // Repositionne la pioche et la pile de rejet
    if (this.ui.deck) {
      this.ui.deck.x = width / 2 - 140;
      this.ui.deck.y = height / 2 - 50; // Ajusté pour la hauteur des cartes
    }
    if (this.ui.discard) {
      this.ui.discard.x = width / 2 + 60; // Ajusté pour l'espacement entre les cartes
      this.ui.discard.y = height / 2 - 50;
    }

    // Repositionne le bouton Dutch
    if (this.ui.dutchBtn) {
      this.ui.dutchBtn.x = width / 2 - 50;
      this.ui.dutchBtn.y = height - 80;
    }
    if (this.ui.dutchBtnText) {
      this.ui.dutchBtnText.x = width / 2 - 20;
      this.ui.dutchBtnText.y = height - 70;
    }

    // Ajouter des indicateurs visuels pour le joueur courant
    this.state.players.forEach((player, pIdx) => {
      const n = player.hand.length;
      const totalWidth = n * cardW + (n - 1) * 20;
      const baseX = Math.max((width - totalWidth) / 2, margin);
      const y = positions[pIdx]?.y || margin;

      // Indicateur pour le joueur courant
      if (pIdx === this.state!.currentPlayer && !this.drawnCard) {
        const indicator = new Text("← Votre tour", {
          fontSize: 18,
          fill: 0x00ff00,
        });
        indicator.x = baseX - 100;
        indicator.y = y + 60;
        this.addChild(indicator);
      }

      // Mettre en surbrillance les cartes échangeables
      if (pIdx === this.state!.currentPlayer && this.drawnCard) {
        player.hand.forEach((card, cIdx) => {
          const cardComponent = new CardComponent(card, () =>
            this.onExchange(pIdx, cIdx),
          );

          // Ajouter un effet visuel (bordure verte)
          const highlight = new Graphics();
          highlight.lineStyle(3, 0x00ff00);
          highlight.drawRect(-2, -2, 84, 104); // Ajusté aux dimensions de CardComponent
          cardComponent.addChild(highlight);

          cardComponent.x = baseX + cIdx * (cardW + 20);
          cardComponent.y = y;
          this.addChild(cardComponent);
          this.ui.hands!.push(cardComponent);
        });
      }
    });

    // Ajouter des labels pour identifier les zones
    this.addDeckLabels(width, height);
  }

  private addDeckLabels(width: number, height: number) {
    // Label pour la pioche
    const deckLabel = new Text("Pioche", {
      fontSize: 14,
      fill: 0xffffff,
      fontWeight: "bold",
    });
    deckLabel.anchor.set(0.5);
    deckLabel.x = width / 2 - 140 + 40; // Centre de la carte de pioche
    deckLabel.y = height / 2 + 60; // Sous la carte
    this.addChild(deckLabel);

    // Label pour la pile de rejet
    const discardLabel = new Text("Défausse", {
      fontSize: 14,
      fill: 0xffffff,
      fontWeight: "bold",
    });
    discardLabel.anchor.set(0.5);
    discardLabel.x = width / 2 + 60 + 40; // Centre de la carte de défausse
    discardLabel.y = height / 2 + 60; // Sous la carte
    this.addChild(discardLabel);
  }

  // private cardLabel(card: Card): string {
  //   const names = { 1: "A", 11: "J", 12: "Q", 13: "K" };
  //   const v = names[card.value as 1 | 11 | 12 | 13] || card.value;
  //   const s = { hearts: "♥", diamonds: "♦", clubs: "♣", spades: "♠" }[
  //     card.suit
  //   ];
  //   return `${v}${s}`;
  // }

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
    const cardComponent = new CardComponent(this.drawnCard, () =>
      this.onDiscardDrawnCard(),
    );
    cardComponent.x = 0;
    cardComponent.y = 0;
    drawnCardContainer.addChild(cardComponent);

    // Ajouter un texte explicatif
    const instructionText = new Text("Cliquez sur une carte pour l'échanger", {
      fontSize: 16,
      fill: 0xffffff,
    });
    instructionText.x = 0;
    instructionText.y = 110; // Ajusté pour la hauteur des cartes
    drawnCardContainer.addChild(instructionText);

    // Positionner le conteneur (par exemple au centre-gauche)
    const width = window.innerWidth;
    const height = window.innerHeight;
    drawnCardContainer.x = width / 4;
    drawnCardContainer.y = height / 2 - 50;

    this.addChild(drawnCardContainer);
    this.ui.drawnCardDisplay = drawnCardContainer;
  }

  private onDiscardDrawnCard() {
    if (!this.state || !this.drawnCard) {
      alert("Vous devez d'abord piocher une carte !");
      return;
    }

    // Ajouter la carte piochée directement à la pile de rejet
    this.state.discardPile.push(this.drawnCard);

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
