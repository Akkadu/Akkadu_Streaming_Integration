
const http = require('http')
const path = require('path')
const express = require('express')
const port = 3000

async function initializeTestServer() {
  return new Promise((resolve,reject) => {
    const app = express()
    // view engine setup
    app.set('views', path.join(__dirname, 'views'))
    app.set('view engine', 'ejs')
    app.use(express.static(path.join(__dirname, '../dist')))
    app.get('/', (req,res) => res.render('receiver'))
    app.get('/receiver', (req,res) => res.render('receiver'))
    app.get('/interpreter1', (req,res) => res.render('interpreter1'))
    app.get('/interpreter2', (req,res) => res.render('interpreter2'))
    const server = http.createServer(app)
    server.listen(port, (err) => {
      if (err) {
        console.error(err)
      }
      console.log('Server listening on port', port)
      resolve(server)
    })
  })
}
module.exports = initializeTestServer
