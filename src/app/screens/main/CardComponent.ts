import { Container, Graphics, Text } from "pixi.js";
import type { Card } from "../../dutch/dutchGame";

export class CardComponent extends Container {
  constructor(card: Card | null, onClick?: () => void) {
    super();

    const cardW = 80;
    const cardH = 100;

    // Fond de carte avec bordures arrondies et ombre
    const cardGraphics = new Graphics();

    // Ombre
    const shadow = new Graphics();
    shadow
      .roundRect(3, 3, cardW, cardH, 8)
      .fill({ color: 0x000000, alpha: 0.3 });
    this.addChild(shadow);

    // Carte principale
    cardGraphics.roundRect(0, 0, cardW, cardH, 8).fill({ color: 0xffffff });
    cardGraphics
      .roundRect(0, 0, cardW, cardH, 8)
      .stroke({ color: 0xcccccc, width: 1 });

    cardGraphics.interactive = !!onClick;
    if (onClick) {
      cardGraphics.on("pointerdown", onClick);
      cardGraphics.cursor = "pointer";

      // Effets de survol
      cardGraphics.on("pointerover", () => {
        cardGraphics.clear();
        cardGraphics.roundRect(0, 0, cardW, cardH, 8).fill({ color: 0xf8f8ff });
        cardGraphics
          .roundRect(0, 0, cardW, cardH, 8)
          .stroke({ color: 0x4169e1, width: 2 });
      });

      cardGraphics.on("pointerout", () => {
        cardGraphics.clear();
        cardGraphics.roundRect(0, 0, cardW, cardH, 8).fill({ color: 0xffffff });
        cardGraphics
          .roundRect(0, 0, cardW, cardH, 8)
          .stroke({ color: 0xcccccc, width: 1 });
      });
    }

    this.addChild(cardGraphics);

    if (card) {
      const names = { 1: "A", 11: "J", 12: "Q", 13: "K" };
      const v = names[card.value as 1 | 11 | 12 | 13] || card.value.toString();
      const suits = {
        hearts: { symbol: "♥", color: 0xdc143c },
        diamonds: { symbol: "♦", color: 0xdc143c },
        clubs: { symbol: "♣", color: 0x000000 },
        spades: { symbol: "♠", color: 0x000000 },
      };

      const suit = suits[card.suit];

      // Valeur en haut à gauche
      const valueText = new Text(v, {
        fontSize: 16,
        fill: suit.color,
        fontWeight: "bold",
      });
      valueText.x = 8;
      valueText.y = 8;
      this.addChild(valueText);

      // Symbole en haut à gauche (sous la valeur)
      const suitText = new Text(suit.symbol, {
        fontSize: 14,
        fill: suit.color,
      });
      suitText.x = 8;
      suitText.y = 25;
      this.addChild(suitText);

      // Grand symbole au centre
      const centerSuit = new Text(suit.symbol, {
        fontSize: 32,
        fill: suit.color,
        alpha: 0.3,
      });
      centerSuit.anchor.set(0.5);
      centerSuit.x = cardW / 2;
      centerSuit.y = cardH / 2;
      this.addChild(centerSuit);

      // Valeur en bas à droite (inversée)
      const valueTextBottom = new Text(v, {
        fontSize: 16,
        fill: suit.color,
        fontWeight: "bold",
      });
      valueTextBottom.anchor.set(1, 1);
      valueTextBottom.x = cardW - 20;
      valueTextBottom.y = cardH - 20;
      valueTextBottom.rotation = Math.PI; // Rotation de 180 degrés
      this.addChild(valueTextBottom);

      // Symbole en bas à droite (inversé)
      const suitTextBottom = new Text(suit.symbol, {
        fontSize: 14,
        fill: suit.color,
      });
      suitTextBottom.anchor.set(1, 1);
      suitTextBottom.x = cardW - 8;
      suitTextBottom.y = cardH - 25;
      suitTextBottom.rotation = Math.PI; // Rotation de 180 degrés
      this.addChild(suitTextBottom);
    } else {
      // Carte face cachée
      const backPattern = new Graphics();
      backPattern
        .roundRect(5, 5, cardW - 10, cardH - 10, 5)
        .fill({ color: 0x4169e1 });

      // Motif en damier
      for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 8; j++) {
          if ((i + j) % 2 === 0) {
            const square = new Graphics();
            square
              .rect(8 + i * 11, 8 + j * 11, 10, 10)
              .fill({ color: 0x6495ed });
            backPattern.addChild(square);
          }
        }
      }

      this.addChild(backPattern);
    }
  }
}

// Suppression de la classe EllementComponent dupliquée - utiliser CardComponent à la place
