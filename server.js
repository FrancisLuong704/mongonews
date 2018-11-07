//dependencies
var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");

//scraping tools
var axios = require("axios");
var cheerio = require("cheerio");

//require the models
var db = require("./models");

//set PORT
var PORT = 3000;

//initialize express
var app = express();

//configure middleware

//morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB

// this is for deploying to heroku
// var MONGODB_URI = process.env.MONGODB_URI
// mongoose.connect(MONGODB_URI);

//this is for local
mongoose.connect("mongodb://localhost/redditScraper", { useNewUrlParser: true });


//Routes

//a GET route for all scraping a website
app.get("/scrape", function (req, res) {
    //grab body of html with axios
    axios.get("http://old.reddit.com/").then(function (response) {
        // Then, we load that into cheerio and save it to $ for a shorthand selector
        var $ = cheerio.load(response.data);
        //grab each p tag with class of title
        $("p.title").each(function (i, element) {
            //empty result object
            let result = {};
            // Save the text of the element in a "title" variable
            result.title = $(element).text();
            //same thing for links
            result.link = $(element).children().attr("href");
            db.Article.create(result).then(function (dbArticle) {
                console.log(dbArticle);
            }).catch(function (err) {
                return res.json(err);
            });
        });
        res.send("Scraping is Complete!!!!");
    });
});

// a GET route for all articles
app.get("/articles", function (req, res) {
    //all articles
    db.Article.find({}).then(function (dbArticle) {
            res.json(dbArticle);
        }).catch(function (err) {
            res.json(err);
        });
});

// A GET route for grabbing a specific Article by id, then populate with its note
app.get("/articles/:id", function(req, res) {
    //all articles by id
    db.Article.findOne({ _id: req.params.id })
    .populate("note")
    .then(function(dbArticleId) {
        res.json(dbArticleId);
    }).catch(function(err) {
        res.json(err);
    });
});

//Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(err, res) {
    //create the note
    db.Note.create(req.body).then(function(dbNote) {
        return db.Article.findOneAndUpdate({ _id: req.params.id}, {note: dbNote._id}, { new: true});
    }).then(function(dbArticleNote) {
        res.json(dbArticleNote);
    }).catch(function(err) {
        res.json(err);
    });
});

// Start the server
app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});