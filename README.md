# hapi-mongodb-rest
Project with MongoDb/Mongoose and Data Validation Support

TEST REST:
> curl -X POST http://localhost:3000/person --header "Accept: application/json" --header "Content-type: application/json" -d '{"firstname": "Khusein", "lastname": "Bespalyi", "email": "khusein.bespalyi@otolane.com"}'

> curl -X GET http://localhost:3000/person/5c7f1a3c7571e7c8ab057ebd --header "Accept: application/json" --header "Content-type: application/json"
>
