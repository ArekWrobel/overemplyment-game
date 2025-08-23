export default class CardDeck {
  constructor(cards){ this.original = cards.slice(); this.reset(); }
  reset(){ this.cards = this.original.slice(); this.shuffle(); }
  shuffle(){ for (let i=this.cards.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [this.cards[i],this.cards[j]]=[this.cards[j],this.cards[i]]; } }
  draw(){ if (this.cards.length===0) this.reset(); return this.cards.pop(); }
}
