const mongoose = require ('mongoose')

const Schema = mongoose.Schema

const EkbFoodSchema = new Schema({
  uuid: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  address: {
    type: String,
    required: true
  },
  link: {
    type: String,
    required: true
  },
  image: {
    type: String
  },
  average: {
    type: String
  }
});

mongoose.model('ekb-food', EkbFoodSchema)
