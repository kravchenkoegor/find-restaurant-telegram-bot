const TelegramBot = require('node-telegram-bot-api');
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

// Bot
const bot = new TelegramBot(process.env.TOKEN);
bot.setWebHook(`${process.env.HEROKU_URL}bot`);

const itemsLimit = 7
bot.onText(/\/start/, msg => {
  const text = `Здравствуйте, ${msg.from.first_name}\nВыберите команду для начала работы:`
  bot.sendMessage(helper.getChatId(msg), text, {
    reply_markup: {
      keyboard: keyboard.home,
      resize_keyboard: true
    }
  })
});

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

bot.onText(/\/z(.+)/, (msg, source) => {
  details(msg.chat.id, source)
})

//TODO возможность настройки лимита заведений в сообщении(запись значения в БД)
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
        findByQuery(id, user, 'cafe', itemsLimit)
        break
      case kb.type.fastfood:
        findByQuery(id, user, 'fastfood', itemsLimit)
        break
      case kb.type.restaurants:
        findByQuery(id, user, 'restaurant', itemsLimit)
        break
      case kb.type.bars:
        findByQuery(id, user, 'bar', itemsLimit)
        break
      case kb.type.coffee:
        findByQuery(id, user, 'coffee', itemsLimit)
        break
      case kb.home.random:
        bot.sendMessage(id, `Здесь будет выводиться случайное заведение`);
        break
      case kb.backToHome:
        bot.sendMessage(id, `Выберите пункт меню`, {
          reply_markup: {keyboard: keyboard.home},
          resize_keyboard: true
        });
        break
    }

    if (msg.location) {
      calcDistance(id, '', msg.location)
    }
  })
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
        }
      })
    }).catch(err => console.log(err))
})

// Helpers
function findByQuery(chatId, user, query, limit) {
  let pageName = query + 'Page'
  let page = user[pageName]

  database.Food.count({type: query}).then(number => {
    database.Food.find({type: query}).limit(limit).skip(limit * (page - 1)).then(place => {
      const html = place.map((p, idx) => {
        return `<b>${idx + 1}. ${p.title}</b>\n<em>${p.description ? p.description : ''}</em>\nАдрес: ${p.address}\n${p.average ? p.average : ''}\n${p.uuid}`
      }).join('\n')

      let inlineKb = []
      if (page > 1) {
        inlineKb = [
          [{text: 'Следующая ➡️️', callback_data: `less ${query}`}],
          [{text: '⬅️ Предыдущая', callback_data: `more ${query}`}]
        ]
      } else {
        inlineKb = [[{text: 'Следующая ➡️️', callback_data: `more ${query}`}]]
      }

      bot.sendMessage(chatId, html, {parse_mode: 'HTML'}).then(() => {
        bot.sendMessage(chatId, `Показано ${limit} заведений из ${number}\nСтраница ${page} из ${Math.ceil(number/limit)}`, {
          reply_markup: {
            inline_keyboard: inlineKb
          }
        })
      })

    }).catch(err => console.log(err))
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

function details(id, uuid) {
  database.Food.findOne({uuid: uuid}).then(result => {
    const text = `<b>${result.title}</b>\n<em>${result.description}</em>\nАдрес: ${result.address}\n${result.average}`
    if (result.image) {
      bot.sendPhoto(id, result.image, {
        caption: text,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{text: 'Перейти в 2ГИС', url: result.link}]
          ]
        }
      })
    } else {
      bot.sendMessage(id, text, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{text: 'Перейти в 2ГИС', url: result.link}],
          ]
        }
      })
    }
  }).catch(err => console.log(err))
}

function sendHtml(chatId, html, kbName = null) {
  const options = {
    parse_mode: 'HTML',
  }

  if (kbName) {
    options['reply_markup'] = {
      keyboard: keyboard[kbName]
    }
  }

  bot.sendMessage(chatId, html, options)
}

function calcDistance (chatId, query, limit = 10, location) {
  //TODO поиск по категории
  database.Food.find({type: query}).limit(limit).then(place => {

    place.forEach(p => {
      p.distance = geolib.getDistance(location, p.location) / 1000
    })

    place = _.sortBy(place, 'distance')

    const html = place.map((p, idx) => {
      return `<b>${idx + 1}.</b> ${p.title}\n<em>${p.description ? p.description : undefined}</em>\n${p.address}\nРасстояние ${p.distance} км\n${p.uuid}`
    }).join('\n')

    bot.sendMessage(chatId, html, {
      parse_mode: 'HTML'
    })
  })
}
