const { Router } = require('express');
const controllers = require('../auth');
const router = Router();

// Auth system
router.post('/login', controllers.login);

router.post('/register', controllers.register);

router.get('/logout', controllers.logout);

router.get('/checkauth', controllers.mustAuthenticatedMw);

router.post('/getavatar', controllers.getAvatar);

module.exports = router;
