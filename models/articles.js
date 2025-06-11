const mongoose = require('mongoose');

const reviewsSchema = new mongoose.Schema({
    name: String,
    message: String,
    rating: {type: Number, min: 1, max: 10}
});

const articlesSchema = new mongoose.Schema({
    title: String,
    authors: [String],
    date: Date,
    content: String,
    tags: [String],
    reviews: [reviewsSchema]
});

module.exports = mongoose.model('articles', articlesSchema, "articles");
