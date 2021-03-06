const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();
const https = require('https')
const Koa = require('koa');
const Router = require('koa-router');
const Bodyparser = require('koa-bodyparser');
const GeoCoder = require('node-geocoder');
const _ = require('lodash');
const geolib = require('geolib');
const helper = require ('./helper');
const keyboard = require ('./keyboard');
const kb = require ('./keyboard-buttons');
const database = require('./database');

// Server
const app = new Koa();
const router = Router();
router.post('/bot', ctx => {
  const { body } = ctx.request;
  bot.processUpdate(body);
  ctx.status = 200
})
app.use(Bodyparser());
app.use(router.routes());
app.listen(process.env.PORT || 5000, () => {
  console.log(`Server is listening on ${process.env.PORT}`)
  helper.logStart()
});

// Bot launch
const bot = new TelegramBot(process.env.TOKEN);
bot.setWebHook(`${process.env.HEROKU_URL}bot`);

// Ping to prevent app sleeping
setInterval(() => https.get(process.env.HEROKU_URL), 900000)

// Project variables
const itemsLimit = helper.itemsLimit
let pagesTotal = helper.pagesTotal
let geoResult = helper.geoResult
helper.countPlaces()

// Import data to MLab
bot.onText(/\/import/, () => {
  // const db = require('./db')
  // const geocoder = GeoCoder({provider: 'yandex'})

  // db['ekb-food'].forEach(f => {
  //   geocoder.geocode('город Екатеринбург, ' + f.address)
  //     .then(res => {
  //       new database.Food({
  //         uuid: '/z' + f.link.slice(-6),
  //         type: f.type,
  //         title: f.title,
  //         description: f.description,
  //         address: f.address,
  //         link: f.link,
  //         image: f.image,
  //         average: f.avg,
  //         location: {
  //           lat: res[0].latitude,
  //           lon: res[0].longitude
  //         }
  //       }).save()
  //           .then(() => console.log('Import is done'))
  //     }).catch(err => console.log(err))
  // })
})

// Bot logic
bot.onText(/^\/[a-zA-Z]+$/, msg => {
  const id = helper.getChatId(msg)
  switch (msg.text) {
    case '/start':
    case '/help':
      database.User.findOne({userId: id}).then(user => {
        if (!user) {
          new database.User({
            userId: id
          }).save()
        }

        bot.sendMessage(id, helper.greeting, {
          parse_mode: 'HTML',
          reply_markup: {
            keyboard: keyboard.home,
            resize_keyboard: true,
          }
        })
      }).catch(err => console.log(err))
      break
    case '/geo':
      bot.sendMessage(id, `Отправьте свое местоположение`, {
        reply_markup: {
          keyboard: keyboard.sendLocation,
          resize_keyboard: true
        }
      })
      break
    case '/all':
      bot.sendMessage(id, `Выберите формат заведения`, {
        reply_markup: {
          keyboard: keyboard.type,
          resize_keyboard: true
        }
      })
      break
    case '/bars':
      database.User.findOne({userId: id})
        .then(user => showPlaces(id, user, 'bar'))
        .catch(err => console.log(err))
      break
    case '/cafe':
      database.User.findOne({userId: id})
        .then(user => showPlaces(id, user, 'cafe'))
        .catch(err => console.log(err))
      break
    case '/coffee':
      database.User.findOne({userId: id})
        .then(user => showPlaces(id, user, 'coffee'))
        .catch(err => console.log(err))
      break
    case '/fastfood':
      database.User.findOne({userId: id})
        .then(user => showPlaces(id, user, 'fastfood'))
        .catch(err => console.log(err))
      break
    case '/restaurants':
      database.User.findOne({userId: id})
        .then(user => showPlaces(id, user, 'restaurant'))
        .catch(err => console.log(err))
      break
    case '/random':
      sendRandomPlace(id)
      break
  }
})

bot.onText(/\/z(.+)/, (msg, source) => {
  details(msg.chat.id, source)
})

