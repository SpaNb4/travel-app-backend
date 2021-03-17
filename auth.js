const passport = require('passport');
const User = require('./models/users');
const bcrypt = require('bcrypt');
const multer = require('multer');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const path = `./uploads/`;
        fs.mkdirSync(path, { recursive: true });
        return cb(null, path);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + file.originalname);
    },
});

const fileFilter = (req, file, cb) => {
    // checking file type
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true);
    } else {
        cb('please upload only image');
    }

    //check if the email is not exist
    User.findOne({ username: req.body.username }).then((user) => {
        if (user) {
            cb('this user already exist');
        }
    });
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 1,
    },
    fileFilter: fileFilter,
}).single('profileImage');

require('dotenv').config();
cloudinary.config({
    cloud_name: 'spanb4',
    api_key: '515229837514668',
    api_secret: process.env.API_SECRET,
});

// Here we check, transfer the user data to the verification function, which we defined above
// If authorization is successful, user data will be stored in req.user
module.exports.login = function (req, res, next) {
    passport.authenticate('local', function (err, user) {
        if (err) {
            return res.status(400).json({ errors: err });
        }
        if (!user) {
            return res.status(400).json({ errors: 'No user found' });
        }
        req.logIn(user, function (err) {
            if (err) {
                return res.status(400).json({ errors: err });
            }
            return res.status(200).json({ success: user.username });
        });
    })(req, res, next);
};

// Logout
module.exports.logout = function (req, res) {
    req.logout();
    return res.status(200).json({ logout: true });
};

// User registration. Create it in the database
module.exports.register = async function (req, res, next) {
    upload(req, res, function (err) {
        if (err) {
            console.log(err);
            return res.status(400).json({ avatar: 'please upload picture' });
        }
        User.findOne({ username: req.body.username })
            .then(async (user) => {
                if (user) {
                    return res.status(400).json({ username: 'username already exist' });
                } else {
                    const uplodImage = await cloudinary.uploader.upload(req.file.path, function (error, result) {
                        return result;
                    });

                    const newUser = new User({
                        username: req.body.username,
                        password: req.body.password,
                        profileImage: uplodImage.secure_url,
                    });

                    bcrypt.genSalt(10, (err, salt) => {
                        bcrypt.hash(newUser.password, salt, (err, hash) => {
                            if (err) throw err;
                            newUser.password = hash;
                            newUser
                                .save()
                                .then((user) => res.json(user))
                                .catch((err) => console.log(err));
                        });
                    });
                }
            })
            .catch((err) => console.log(err));
    });
};

// Check authentication
module.exports.mustAuthenticatedMw = function (req, res) {
    req.isAuthenticated() ? res.json({ username: req.user.username }) : res.json({ username: null });
};

// Get avatar
module.exports.getAvatar = function (req, res) {
    User.findOne({ username: req.body.username })
        .then((user) => {
            if (user) {
                return res.status(200).json({ username: user.profileImage });
            } else {
                return res.status(400).json({ username: null });
            }
        })
        .catch((err) => console.log(err));
};
