// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');
var request = require('request');
var qs = require('qs');
var session = require('express-session');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}));

//URL To obtain Request Token from Twitter
var requestTokenUrl = "https://api.twitter.com/oauth/request_token";
var accessTokenUrl = "https://api.twitter.com/oauth/access_token";

//Oauth Object to be used to obtain Request token from Twitter
var oauth = {
  callback : "http://localhost:8000/",
  consumer_key  : process.env.TWTR_KEY,
  consumer_secret : process.env.TWTR_SECRET
}

var port = process.env.PORT || 5000;        // set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
    res.json({ message: 'hooray! welcome to our api!' });
});

router.get('/twitter_signin', function (req, res) {

  request.post({url : requestTokenUrl, oauth : oauth}, function (e, r, body) {

    //Parsing the Query String containing the oauth_token and oauth_secret.
    var reqData = qs.parse(body);
    var oauthToken = reqData.oauth_token;
    var oauthTokenSecret = reqData.oauth_token_secret;

    oauth.token_secret = oauthTokenSecret;

    var uri = 'https://api.twitter.com/oauth/authenticate'
    + '?' + qs.stringify({oauth_token: oauthToken});
    res.header('Access-Control-Allow-Origin','*');
    res.json({url: uri});
  });
});

router.get('/twitter_signin_callback', function (req, res) {

    oauth.token = req.query.oauth_token;
    oauth.verifier = req.query.oauth_verifier;

    request.post({url : accessTokenUrl, oauth : oauth}, function (e, r, body){

      var authenticatedData = qs.parse(body);

      res.header('Access-Control-Allow-Origin','*');
      res.json({user_token: authenticatedData.oauth_token, user_secret: authenticatedData.oauth_token_secret});
  });
});

router.get('/twitter_friends', function (req, res){

});

router.get('/twitter_people', function (req, res){

});

router.get('/twitter_tweets', function (req, res){

});

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