bot.on('message', msg => {
  helper.msgReceived();
  const id = helper.getChatId(msg);
  switch(msg.text) {
      case kb.home.places:
      case kb.back:
        bot.sendMessage(id, `Вы можете отправить свое местоположение и узнать, где находятся ближайшие к Вам заведения, либо выбрать формат места, которое хотите посетить`, {
          reply_markup: {
            keyboard: keyboard.inner,
            resize_keyboard: true
          }
        })
        break
      case kb.inner.location:
        bot.sendMessage(id, `Отправьте свое местоположение`, {
          reply_markup: {
            keyboard: keyboard.sendLocation,
            resize_keyboard: true
          }
        })
        break
      case kb.inner.type:
        bot.sendMessage(id, `Выберите формат заведения`, {
          reply_markup: {
            keyboard: keyboard.type,
            resize_keyboard: true
          }
        })
        break
      case kb.type.cafe:
        database.User.findOne({userId: id})
          .then(user => showPlaces(id, user, 'cafe'))
          .catch(err => console.log(err))
        break
      case kb.type.fastfood:
        database.User.findOne({userId: id})
          .then(user => showPlaces(id, user, 'fastfood'))
          .catch(err => console.log(err))
        break
      case kb.type.restaurants:
        database.User.findOne({userId: id})
          .then(user => showPlaces(id, user, 'restaurant'))
          .catch(err => console.log(err))
        break
      case kb.type.bars:
        database.User.findOne({userId: id})
          .then(user => showPlaces(id, user, 'bar'))
          .catch(err => console.log(err))
        break
      case kb.type.coffee:
        database.User.findOne({userId: id})
          .then(user => showPlaces(id, user, 'coffee'))
          .catch(err => console.log(err))
        break
      case kb.home.random:
        sendRandomPlace(id)
        break
      case kb.backToHome:
        bot.sendMessage(id, `Выберите пункт меню`, {
          reply_markup: {
            keyboard: keyboard.home,
            resize_keyboard: true
          },
        });
        break
    }

    if (msg.location) {
      calcDistance(msg)
    }
})

bot.on('callback_query', msg => {
  const id = msg.message.chat.id;
  bot.answerCallbackQuery({callback_query_id: msg.id})
    .then(() => {
      database.User.findOne({userId: id}).then(user => {
        switch(msg.data) {
          case 'more bar':
            changePage(user, 'bar', 'add')
            break
          case 'less bar':
            changePage(user, 'bar', 'remove')
            break
          case 'more cafe':
            changePage(user, 'cafe', 'add')
            break
          case 'less cafe':
            changePage(user, 'cafe', 'remove')
            break
          case 'more coffee':
            changePage(user, 'coffee', 'add')
            break
          case 'less coffee':
            changePage(user, 'coffee', 'remove')
            break
          case 'more fastfood':
            changePage(user, 'fastfood', 'add')
            break
          case 'less fastfood':
            changePage(user, 'fastfood', 'remove')
            break
          case 'more restaurant':
            changePage(user, 'restaurant', 'add')
            break
          case 'less restaurant':
            changePage(user, 'restaurant', 'remove')
            break
          case 'start bar':
            resetPage(user, 'bar')
            findByQuery(id, user, 'bar', itemsLimit)
            break
          case 'start cafe':
            resetPage(user, 'cafe')
            findByQuery(id, user, 'cafe', itemsLimit)
            break
          case 'start coffee':
            resetPage(user, 'coffee')
            findByQuery(id, user, 'coffee', itemsLimit)
            break
          case 'start fastfood':
            resetPage(user, 'fastfood')
            findByQuery(id, user, 'fastfood', itemsLimit)
            break
          case 'start restaurant':
            resetPage(user, 'restaurant')
            findByQuery(id, user, 'restaurant', itemsLimit)
            break
          case 'continue bar':
            findByQuery(id, user, 'bar', itemsLimit)
            break
          case 'continue cafe':
            findByQuery(id, user, 'cafe', itemsLimit)
            break
          case 'continue coffee':
            findByQuery(id, user, 'coffee', itemsLimit)
            break
          case 'continue fastfood':
            findByQuery(id, user, 'fastfood', itemsLimit)
            break
          case 'continue restaurant':
            findByQuery(id, user, 'restaurant', itemsLimit)
            break
          case 'random':
            sendRandomPlace(id)
            break
          case 'geoPage_2':
            (function () {
              const html = sendClosest(geoResult, itemsLimit, itemsLimit*2)
              bot.sendMessage(id, html, {
                parse_mode: 'HTML',
                reply_markup: {
                  inline_keyboard: [
                    [{text: `👀 Показать ещё ${itemsLimit}`, callback_data: 'geoPage_3'}]
                  ]
                }
              })
            })()
            break
          case 'geoPage_3':
            (function () {
              const html = sendClosest(geoResult, itemsLimit*2, geoResult.length)
              bot.sendMessage(id, html, {parse_mode: 'HTML'})
            })()
            break
        }
      })
    }).catch(err => console.log(err))
})

