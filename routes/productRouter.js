const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
var authenticate = require('../authenticate');
var User = require('../models/user');
const Products = require('../models/products');

const productRouter = express.Router();

productRouter.use(bodyParser.json());

productRouter.route('/')
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

productRouter.route('/:productId')
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

module.exports = productRouter;
