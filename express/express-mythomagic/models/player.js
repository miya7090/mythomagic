//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var Player = new Schema(
    {
        name: {type: String, required: true, maxLength: 100},
        owned_cards: { type: Schema.Types.ObjectId, ref: 'BaseCard', required: true }
    }
);

//Export function to create "SomeModel" model class
module.exports = mongoose.model('Player', Player );

