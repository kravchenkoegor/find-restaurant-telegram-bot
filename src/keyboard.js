const kb = require ('./keyboard-buttons')

module.exports = {
  home: [
    [kb.home.business, kb.home.cuisine],
    [kb.home.type, kb.home.random],
    [kb.home.delivery],
    //[kb.favourite]
  ],
  business: [
    [kb.business.cheap, kb.business.medium],
    [kb.business.expensive],
    [kb.back]
  ],
  cuisine: [
    // [
    //   {
    //     text: 'Отправить местоположение',
    //     request_location: true
    //   }
    // ],
    [kb.cuisine.russian, kb.cuisine.georgian],
    [kb.cuisine.italian, kb.cuisine.japan],
    [kb.back]
  ],
  type: [
    [kb.type.fastfood, kb.type.cafe],
    [kb.type.restaurants, kb.type.bars],
    [kb.type.coffee, kb.type.dinner],
    [kb.back]
  ]
}