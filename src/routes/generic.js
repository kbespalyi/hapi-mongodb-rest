"use strict";

const Path = require('path')
const HapiPino = require('hapi-pino')
const Boom = require('boom')
const Inert = require('inert')
const Vision = require('vision')
const Handlebars = require('handlebars')
const Pug = require('pug')
const ejs = require('ejs')

module.exports.generic = async server => {
  const isDev = process.env.NODE_ENV !== "production"

  await server.register({
    plugin: HapiPino,
    options: {
      prettyPrint: isDev,
      logEvents: ['onPostStart']
    }
  })

  await server.register(Inert)
  await server.register(Vision)

  server.views({
    engines: {
      html: Handlebars,
      pug: Pug,
      ejs
    },
    relativeTo: Path.join(__dirname, '../../client'),
    path: '.'
  })

  server.route({
    method: 'GET',
    path: '/',
    config: {
      auth: {
        strategy: 'session',
        mode: 'optional'
      }
    },
    handler: {
      view: 'index.pug'
    }
  })

  server.route({
    method: 'GET',
    path: '/login',
    options: {
      auth: 'session',
      handler: async (request) => {
        return `Hello, ${request.auth.credentials.profile.email}!`
      }
    }
  })

  server.route({
    method: 'GET',
    path: '/authorization-code/callback',
    options: {
      auth: 'okta',
      handler: (request, h) => {
        if (!request.auth.isAuthenticated) {
          throw Boom.unauthorized(`Authentication failed: ${request.auth.error.message}`)
        }
        request.cookieAuth.set(request.auth.credentials)
        return h.redirect('/')
      }
    }
  })

  server.route({
    method: 'GET',
    path: '/logout',
    options: {
      auth: {
        strategy: 'session',
        mode: 'try'
      },
      handler: (request, h) => {
        try {
          if (request.auth.isAuthenticated) {
            // clear the local session
            request.cookieAuth.clear()
          }

          return h.redirect('/')
        } catch (err) {
          request.log(['error', 'logout'], err)
        }
      }
    }
  })

  server.route({
    method: 'GET',
    path: '/favicon.ico',
    handler: function(request, h) {
      return h.file(Path.join(__dirname, '../../client/favicon.ico'));
    }
  })

  server.route({
    method: 'GET',
    path: '/robots.txt',
    handler(request, h) {
      let path
      if (request.headers['x-magic'] !== 'sekret') {
        path = Path.join(__dirname, '../../client/seo/robots.txt')
      } else {
        path = Path.join(__dirname, '../../client/404.html')
      }
      return h.file(path).vary('x-magic')
    }
  })

  /*
    server.route({
      method: 'GET',
      path: '/{filename}',
      handler: {
        file: function(request) {
          //request.logger.info('In handler %s', request.path);
          return request.params.filename;
        }
      }
    })
  */

  /*
    server.route({
      method: 'GET',
      path: '/script.js',
      handler: {
        file: {
          path: 'script.js',
          filename: 'client.js', // override the filename in the Content-Disposition header
          mode: 'attachment', // specify the Content-Disposition is an attachment
          lookupCompressed: true // allow looking for script.js.gz if the request allows it
        }
      }
    })
  */

}
