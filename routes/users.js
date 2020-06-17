var express = require('express');
var router = express.Router();
const bodyParser = require('body-parser');
var User = require('../models/user');
var Products = require('../models/products');
var passport = require('passport');
var authenticate = require('../authenticate');

router.use(bodyParser.json());

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/signup', (req, res, next) => {
  User.register(new User({username: req.body.username}),
    req.body.password, (err, user) => {
    if(err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.json({err: err});
    }
    else {
      passport.authenticate('local')(req, res, () => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json({success: true, status: 'Registration Successful!'});
      });
    }
  });
});

router.post('/login', passport.authenticate('local'), (req, res) => {
  var token = authenticate.getToken({_id: req.user._id});
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.json({success: true, token: token, status: 'You are successfully logged in!'});
});

router.get('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy();
    res.clearCookie('session-id');
    res.redirect('/');
  }
  else {
    var err = new Error('You are not logged in!');
    err.status = 403;
    next(err);
  }
});

router.route('/products')
.get(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user._id)
    .populate('products')
    .then((user) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(user.products);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(authenticate.verifyUser, (req, res, next) => {
    req.body.user = req.user._id;
    Products.create(req.body)
    .then((product) => {
        console.log('Product Created ', product);
        User.findById(req.user._id)
        .then((user) => {
            user.products.push(product._id);
            user.save()
            .then((user) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(product);
            }, (err) => next(err));
        }, (err) => next(err))
        .catch((err) => next(err));
    }, (err) => next(err))
    .catch((err) => next(err));
})

router.route('/products/:productId')
.put(authenticate.verifyUser, (req, res, next) => {
    Products.findById(req.params.productId)
    .then((product) => {
        if(req.user._id.toString() === product.user._id.toString()) {
          product.name = req.body.name;
          product.description = req.body.description;
          product.save()
          .then((product) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(product);
          }, (err) => next(err));
        }
        else {
          var err = new Error('Tu no puedes actualizar este producto');
          err.status = 403;
          next(err);
        }
    }, (err) => next(err))
})
.delete(authenticate.verifyUser, (req, res, next) => {
    Products.findById(req.params.productId)
    .then((product) => {
        if(req.user._id.toString() === product.user._id.toString()) {
          Products.remove({_id: product._id})
          .then((resp) => {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.json(resp);
          }, (err) => next(err))
          .catch((err) => next(err));
        }
        else {
          var err = new Error('Tu no puedes eliminar este producto');
          err.status = 403;
          next(err);
        }
    }, (err) => next(err))
});

module.exports = router;
