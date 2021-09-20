const mongoose = require("mongoose");

const scoreSchema = new mongoose.Schema({
  nickname: { type: String, default: null },
  score: { type: Number },
  mode: {
    type:String,
    enum: ['singleplayer', 'multiplayer'],
    default: 'singleplayer'
    }
//   token: { type: String },
});

module.exports = mongoose.model("score", scoreSchema);