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

    if (oauth.token_secret) {

        var uri = 'https://api.twitter.com/oauth/authenticate'
        + '?' + qs.stringify({oauth_token: oauthToken});

        res.redirect(uri);

    } else {

        request.post({url : requestTokenUrl, oauth : oauth}, function (e, r, body) {

            var reqData = qs.parse(body);
            var oauthToken = reqData.oauth_token;
            var oauthTokenSecret = reqData.oauth_token_secret;

            oauth.token_secret = oauthTokenSecret;

            if (oauth.token_secret) {

                var uri = 'https://api.twitter.com/oauth/authenticate'
                + '?' + qs.stringify({oauth_token: oauthToken});

                res.redirect(uri);

            } else {

                res.send('Unable to get twitter app access token');
            }

        });
    }
});

router.get('/twitter_signin_callback', function (req, res) {

    oauth.token = req.query.oauth_token;
    oauth.verifier = req.query.oauth_verifier;

    request.post({url : accessTokenUrl, oauth : oauth}, function (e, r, body){

      var authenticatedData = qs.parse(body);

      var oauth = {

          consumer_key : process.env.TWTR_KEY,
          consumer_secret : process.env.TWTR_SECRET,
          token: authenticatedData.oauth_token,
          token_secret : authenticatedData.oauth_token_secret
      };

      request.get({url: 'https://api.twitter.com/1.1/account/settings.json', oauth: oauth}, function(e, r, body) {

          var accountData = JSON.parse(body);

          var json = {

              user_token: authenticatedData.oauth_token,
              user_secret: authenticatedData.oauth_token_secret,
              user_name: accountData.screen_name
          };

          res.header('Access-Control-Allow-Origin','*');
          res.json(json);
      })
  });
});

router.get('/twitter_friends', function (req, res){

});

router.get('/twitter_people', function (req, res){

});

router.get('/twitter_list_timeline', function (req, res){

    var oauth = {

        consumer_key : process.env.TWTR_KEY,
        consumer_secret : process.env.TWTR_SECRET,
        token: req.query.user_access_token,
        token_secret : req.query.user_access_secret
    };

    var qs = {

        slug: 'reads',
        owner_screen_name: req.query.user_name,
    };

    request.get({url: 'https://api.twitter.com/1.1/lists/statuses.json', oauth: oauth, qs: qs}, function (e, r, body) {

        var response = JSON.parse(body);

        if (response.errors && response.errors[0].code == 34) {

            var qs = {

                name: 'reads',
                mode: 'private',
                description: 'People I love to read'
            };

            request.post({url: 'https://api.twitter.com/1.1/lists/create.json', oauth: oauth, qs: qs}, function (e, r, body) {

                res.header('Access-Control-Allow-Origin','*');
                res.send('New list \'reads\' created. Add People, please.');
            });

        } else {

            res.header('Access-Control-Allow-Origin','*');
            res.json(body);
        }
    });
});

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
