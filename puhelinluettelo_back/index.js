require('dotenv').config()
const express = require('express')
const app = express()
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/person')

app.use(express.json())

morgan.token('body', (request) => JSON.stringify(request.body))
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'))
app.use(cors())
app.use(express.static('build'))


// Haetaan puhelinluetteloon liittyvää informaatiota
app.get('/info', (request, response, next) => {
  Person.count({})
    .then(numOfPeople => {
      const info = `<p>Phonebook has info for ${numOfPeople} people</p>`
      const time_now = `<p>${new Date()}</p>`
      response.send(info + time_now)
    })
    .catch(error => next(error))
})

// Haetaan koko puhelinluettelo
app.get('/api/persons', (request, response) => {
  Person.find({}).then(person => {
    response.json(person)
  })
})


// Haetaan yksittäinen puhelinnumero
app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then(person => {
      response.json(person)
    })
    .catch(error => next(error))
})

// Poistetaan tietty puhelinnumero
app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndRemove(request.params.id)
    .then(() => {
      response.status(204).end()
    })
    .catch(error => next(error))
})

// Puhelinnumeron lisäys
app.post('/api/persons', (request, response, next) => {
  const body = request.body

  if(!body.name || !body.number) {
    return response.status(400).json({
      error: 'Name or number is missing.'
    })
  }

  const person = new Person({
    name: body.name,
    number: body.number
  })

  person.save()
    .then(savedPerson => {
      // console.log('Without toJSON:', savedPerson)
      // console.log('With toJSON:', savedPerson.toJSON())
      response.json(savedPerson.toJSON())
    })
    .catch(error => next(error))
})

// Puhelinnumeron päivittäminen
app.put('/api/persons/:id', (request, response, next) => {
  const body = request.body

  const person = {
    name: body.name,
    number: body.number
  }

  Person.findByIdAndUpdate(request.params.id, person, { new:true })
    .then(updatedPerson => {
      response.json(updatedPerson)
    })
    .catch(error => next(error))
})

// Virheidenkäsittely

const errorHandler = (error, request, response, next) => {
  console.log(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'ID is malformatted' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).send({ error: error.message })
  }

  next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`)
})