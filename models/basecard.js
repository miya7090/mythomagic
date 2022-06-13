//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var BaseCard = new Schema(
    {
        name: {type: String, required: true, maxLength: 100},
        base_atk: Number,
        description: String
    }
);

//Export function to create "SomeModel" model class
module.exports = mongoose.model('BaseCard', BaseCard );

