const mongoose = require('mongoose');
const mongooseOptions = {
  keepAlive: 300000,
  connectTimeoutMS : 30000
};

mongoose.connect(`${process.env.PROD_MONGODB}`, mongooseOptions)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err))

require('./model/ekb-food.model')
require('./model/user.model')

module.exports = {
  Food: mongoose.model('place'),
  User: mongoose.model('user')
}