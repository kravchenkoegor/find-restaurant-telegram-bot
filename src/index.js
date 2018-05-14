const TelegramBot = require('node-telegram-bot-api');
//const env = require('dotenv').config();
const Koa = require('koa');
const Router = require('koa-router');
const Bodyparser = require('koa-bodyparser');
const _ = require('lodash');
const geolib = require('geolib');
const GeoCoder = require('node-geocoder');
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
});
app.use(Bodyparser());
app.use(router.routes());
app.listen(process.env.PORT || 5000, () => {
  console.log(`Server is listening on ${process.env.PORT}`)
  helper.logStart()
});

// Bot launch
const bot = new TelegramBot(process.env.TOKEN);
bot.setWebHook(`${process.env.HEROKU_URL}bot`);

// Project variables
const itemsLimit = 7
let pagesTotal = {}
countPlaces()

// Import data to MLab
bot.onText(/\/import/, () => {
  const db = require('./db')
  const geocoder = GeoCoder({provider: 'yandex'})

  db['ekb-food'].forEach(f => {
    geocoder.geocode('город Екатеринбург, ' + f.address)
      .then(res => {
        new database.Food({
          uuid: '/z' + f.link.slice(-6),
          type: f.type,
          title: f.title,
          description: f.description,
          address: f.address,
          link: f.link,
          image: f.image,
          average: f.avg,
          location: {
            lat: res[0].latitude,
            lon: res[0].longitude
          }
        }).save()
          .then(() => console.log('Import is done'))
          .catch(err => console.log(err))
      }).catch(err => console.log(err))
  })

  database.Food.count({type: query})
})

// Bot logic
bot.onText(/\/start/, msg => {
  console.log(msg)
  bot.sendMessage(helper.getChatId(msg), helper.greeting, {
    parse_mode: 'HTML',
    reply_markup: {
      keyboard: keyboard.home,
      resize_keyboard: true,
    }
  })
})



bot.onText(/\/geo/, msg => {
  const id = helper.getChatId(msg);
  bot.sendMessage(id, `Отправить местоположение`, {
    reply_markup: {
      keyboard: [
        [{text: 'Отправить местоположение', request_location: true}],
        [kb.back]
      ],
      resize_keyboard: true
    }
  })
})

bot.onText(/\/all/, msg => {
  bot.sendMessage(msg.chat.id, `Выберите формат заведения`, {
    reply_markup: {
      keyboard: keyboard.type,
      resize_keyboard: true
    }
  })
})

bot.onText(/\/bars/, msg => {
  const id = msg.chat.id
  database.User.findOne({userId: id}).then(user => {
    showPlaces(id, user, 'bar')
  })
})

bot.onText(/\/cafe/, msg => {
  const id = msg.chat.id
  database.User.findOne({userId: id}).then(user => {
    showPlaces(id, user, 'cafe')
  })
})

bot.onText(/\/coffee/, msg => {
  const id = msg.chat.id
  database.User.findOne({userId: id}).then(user => {
    showPlaces(id, user, 'coffee')
  })
})

bot.onText(/\/fastfood/, msg => {
  const id = msg.chat.id
  database.User.findOne({userId: id}).then(user => {
    showPlaces(id, user, 'fastfood')
  })
})

bot.onText(/\/restaurants/, msg => {
  const id = msg.chat.id
  database.User.findOne({userId: id}).then(user => {
    showPlaces(id, user, 'restaurants')
  })
})

bot.onText(/\/random/, msg => {
  const id = msg.chat.id
  sendRandomPlace(id)
})

bot.onText(/\/z(.+)/, (msg, source) => {
  details(msg.chat.id, source)
})

bot.on('message', msg => {
  helper.msgReceived();
  const id = helper.getChatId(msg);

  database.User.findOne({userId: id}).then(user => {

    if (!user) {

      new database.User({
        userId: id
      }).save()
    }

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
        showPlaces(id, user, 'cafe')
        break
      case kb.type.fastfood:
        showPlaces(id, user, 'fastfood')
        break
      case kb.type.restaurants:
        showPlaces(id, user, 'restaurant')
        break
      case kb.type.bars:
        showPlaces(id, user, 'bar')
        break
      case kb.type.coffee:
        showPlaces(id, user, 'coffee')
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
      calcDistance(id, itemsLimit, msg.location)
    }

  }).catch(err => console.log(err))
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
        }
      })
    }).catch(err => console.log(err))
})

// Helpers
function findByQuery(chatId, user, query, limit) {
  let pageName = query + 'Page'
  let page = user[pageName]

  console.log('pagename', pageName, 'page', page)

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
              [{text: '👀 Показать еще', callback_data: 'random'}]
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

function calcDistance (chatId, limit, location) {
  database.Food.find({}).then(place => {
    place.forEach(p => {
      p.distance = geolib.getDistance(location, p.location) / 1000
    })
    place = _.sortBy(place, 'distance').slice(0, limit)
    const html = place.map((p, idx) => {
      if (p.description) {
        return `<b>${idx + 1}. ${p.title}</b>\n<em>${p.description}</em>\n${p.address}\nРасстояние ${p.distance} км\n${p.uuid}`
      } else {
        return `<b>${idx + 1}. ${p.title}</b>\n${p.address}\nРасстояние ${p.distance} км\n${p.uuid}`
      }
    }).join('\n')
    bot.sendMessage(chatId, html, {
      parse_mode: 'HTML',
    })
  })
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

function countPlaces() {
  ['bar', 'cafe', 'coffee', 'fastfood', 'restaurant'].forEach(el => {
    database.Food.count({type: el}).then(number => {
      pagesTotal[el] = Math.ceil(number/itemsLimit)
    })
  })
}

function showPlaces(id, user, query) {
  const pageName = query + 'Page'
  console.log(user[pageName])
  user[pageName] === 1 ? findByQuery(id, user, query, itemsLimit)
                       : continueOrNot(id, user, query)
}
