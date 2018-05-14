const database = require('./database');

module.exports = {
  logStart() {
    console.log('Bot has been started...')
  },

  msgReceived() {
    console.log('Message received')
  },

  getChatId(msg) {
    return msg.chat.id
  },

  greeting: `Здравствуйте!

Этот бот любезно поможет Вам выбрать место, где Вы можете пообедать, встретиться с друзьями или приятно отдохнуть!

Для Вашего удобства бот понимает следующие команды:
/geo <b>- найдет и покажет ближайшие к Вам заведения</b>
/all - <b>список всех заведений г. Екатеринбурга и окрестностей, отсортированный по категориям</b>
/restaurants <b>- рестораны</b>
/bars <b>- бары</b>
/cafe <b>- кафе</b>
/coffee <b>- кофейни</b>
/fastfood <b>- фастфуд</b>
/random <b>- случайное заведение</b>

Выберите команду для начала работы:`,

  itemsLimit: 7,

  pagesTotal: {},

  countPlaces () {
    ['bar', 'cafe', 'coffee', 'fastfood', 'restaurant'].forEach(el => {
      database.Food.count({type: el}).then(number => {
        this.pagesTotal[el] = Math.ceil(number/this.itemsLimit)
      })
    })
  }
};