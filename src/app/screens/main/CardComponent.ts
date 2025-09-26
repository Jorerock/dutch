import { Container, Graphics, Text } from "pixi.js";
import type { Card } from "../../dutch/dutchGame";

export class CardComponent extends Container {
  constructor(card: Card | null, onClick?: () => void) {
    super();
    const cardW = 50;
    const cardH = 70;
    const cardGraphics = new Graphics();
    cardGraphics.beginFill(0xffffff).drawRect(0, 0, cardW, cardH).endFill();
    cardGraphics.interactive = !!onClick;
    if (onClick) cardGraphics.on("pointerdown", onClick);
    this.addChild(cardGraphics);

    if (card) {
      const names = { 1: "A", 11: "J", 12: "Q", 13: "K" };
      const v = names[card.value as 1 | 11 | 12 | 13] || card.value;
      const s = { hearts: "♥", diamonds: "♦", clubs: "♣", spades: "♠" }[
        card.suit
      ];
      const label = `${v}${s}`;
      const cardText = new Text(label, { fontSize: 20, fill: 0x000000 });
      cardText.x = 8;
      cardText.y = 22;
      this.addChild(cardText);
    }
  }
}

export class EllementComponent extends Container {
  constructor(card: Card | null, onClick?: () => void) {
    super();
    const cardW = 50;
    const cardH = 70;
    const cardGraphics = new Graphics();
    cardGraphics.beginFill(0xffffff).drawRect(0, 0, cardW, cardH).endFill();
    cardGraphics.interactive = !!onClick;
    if (onClick) cardGraphics.on("pointerdown", onClick);
    this.addChild(cardGraphics);

    if (card) {
      const names = { 1: "A", 11: "J", 12: "Q", 13: "K" };
      const v = names[card.value as 1 | 11 | 12 | 13] || card.value;
      const s = { hearts: "♥", diamonds: "♦", clubs: "♣", spades: "♠" }[
        card.suit
      ];
      const label = `${v}${s}`;
      const cardText = new Text(label, { fontSize: 20, fill: 0x000000 });
      cardText.x = 8;
      cardText.y = 22;
      this.addChild(cardText);
    }
  }
}
