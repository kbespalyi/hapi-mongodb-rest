const Mongoose = require('mongoose')
const Schema = Mongoose.Schema
const ObjectId = Mongoose.Types.ObjectId
const Mixed = Mongoose.Schema.Types.Mixed
const array = Mongoose.Types.Array

const personSchema = new Schema({
    firstname: String,
    lastname: String,
    email: { type: String, required: true, unique: true },
    created: { type: Date, index: true }
})

personSchema.pre('save', function(next) {
  if (!this.created) {
    this.created = new Date
  }
  next();
});

personSchema.pre('validate', function(next) {
  if (!this.firstname) {
    this.firstname = 'any'
  }
  if (!this.lastname) {
    this.lastname = 'any'
  }
  if (!this.email) {
    this.email = 'any@test.com'
  }
  next()
})

module.exports = Mongoose.model('Person', personSchema, 'people')
