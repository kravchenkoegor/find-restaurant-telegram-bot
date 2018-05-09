const TelegramBot = require('node-telegram-bot-api');
const env = require('dotenv').config();
const Koa = require('koa');
const Router = require('koa-router');
const Bodyparser = require('koa-bodyparser');
const mongoose = require('mongoose');
const mongooseOptions = {
  keepAlive: 300000,
  connectTimeoutMS : 30000
};
const _ = require('lodash')
const geolib = require('geolib')
const GeoCoder = require('node-geocoder')
const helper = require ('./helper');
const keyboard = require ('./keyboard');
const kb = require ('./keyboard-buttons');

//==== CONNECT ====
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
});

helper.logStart();

//==== DATABASE ====
mongoose.connect(`${process.env.PROD_MONGODB}`, mongooseOptions)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err));

require('./model/ekb-food.model');
const Food = mongoose.model('ekb-food');

//==== BOT ====
const bot = new TelegramBot(process.env.TOKEN);
bot.setWebHook(`${process.env.HEROKU_URL}bot`);

bot.onText(/\/start/, msg => {
  const text = `Здравствуйте, ${msg.from.first_name}\nВыберите команду для начала работы:`
  bot.sendMessage(helper.getChatId(msg), text, {
    reply_markup: {
      keyboard: keyboard.home,
      resize_keyboard: true
    }
  })
});

bot.onText(/\/import/, () => {
  const db = require('./db')
  const geocoder = GeoCoder({provider: 'yandex'})

  db['ekb-food'].forEach(f => {
    geocoder.geocode('город Екатеринбург, ' + f.address)
      .then(res => {
        new Food({
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


bot.on('message', msg => {
  helper.msgReceived();
  const id = helper.getChatId(msg);

  switch(msg.text) {
    case kb.home.type:
      bot.sendMessage(id, `Выберите формат заведения:`, {
        reply_markup: {
          keyboard: keyboard.type,
          resize_keyboard: true
        }
      });
      break

    case kb.type.cafe:
      sendFromDb(id, 'cafe')
      break

    case kb.type.fastfood:
      sendFromDb(id, 'fastfood')
      break

    case kb.type.restaurants:
      sendFromDb(id, 'restaurants')
      break

    case kb.type.bars:
      sendFromDb(id, 'bars')
      break

    case kb.type.coffee:
      sendFromDb(id, 'coffee')
      break

    case kb.home.random:
      bot.sendMessage(id, `Здесь будет выводиться случайное заведение`);
      break

    case kb.back:
      bot.sendMessage(id, `Выберите пункт меню`, {
        reply_markup: {keyboard: keyboard.home}
      });
      break
  }

  if (msg.location) {
    calcDistance(id, msg.location)
  }
})

bot.on('callback_query', msg => {
  const id = msg.message.chat.id;
  bot.answerCallbackQuery({callback_query_id: msg.id})
    .then(() => { details(id, msg.data) })
})
//===================

function sendFromDb(chatId, query, limit = 10) {
  Food.find({type: query}).limit(limit).then(place => {

    const html = place.map((p, idx) => {
      //TODO проверка на наличие полей
      return `<b>${idx + 1}.</b> ${p.title}\n<em>${p.description}</em>\nАдрес: ${p.address}\n${p.average}\n${p.uuid}`
    }).join('\n')

    bot.sendMessage(chatId, html, {
      parse_mode: 'HTML',
      inline_keyboard: [
        [{text: 'Показать еще 10', callback_data: 'more'}]
      ]
    })
  }).catch(err => console.log(err))
}

function details(id, uuid) {
  Food.findOne({uuid: uuid}).then(result => {
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

function sendFacilitiesByQuery (chatId, query) {
  Food.find(query).then(food => {

    const html = food.map((f, i) => {
      if (f.business && f.cuisine) {
        return `<b>${i + 1}. ${f.title}</b> - ${f.uuid}
${f.tip}
${f.business}
${f.cuisine}
${f.address}`
      } else if (f.business && f.cuisine === undefined) {
          return `<b>${i + 1}. ${f.title}</b> - ${f.uuid}
${f.tip}
${f.business}
${f.address}`
      } else if (f.business === undefined && f.cuisine) {
          return `<b>${i + 1}. ${f.title}</b> - ${f.uuid}
${f.tip}
${f.cuisine}
${f.address}`
      } else if (f.business === undefined && f.cuisine === undefined) {
          return `<b>${i + 1}. ${f.title}</b> - ${f.uuid}
${f.tip}
${f.address}`
      }
    }).join('\n')

    sendHtml(chatId, html)
  })
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

function calcDistance (chatId, location) {
  //TODO поиск по категории
  Food.find({type: 'bar'}).limit(15).then(bars => {

    bars.forEach(bar => {
      bar.distance = geolib.getDistance(location, bar.location) / 1000
    })

    bars = _.sortBy(bars, 'distance')

    const html = bars.map((b, idx) => {
      return `<b>${idx + 1}.</b> ${b.title}\n<em>${b.description}</em>\n${b.address}\nРасстояние ${b.distance} км\n${b.uuid}`
    }).join('\n')

    bot.sendMessage(chatId, html, {
      parse_mode: 'HTML'
    })

  })
}

function toggleFavourite(userId, queryId, {itemUuid, isFav}) {

  let userPromise

  User.findOne({telegramId: userId}).then(user => {

    if (user) {

      if (isFav) {
        user.cafes = user.cafes.filter(fUuid => fUuid !== itemUuid)
      } else {
        user.cafes.push(itemUuid)
      }
      userPromise = user

    } else {

      userPromise = new User({
        telegramId: userId,
        cafes: [itemUuid]
      })
    }

    const answerText = isFav ? 'Удалено' : 'Добавлено'

    userPromise.save().then(_ => {
      bot.answerCallbackQuery(queryId, {
        text: answerText
      })
    })
  })
}

function showFavourite(chatId, userId) {
  User.findOne({telegramId: userId}).then(user => {

    if (user) {
      Cafe.find({uuid: {'$in': user.cafes}}).then(cafe => {
        let html

        if (cafe.length) {
          html = cafe.map((c, i) => {
            return `<b>${i + 1}</b> ${c.title} (/f${c.uuid})`
          }).join('\n')
        } else {
          html = 'Вы пока ничего не добавили'
        }
        sendHtml(chatId, html, 'home')
      })

    } else {
      sendHtml(chatId, `Вы пока ничего не добавили`, 'home')
    }
  })
}
