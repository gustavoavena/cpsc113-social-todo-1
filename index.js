var express = require('express');
var exphbs  = require('express-handlebars');
var app = express();
var bodyParser = require('body-parser');
var session = require('express-session');
var $ = require('jQuery');


app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


var Users = require('./models/users.js');


app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: 'auto' }
}));


app.use(function(req, res, next) {

    console.log('req.session = ', req.session);
    if(req.session.userId) {
        Users.findById(req.session.userId, function(err, user) {
            if(!err) {
                res.locals.currentUser = user;
            }
            next();
        });
    }
    else {
        next();
    }
    
    }
);

// Configuratio above

app.get('/', function (req, res) {
    // res.render('index');

    Users.find({}, function(err, users){
        if(err) {
            return res.send("Error getting users from database");
        }
        else {
            // res.send(String(users.length));
            res.render('index',{
                userCount : users.length,
                currentUser: res.locals.currentUser
            });
        }
    });
});


app.post('/user/register', function (req, res) {
    if(req.body.password !== req.body.password_confirmation) {
        return res.render('index', {errors: 'Passwords dont match.'});
    }


    var newUser = new Users();
	newUser.name = req.body.fl_name;
	newUser.email = req.body.email;
	newUser.password = req.body.password;

	newUser.save(function (err, user) {
		if(err) {
			console.log('Error saving user to database');
			console.log(err.errors);
            return res.render('index', { errors: err} );
		}
		else {
            req.session.userId = user._id;
			console.log('User registered');
            res.redirect('/');

		}
	});
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
