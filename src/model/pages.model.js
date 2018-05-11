const mongoose = require ('mongoose')
const Schema = mongoose.Schema

const pagesSchema = new Schema({
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
  },
})

mongoose.model('pagesEkb', pagesSchema)