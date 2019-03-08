"use strict";

const Joi = require('joi')
const routes = require('./generic')

const PersonModel = require('../models/people')

module.exports.register = async server => {
  const isDev = process.env.NODE_ENV !== 'production'

  // register generic routes
  await routes.generic(server)

  server.route({
    method: 'POST',
    path: '/person',
    options: {
      log: {
        collect: true
      },
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
    options: {
      log: {
        collect: true
      }
    },
    handler: async (request, h) => {
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
    options: {
      log: {
        collect: true
      }
    },
    handler: async (request, h) => {
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
      log: {
        collect: true
      },
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
    options: {
      log: {
        collect: true
      }
    },
    handler: async (request, h) => {
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
    path: '/download',
    handler: async (request, h) => {
      try {
        const message = 'My first server template'
        return h.view('layout.ejs', {
          title: 'Home',
          message
        });
      } catch (err) {
        server.log(['error', 'home'], err);
      }
    }
  })

  server.route({
    path: '/add/{a}/{b}',
    method: 'GET',
    handler: async function(request, h) {

      const { a, b } = request.params;
      const { value, cached } = await server.methods.sum(a, b);
      const lastModified = cached ? new Date(cached.stored) : new Date();

      return h.response(value)
        .header('Last-modified', lastModified.toUTCString());
    }
  })
}
