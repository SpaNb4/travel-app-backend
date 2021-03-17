const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/route_auth');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const User = require('./models/users');
const cors = require('cors');
const bcrypt = require('bcrypt');
const morgan = require('morgan');

require('dotenv').config();

const PORT = process.env.PORT || 3000;
const { MONGO_USERNAME, MONGO_PASSWORD, MONGO_HOST, MONGO_DB_NAME, SESSION_SECRET } = process.env;
const URL = `mongodb+srv://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOST}/${MONGO_DB_NAME}`;

const app = express();

const corsOptions = {
    credentials: true,
    origin: true,
};

const sessionConfig = {
    secret: SESSION_SECRET,
    cookie: {
        sameSite: 'none',
        secure: true,
    },
    resave: true,
    saveUninitialized: true,
};

app.use(cors(corsOptions));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Middlewares
app.use(cookieParser());
app.use(session(sessionConfig));

// Logger
app.use(morgan('combined'));

app.use('/uploads', express.static('uploads'));

// Passport
app.use(passport.initialize());

express - session;
app.use(passport.session());

app.use(authRoutes);

passport.use(
    new LocalStrategy(
        {
            usernameField: 'username',
            passwordField: 'password',
        },
        function (username, password, done) {
            User.findOne({ username: username }, async function (err, user) {
                if (user) {
                    let isPassMatch = await bcrypt.compare(password, user.password);
                    return err
                        ? done(err)
                        : user
                        ? isPassMatch
                            ? done(null, user)
                            : done(null, false, { message: 'Incorrect password.' })
                        : done(null, false, { message: 'Incorrect username.' });
                }
                done(null, false, { message: 'Incorrect username' });
            });
        }
    )
);

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        err ? done(err) : done(null, user);
    });
});

async function start() {
    try {
        await mongoose.connect(URL, {
            useNewUrlParser: true,
            useFindAndModify: false,
            useUnifiedTopology: true,
            useCreateIndex: true,
        });
        app.listen(PORT, () => {
            console.log('Server has been started...');
        });
    } catch (e) {
        console.log(e);
    }
}

start();
