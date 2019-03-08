require('dotenv').config()

let CONNECTION_URL
let DATABASE_NAME
let SERVER_HOST
let SERVER_PORT

if (process.env.NODE_ENV === 'production') {
  DATABASE_NAME = process.env.MONGO_DATABASE || 'customermanager'
  CONNECTION_URL = process.env.MONGO_CONNECTION || `mongodb://localhost/${DATABASE_NAME}`
  SERVER_HOST = process.env.HOST || 'localhost'
  SERVER_PORT = process.env.PORT || 3030
} else if (process.env.NODE_ENV === 'test') {
  DATABASE_NAME = 'customermanager-test'
  CONNECTION_URL = `mongodb://localhost/${DATABASE_NAME}`
  SERVER_HOST = 'localhost'
  SERVER_PORT = 3030
} else {
  DATABASE_NAME = 'customermanager'
  CONNECTION_URL = `mongodb://localhost/${DATABASE_NAME}`
  SERVER_HOST = 'localhost'
  SERVER_PORT = 3000
}

module.exports = {
  DATABASE_NAME,
  CONNECTION_URL,
  SERVER_HOST,
  SERVER_PORT
}
