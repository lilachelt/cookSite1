var _ = require('underscore');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongodb = require('mongodb').MongoClient;
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var hbs = require('hbs');
var ObjectID = require('mongodb').ObjectID;


var routes = require('./routes/index');
var users = require('./routes/users');
var search = require('./routes/search');


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);
app.use('/search', search);

MongoClient.connect("mongodb://Vmedu94.mtacloud.co.il:27017/cook", function(err, db) {

  if(err) throw err;

  assert.equal(null, err);

  console.log("Successfully connected to MongoDB.");

  app.post('/', function(req, res, next) {
    var searchString = req.body.search;

      //TODO delete links after
    if (searchString != '') {
        // next(Error('Please insert search string!'));

        /**
         * Show the search key word in the search box after 'search' button clicked.
         */
        req.body.search = searchString;
        db.collection('SearchStrings').find({'StringSearch': searchString}).toArray(function (err, docs) {

            if (err) throw err;
            if (docs.length < 1) {
                console.dir("No documents found.");
                //goto robot
            } else {
                console.dir("Documents found!");
                for (var doc in docs) {
                    var linksId = docs[doc]["Links"];
                }

                /**
                 * get all the titles using links ID from collection 'Links'
                 */
                getDataFromDbUsingLinksId(linksId, db,'Links','Title', '_id' ,function(titlesUrlsArr) {
                    console.log(titlesUrlsArr);

                    getDataFromDbUsingLinksId(linksId, db,'Links','Link', '_id', function(linksUrlsArr){

                        getDataFromDbUsingLinksId(linksId, db,'LinksToWords','Words', 'Link', function(ingredientsIdArr) {
                            console.log(linksUrlsArr);

                            ingredientsIdArr.forEach(function(entry){
                                getDataFromDbUsingLinksId(entry,db,'Ingredients','Word', '_id', function(ingredientsNames) {
                                    console.log(ingredientsNames);
                                });



                                //res.render('search', {searchKeyWord: searchString, titleResults: titlesUrlsArr});\
                            });
                        });
                    });
                });
            }
        });
    }});

   // catch 404 and forward to error handler
  app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
  });

});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;

function getDataFromDbUsingLinksId(linksId, db, collectionName, itemName, searchParam, onResults) {

    var arrDataLinks = new Array(linksId.length);
    var mongoIds = [];
    var query = {};

    if (searchParam == '_id') {
        linksId.forEach(function(id){
            mongoIds.push(new ObjectID(id));
        });
    } else {
        mongoIds = linksId;
    }

    query[searchParam] = { $in: mongoIds };

    db.collection (collectionName).find(query).toArray(function (err,doc) {
        if (err) throw err;
        arrDataLinks =  _.map (doc, function(item)
            {
                return item[itemName]
            }
        );
        onResults(arrDataLinks);
    });

    return arrDataLinks;
}
