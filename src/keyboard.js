const kb = require ('./keyboard-buttons')

module.exports = {
  home: [[kb.home.places], [kb.home.random]],
  type: [
    [kb.type.fastfood, kb.type.cafe],
    [kb.type.restaurants, kb.type.bars],
    [kb.type.coffee, kb.back]
  ],
  inner: [
    [kb.inner.location], [kb.inner.type],
    [kb.back]
  ],
  innerCafe: [
    [kb.innerCafe.location], [kb.innerCafe.all],
    [kb.back]
  ],
  innerCoffee: [
    [kb.innerCoffee.location], [kb.innerCoffee.all],
    [kb.back]
  ]
}