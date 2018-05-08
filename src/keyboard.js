const kb = require ('./keyboard-buttons')

module.exports = {
  home: [
    [kb.home.type, kb.home.random]
  ],
  type: [
    [kb.type.fastfood, kb.type.cafe],
    [kb.type.restaurants, kb.type.bars],
    [kb.type.coffee, kb.back]
  ]
}