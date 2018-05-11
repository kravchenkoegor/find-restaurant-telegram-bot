const mongoose = require ('mongoose')
const Schema = mongoose.Schema

const userSchema = new Schema({
  userId: {
    type: String,
    required: true
  },
  pages: {
    bar: {
      type: Number
    },
    cafe: {
      type: Number
    },
    coffee: {
      type: Number
    },
    fastfood: {
      type: Number
    },
    restaurant: {
      type: Number
    }
  }
})

mongoose.model('usersEkb', userSchema)