const path = require('path')
const express = require('express')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const morgan = require('morgan')
const exphbs = require('express-handlebars')
const passport = require('passport')
const  methodOverride = require('method-override')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)
const connectDB = require('./config/db')

//LOAD CONFIG
dotenv.config({ path: './config/config.env' })

//PASSPORT CONFIG
require('./config/passport')(passport)

//CONNECT TO DB
connectDB()

const app = express()

//BODY PARSER
app.use(express.urlencoded({ extended: false}))
app.use(express.json())

//METHOD OVERRIDE
app.use(methodOverride(function (req, res) {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    // look in urlencoded POST bodies and delete it
    let method = req.body._method
    delete req.body._method
    return method
  }
}))

//LOGGING
if (process.env.NODE_ENV === 'developement'){
    app.use(morgan('dev'))
}

//HANDLEBARS HELPERS
const { formatDate, stripTags, truncate, editIcon, select } = require('./helpers/hbs')

//HANDLEBARS (Template Engine)
app.engine('.hbs', exphbs({ helpers:{ formatDate, stripTags, truncate, editIcon, select }, defaultLayout: 'main', extname: '.hbs',}))
app.set('view engine', '.hbs');

//SESSIONS MIDDLEWARE
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,  //don't create session unitl something is stored
    store: new MongoStore({ mongooseConnection: mongoose.connection })
  }))

//PASSPORT MIDDLEWARE
app.use(passport.initialize())
app.use(passport.session())

//SET GLOBAL VARIABLE
app.use(function(req, res, next){
  res.locals.user = req.user || null
  next()
})

//STATIC FOLDER
app.use(express.static(path.join(__dirname, 'public')))

//ROUTES
app.use('/', require('./routes/index'))
app.use('/auth', require('./routes/auth'))
app.use('/stories', require('./routes/stories'))

//PORT
const PORT = process.env.PORT || 3000
app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`))