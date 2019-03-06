'use strict';

const Path = require('path')
const Hapi = require('hapi')
const Mongoose = require('mongoose')
const Joi = require('joi')
const Inert = require('inert')

let CONNECTION_URL
let DATABASE_NAME
if (process.NODE_ENV === 'production') {
  DATABASE_NAME = "customermanager"
  CONNECTION_URL = `mongodb+srv://admin:tereyaki1!@cluster0-zntm6.mongodb.net/${DATABASE_NAME}?retryWrites=true`
} else if (process.NODE_ENV === 'test') {
  DATABASE_NAME = "customermanager-test"
  CONNECTION_URL = `mongodb://localhost/${DATABASE_NAME}`
} else {
  DATABASE_NAME = "customermanager"
  CONNECTION_URL = `mongodb://localhost/${DATABASE_NAME}`
}

const server = new Hapi.Server({
  'host': 'localhost',
  'port': 3000,
  routes: {
    files: {
      relativeTo: Path.join(__dirname, 'public')
    }
  }
})

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
  if (!this.created) this.created = new Date
  next();
});

personSchema.pre('validate', function(next) {
  if (!this.firstname) this.firstname = 'any'
  if (!this.lastname) this.lastname = 'any'
  if (!this.email) this.email = 'any@test.com'
  next();
})

const PersonModel = Mongoose.model('Person', personSchema, 'people')

server.route({
  method: 'POST',
  path: '/person',
  options: {
    validate: {
      payload: {
        firstname: Joi.string().required(),
        lastname: Joi.string().required(),
        email: Joi.string().required()
      },
      failAction: (request, h, error) => {
        request.logger.info('Error: %s', error.message);
        return (
          error.isJoi
            ? h.response(error.details[0]).takeover()
            : h.response(error).takeover()
        )
      }
    }
  },
  handler: async (request, h) => {
    request.logger.info('In handler %s', request.path);
    try {
      const person = new PersonModel(request.payload)
      const result = await person.save()
      return h.response(result);
    } catch (error) {
      request.logger.info('Error: %s', error.message);
      return h.response(error).code(500)
    }
  }
})

server.route({
  method: 'GET',
  path: '/people',
  handler: async (request, h) => {
    request.logger.info('In handler %s', request.path);
    try {
      const person = await PersonModel.find().exec()
      return h.response(person)
    } catch (error) {
      request.logger.info('Error: %s', error.message);
      return h.response(error).code(500)
    }
  }
})

server.route({
  method: 'GET',
  path: '/person/{id}',
  handler: async (request, h) => {
    request.logger.info('In handler %s', request.path);
    try {
      const person = await PersonModel.findById(request.params.id).exec()
      return h.response(person)
    } catch (error) {
      request.logger.info('Error: %s', error.message);
      return h.response(error).code(500)
    }
  }
})

server.route({
  method: 'PUT',
  path: '/person/{id}',
  options: {
    validate: {
      payload: {
        firstname: Joi.string().optional(),
        lastname: Joi.string().optional()
      },
      failAction: (request, h, error) => {
        request.logger.info('Error: %s', error.message);
        return (
          error.isJoi
            ? h.response(error.details[0]).takeover()
            : h.response(error).takeover()
        )
      }
    }
  },
  handler: async (request, h) => {
    request.logger.info('In handler %s', request.path);
    try {
      const result = await PersonModel.findByIdAndUpdate(request.params.id, request.payload, { new: true })
      return h.response(result)
    } catch (error) {
      request.logger.info('Error: %s', error.message);
      return h.response(error).code(500)
    }
  }
})

server.route({
  method: 'DELETE',
  path: '/person/{id}',
  handler: async (request, h) => {
    request.logger.info('In handler %s', request.path);
    try {
      const result = await PersonModel.findByIdAndDelete(request.params.id)
      return h.response(result)
    } catch (error) {
      request.logger.info('Error: %s', error.message);
      return h.response(error).code(500)
    }
  }
})

server.route({
  method: 'GET',
  path: '/robot.txt',
  handler(request, h) {
    let path = 'plain.txt'
    if (request.headers['x-magic'] === 'sekret') {
      path = 'awesome.png'
    }

    return h.file(path).vary('x-magic')
  }
})

server.route({
  method: 'GET',
  path: '/picture.jpg',
  handler: function(request, h) {
    return h.file('/public/images/picture.jpg');
  }
})

server.ext('onPreResponse', (request, h) => {
  const response = request.response
  if (response.isBoom && response.output.statusCode === 404) {
    //Boom.notFound()
    //Boom.forbidden()
    return h.file('404.html').code(404)
  }

  return h.continue
})

// Start the server
const start = async function() {

  await server.register({
    plugin: require('hapi-pino'),
    options: {
      prettyPrint: true,
      logEvents: ['response', 'onPostStart']
    }
  })

  await server.register(Inert);

  server.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
      directory: {
        path: '.',
        redirectToSlash: true,
        index: true,
      }
    }
  })

  server.route({
    method: 'GET',
    path: '/{filename}',
    handler: {
      file: function(request) {
        return request.params.filename;
      }
    }
  })

  const options = {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: true,
    autoIndex: false, // Don't build indexes
    reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
    reconnectInterval: 500, // Reconnect every 500ms
    poolSize: 10, // Maintain up to 10 socket connections
    // If not connected, return errors immediately rather than waiting for reconnect
    bufferMaxEntries: 0,
    connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    family: 4 // Use IPv4, skip trying IPv6
  }

  try {
    await Mongoose.connect(CONNECTION_URL, options)
  } catch (err) {
    console.log(err)
    process.exit(1)
  }

  try {
    await server.start()
  } catch (err) {
    console.log(err)
    process.exit(1)
  }
}

process.on('unhandledRejection', (err) => {
  console.log(err)
  process.exit(1)
})

start()
