const TelegramBot = require('node-telegram-bot-api');
const Koa = require('koa');
const Router = require('koa-router');
const Bodyparser = require('koa-bodyparser');
const app = new Koa();
const router = Router();

module.exports = {
  startBot() {
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
  }
}

// const bot = new TelegramBot(process.env.TOKEN);
// bot.setWebHook(`${process.env.HEROKU_URL}bot`);