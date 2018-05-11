const mongoose = require ('mongoose')
const Schema = mongoose.Schema

const userSchema = new Schema({
  userId: {
    type: String,
    required: true
  }
})

mongoose.model('usersEkb', userSchema)