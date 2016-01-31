var express = require('express');
var exphbs  = require('express-handlebars');
var bodyParser = require('body-parser');
var $ = require('jQuery');

var app = express();

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


var Users = require('./models/users.js');


// Configuratio above

app.get('/', function (req, res) {
    // res.render('home');

    Users.find({}, function(err, users){
    	if(err) {
    		res.send("Error getting users from database");
    	}
    	else {
    		// res.send(String(users.length));
    		res.render('home',{userCount : users.length});
    	}
    });
});

app.post('/signup', function (req, res) {
    res.render('signup_view');
});

app.post('/user/register', function (req, res) {

    var newUser = new Users();
	newUser.name = req.body.fl_name;
	newUser.email = req.body.email;
	newUser.password = req.body.password;

	newUser.save(function (err) {
		if(err) {
			console.log('Error saving user to database');
			console.log(err);
		}
		else {
			console.log('User registered');
		}
	});
 	res.redirect('/');
    // res.send(new_name); Tava dando erro pq nao pode dar res.send nada dps de renderizar header.
 //    res.render('dashboard');
	// }
});



app.post('/login', function (req, res) {
    res.render('login_view');
});




app.listen(3000, function() {
	console.log("Listening on port 3000");
});