// Helpers
function findByQuery(chatId, user, query, limit) {
  let pageName = query + 'Page'
  let page = user[pageName]

  database.Food.count({type: query}).then(number => {
    if ((limit * (page - 1)) < number) {
      database.Food.find({type: query}).limit(limit).skip(limit * (page - 1)).then(place => {
        const html = place.map((p, idx) => {
          if (p.description && p.average) {
            return `<b>${idx + 1}. ${p.title}</b>\n<em>${p.description}</em>\nАдрес: ${p.address}\n${p.average}\n${p.uuid}`
          } else if (p.description && !p.average) {
            return `<b>${idx + 1}. ${p.title}</b>\n<em>${p.description}</em>\nАдрес: ${p.address}\n${p.uuid}`
          } else if (!p.description && p.average) {
            return `<b>${idx + 1}. ${p.title}</b>\nАдрес: ${p.address}\n${p.average}\n${p.uuid}`
          } else {
            return `<b>${idx + 1}. ${p.title}</b>\nАдрес: ${p.address}\n${p.uuid}`
          }
        }).join('\n-------\n')

        let inlineKb = []
        if (page > 1) {
          inlineKb = [
            [{text: '️️⬅️ Предыдущая', callback_data: `less ${query}`}],
            [{text: 'Следующая ➡', callback_data: `more ${query}`}]
          ]
        } else {
          inlineKb = [[{text: 'Следующая ➡️️', callback_data: `more ${query}`}]]
        }

        bot.sendMessage(chatId, html, {parse_mode: 'HTML'}).then(() => {
          bot.sendMessage(chatId, `Показано ${limit*page} заведений из ${number}\nСтраница ${page} из ${Math.ceil(number/limit)}`, {
            reply_markup: {
              inline_keyboard: inlineKb
            }
          })
        })
      }).catch(err => console.log(err))
    } else {
      bot.sendMessage(chatId, `В данной категории заведений больше нет ☹️\nВыберите другую категорию или вернитесь назад`, {
        reply_markup: {
          inline_keyboard: [
            [{text: '️️⬅️ Предыдущая', callback_data: `less ${query}`}],
            [{text: '️️🚀 В начало', callback_data: `start ${query}`}],
          ]
        }
      })
    }
  }).catch(err => console.log(err))
}

function sendRandomPlace(chatId) {
  database.Food.count().then(number => {
    let random = Math.floor(Math.random() * number)
    database.Food.findOne().skip(random).then(result => {
      let text = ''
      if (result.description && result.average) {
        text = `<b>${result.title}</b>\n<em>${result.description}</em>\nАдрес: ${result.address}\n${result.average}`
      } else if (result.description && !result.average) {
        text = `<b>${result.title}</b>\n<em>${result.description}</em>\nАдрес: ${result.address}\n`
      } else if (!result.description && result.average) {
        text = `<b>${result.title}</b>\nАдрес: ${result.address}\n${result.average}`
      } else {
        text = `<b>${result.title}</b>\nАдрес: ${result.address}\n`
      }

      if (result.image) {
        bot.sendPhoto(chatId, result.image, {
          caption: text,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{text: '🌍 Перейти в 2ГИС', url: result.link}],
              [{text: '👀 Показать ещё', callback_data: 'random'}]
            ]
          }
        })
      } else {
        bot.sendMessage(chatId, text, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{text: '🌍 Перейти в 2ГИС', url: result.link}],
              [{text: '👀 Показать еще', callback_data: 'random'}]
            ]
          }
        })
      }
    })
  }).catch(err => console.log(err))
}

