const mongoose = require ('mongoose')
const Schema = mongoose.Schema

const userSchema = new Schema({
  userId: {
    type: String,
    required: true
  },
  barPage: {
    type: Number,
    default: 1
  },
  cafePage: {
    type: Number,
    default: 1
  },
  coffeePage: {
    type: Number,
    default: 1
  },
  fastfoodPage: {
    type: Number,
    default: 1
  },
  restaurantPage: {
    type: Number,
    default: 1
  }
})

mongoose.model('usersEkb', userSchema)