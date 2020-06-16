var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var passportLocalMongoose = require('passport-local-mongoose');

var User = new Schema({
    admin: {
      type: Boolean,
      default: false
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      }
    ]
});

// user y password son agregados con el plugin
User.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', User);
