var express = require('express');
var exphbs  = require('express-handlebars');
var bodyParser = require('body-parser');
var $ = require('jQuery');

var app = express();

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function (req, res) {
    res.render('home');
});

app.post('/signup', function (req, res) {
    res.render('signup_view');
});

app.post('/user/register', function (req, res) {
    // res.send('sign up values');
    var new_name = req.body.name;
    // var email = String(req.body.email);
 	console.log('chegou!');
    // res.send(new_name); Tava dando erro pq nao pode dar res.send nada dps de renderizar header.
    res.render('dashboard');
	}
);



app.post('/login', function (req, res) {
    res.render('login_view');
});




app.listen(3000);