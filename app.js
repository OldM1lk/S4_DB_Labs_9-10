const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const Article = require('./models/articles');

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect('mongodb://localhost:27017/Journal');

app.get('/', async (req, res) => {
    const {title, author, startDate, endDate} = req.query;

    let filter = {};

    if (title) {
        filter.title = {$regex: title, $options: 'i'};
    }

    if (author) {
        filter.authors = author;
    }

    if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // включаем всю дату до конца дня
            filter.date.$lte = end;
        }
    }

    try {
        const articles = await Article.find(filter).sort({date: -1});
        const allAuthors = await Article.distinct('authors');
        res.render('index', {
            articles,
            authors: allAuthors,
            query: req.query
        });
    } catch (err) {
        res.status(500).send("Ошибка при получении статей");
    }
});

app.get('/article/:id', async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);
        if (!article) {
            return res.status(404).send("Статья не найдена");
        }
        res.render('article', {article});
    } catch (err) {
        res.status(500).send("Ошибка при загрузке статьи");
    }
});

app.post('/delete/:id', async (req, res) => {
    try {
        await Article.findByIdAndDelete(req.params.id);
        res.redirect('/');
    } catch (err) {
        res.status(500).send("Ошибка при удалении статьи");
    }
});

app.get('/new', (req, res) => {
    res.render('new'); // new.ejs
});

app.post('/new', async (req, res) => {
    const {
        title,
        authors,
        date,
        content,
        tags,
        reviewName,
        reviewMessage,
        reviewRating
    } = req.body;

    try {
        const newArticle = new Article({
            title,
            authors: authors.split(',').map(a => a.trim()),
            date: new Date(date),
            content,
            tags: tags ? tags.split(',').map(t => t.trim()) : [],
            reviews: []
        });

        // Добавляем рецензию, если есть имя и текст
        if (reviewName && reviewMessage && reviewRating) {
            newArticle.reviews.push({
                name: reviewName.trim(),
                message: reviewMessage.trim(),
                rating: Number(reviewRating)
            });
        }

        await newArticle.save();
        res.redirect('/');
    } catch (err) {
        res.status(500).send("Ошибка при добавлении статьи");
    }
});

app.get('/top', async (req, res) => {
    try {
        const articles = await Article.find();

        // Подсчёт среднего рейтинга и количества рецензий
        const ranked = articles.map(article => {
            const reviewCount = article.reviews.length;
            const averageRating = reviewCount
                ? article.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
                : 0;
            return {
                ...article.toObject(),
                averageRating,
                reviewCount
            };
        });

        // Сортировка: по среднему рейтингу, затем по числу рецензий
        ranked.sort((a, b) => {
            if (b.averageRating === a.averageRating) {
                return b.reviewCount - a.reviewCount;
            }
            return b.averageRating - a.averageRating;
        });

        res.render('top', {articles: ranked});
    } catch (err) {
        res.status(500).send("Ошибка при получении топ-статей");
    }
});

app.listen(3000, () => console.log("Server started on http://localhost:3000"));
