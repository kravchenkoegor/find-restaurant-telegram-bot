## Telegram bot to help you find the nearest place to eat in Yekaterinburg

### [You can try it here](https://t.me/EkbFoodBot)

### Functions:
* Bot uses data from [2GIS site](https://2gis.ru/) and is updated once a month
* Data is stored in MongoDB database
* You can send your location (availaible only for mobile devices) and bot will give you the list of places sorted by distance
* You can choose the place by type (cafe, bar, restaurant, fastfood, etc.)
* You can get a list of all places in Yekaterinburg or see a random place
* It takes 10 minutes to fetch new data from 2GIS and create a new database for another city

Application is based on [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api) and uses [Koa](https://koajs.com/) for backend and [mongoose](http://mongoosejs.com/) for operating with database.
