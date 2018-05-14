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
  },
  pagesTotal: {
    bar: {
      type: Number,
      required: true
    },
    cafe: {
      type: Number,
      required: true
    },
    coffee: {
      type: Number,
      required: true
    },
    fastfood: {
      type: Number,
      required: true
    },
    restaurant: {
      type: Number,
      required: true
    }
  }
})

mongoose.model('usersEkb', userSchema)