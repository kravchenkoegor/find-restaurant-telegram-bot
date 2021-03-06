const kb = require ('./keyboard-buttons')

module.exports = {
  home: [
    [kb.home.places],
    [kb.home.random]
  ],
  type: [
    [kb.type.restaurants],
    [kb.type.bars, kb.type.cafe],
    [kb.type.coffee, kb.type.fastfood],
    [kb.back]
  ],
  inner: [
    [kb.inner.location],
    [kb.inner.type],
    [kb.backToHome]
  ],
  sendLocation: [
    [{text: 'Отправить местоположение', request_location: true}],
    [kb.back]
  ]
}