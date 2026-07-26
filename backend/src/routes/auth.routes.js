const express = require('express');
const { register, login, getMe } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate, schemas } = require('../middleware/validate.middleware');

const router = express.Router();

router.post(
  '/register',
  validate(schemas.register),
  register
);

router.post(
  '/login',
  validate(schemas.login),
  login
);

router.get('/me', authenticate, getMe);

module.exports = router;
