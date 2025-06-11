const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const Article = require('./models/articles');

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

mongoose.connect('mongodb://localhost:27017/journal');

app.get('/', async (req, res) => {
    const {title, author} = req.query;
    let filter = {};

    if (title) {
        filter.title = {$regex: title, $options: 'i'};
    }
    if (author) {
        filter.authors = author;
    }

    try {
        const articles = await Article.find(filter);
        const authors = await Article.distinct('authors');
        res.render('index', {articles, authors, query: req.query});
    } catch (err) {
        res.status(500).send("Ошибка при загрузке данных.");
    }
});

app.listen(3000, () => console.log("Server started on http://localhost:3000"));