function changePage(user, query, action) {
  const id = user.userId
  const pageName = query + 'Page'
  let page = user[pageName]
  let params = {}

  switch(action) {
    case 'add':
      params[pageName] = page + 1
      user.set(params)
      user.save().then(() => findByQuery(id, user, query, itemsLimit))
      break
    case 'remove':
      params[pageName] = page - 1
      user.set(params)
      user.save().then(() => findByQuery(id, user, query, itemsLimit))
      break
  }
}

function resetPage(user, query) {
  const pageName = query + 'Page'
  user[pageName] = 1
  user.save()
}

function details(id, uuid) {
  database.Food.findOne({uuid: uuid}).then(result => {
    // check optional fields
    let text = ''
    if (result.description && result.average) {
      text = `<b>${result.title}</b>\n<em>${result.description}</em>\nАдрес: ${result.address}\n${result.average}`
    } else if (result.description && !result.average) {
      text = `<b>${result.title}</b>\n<em>${result.description}</em>\nАдрес: ${result.address}\n`
    } else if (!result.description && result.average) {
      text = `<b>${result.title}</b>\nАдрес: ${result.address}\n${result.average}`
    } else {
      text = `<b>${result.title}</b>\nАдрес: ${result.address}\n`
    }

    if (result.image) {
      bot.sendPhoto(id, result.image, {
        caption: text,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{text: '🌍 Перейти в 2ГИС', url: result.link}]
          ]
        }
      })
    } else {
      bot.sendMessage(id, text, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{text: '🌍 Перейти в 2ГИС', url: result.link}],
          ]
        }
      })
    }
  }).catch(err => console.log(err))
}

function continueOrNot(id, user, query) {
  const pageName = query + 'Page'
  bot.sendMessage(id, `Вы находитесь на странице ${user[pageName]} из ${pagesTotal[query]}. Продолжить просмотр с текущей страницы или перейти в начало?`, {
    reply_markup: {
      inline_keyboard: [
        [{text: '🚀 В начало', callback_data: `start ${query}`}],
        [{text: 'Продолжить ➡', callback_data: `continue ${query}`}]
      ]
    }
  })
}

function showPlaces(id, user, query) {
  const pageName = query + 'Page'
  user[pageName] === 1 ? findByQuery(id, user, query, itemsLimit)
                       : continueOrNot(id, user, query)
}

async function calcDistance (msg) {
  try {
    const location = msg.location
    let result = await database.Food.find({})
    result.forEach(place => {
      place.distance = geolib.getDistance(location, place.location) / 1000
    })
    geoResult = _.sortBy(result, 'distance').slice(0, itemsLimit * 3)
    const html = sendClosest(geoResult, 0, itemsLimit)

    bot.sendMessage(helper.getChatId(msg), html, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{text: `👀 Показать ещё ${itemsLimit}`, callback_data: 'geoPage_2'}]
        ]
      }
    })
  } catch (error) {
    console.log(error)
  }
}

function sendClosest(arr, start, end) {
  return arr.slice(start, end).map((p, idx) => {
    if (p.description) {
      return `<b>${idx + 1}. ${p.title}</b>\n<em>${p.description}</em>\n${p.address}\nРасстояние ${p.distance} км\n${p.uuid}`
    } else {
      return `<b>${idx + 1}. ${p.title}</b>\n${p.address}\nРасстояние ${p.distance} км\n${p.uuid}`
    }
  }).join('\n')
}
