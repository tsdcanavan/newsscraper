var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var request = require("request");
var cheerio = require("cheerio");
var axios = require("axios");
var expHbrs = require("express-handlebars");

// Require all models
var db = require("./models");

var PORT = 3000;

var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));

// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect("mongodb://localhost/newsscraper", {
  useMongoClient: true
});

// Routes

// scrape data from the marvel news page
app.get("/scrape", function(req, res) {
  axios.get("http://news.marvel.com/").then(function(response) {
    var $ = cheerio.load(response.data);
    $("a.side-link").each(function(i, element) {
      var result = {};

      // Add the text and href of every link, and 
      //save them as properties of the result object
      result.text = $(this)
        .children()
        .text();
      result.link = $(this)
        .attr("href");

      db.Article
        .create(result)
        .then(function(dbArticle) {
          res.send("Scrape Completed");
        })
        .catch(function(err) {
          res.json(err);
        });
    });
  });
});

// get Articles from the db
app.get("/articles", function(req, res) {
  db.Article.find().then(function(dbArticle) {
    res.json(dbArticle);
  })
  .catch(function(err){
    res.json(err);
  })
});

// grab a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  db.Article.findOne({_id: req.params.id})
  .populate("note").then(function(article){
    res.json(article)
  }).catch(function(err){
    res.json(err);
  })
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  db.Note.create(req.body).then(function(dbNote) {
    return db.Article.findOneAndUpdate({_id: req.params.id}, {note: dbNote._id}, {new: true});
  }).then(function(dbArticle){
    res.json(dbArticle);
  }).catch(function(err) {
    res.json(err);
  })
});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
