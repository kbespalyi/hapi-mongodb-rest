'use strict';

const Path = require('path')
const Hapi = require('hapi')
const Boom = require('boom')
const Hoek = require('hoek')
const Mongoose = require('mongoose')

process.on('unhandledRejection', (err) => {
  console.log(err)
  process.exit(1)
})

const isProd = process.env.NODE_ENV === 'production'
const isDev = !isProd && process.env.NODE_ENV !== 'test'
const config = require('./config')
const routes = require('./routes')
const auth = require("./auth")

const serverOptions = {
  host: config.SERVER_HOST,
  port: config.SERVER_PORT,
  /*cache: [
    {
      name: 'redisCache',
      engine: require('catbox-redis'),
      host: '127.0.0.1',
      partition: 'cache'
    }
  ],*/
  routes: {
    files: {
      relativeTo: Path.join(__dirname, '../client')
    }
  }
}

if (isDev) {
  Object.assign(serverOptions, { debug: { request: ['error'] } })
}

const server = new Hapi.Server(serverOptions)

server.log(['error', 'database', 'read'])
server.events.on('log', (event, tags) => {
  if (tags.error) {
    console.error(`Server error: ${event.error ? event.error.message : 'unknown'}`);
  }
})

server.ext('onPreResponse', (request, h) => {
  const response = request.response
  if (response.isBoom) {
    if (response.output.statusCode === 404) {
      return h.file('404.html').code(404)
    } else if (response.output.statusCode >= 400 && response.output.statusCode < 500) {
      return Boom.badRequest()
    } else if (response.output.statusCode >= 500) {
      console.error('Error code', response.output.statusCode, response.output.payload.message)
      return Boom.serverUnavailable()
    }
  }
  return h.continue
})

// Start the server
const start = async function() {

  console.log('Node environment:', process.env.NODE_ENV)

  const add = async (a, b) => {
    await Hoek.wait(1000)   // Simulate some slow I/O
    return Number(a) + Number(b)
  }

  server.method('sum', add/*, {
    cache: {
      cache: 'redisCache',
      expiresIn: 10 * 1000,
      generateTimeout: 2000,
      getDecoratedValue: true
    }
  }*/)

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
    await Mongoose.connect(config.CONNECTION_URL, options)
  } catch (err) {
    console.log(err)
    process.exit(1)
  }

  // register auth
  await auth.register(server)
  // register routes
  await routes.register(server);

  try {
    await server.start()
  } catch (err) {
    server.log(['error', 'home'], err);
    process.exit(1)
  }
}

start()

module.exports = server
