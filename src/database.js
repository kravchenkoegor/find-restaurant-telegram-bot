const mongoose = require('mongoose');
const mongooseOptions = {
  keepAlive: 300000,
  connectTimeoutMS : 30000
};

mongoose.connect(`${process.env.PROD_MONGODB}`, mongooseOptions)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err))

require('./model/ekb-food.model')
export const Food = mongoose.model('ekb-food')
require('./model/user.model')
export const User = mongoose.model('usersEkb')