var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Leaderboard = new Schema(
    {
        region: {type: String, required: true, maxLength: 20},
        heroName: {type: String, required: true, maxLength: 20},
        heroWins: Number,
        heroLosses: Number
    }
);

module.exports = mongoose.model('Leaderboard', Leaderboard );