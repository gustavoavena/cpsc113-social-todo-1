var express = require('express');
var exphbs  = require('express-handlebars');
var app = express();
var bodyParser = require('body-parser');
var session = require('express-session');
var mongoose = require('mongoose');
// mongoose.connect('mongodb://localhost/social-todo');
mongoose.connect("mongodb://heroku_565cfc8f:5qvgqov4j9bnkqr67l9gm9blmq@ds059115.mongolab.com:59115/heroku_565cfc8f");

var MongoDBStore = require('connect-mongodb-session')(session);
// var $ = require('jQuery');
// app.use('/static', express.static('public'));

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(__dirname + '/public'));

var Users = require('./models/users.js');
var task = require('./models/task.js');

var store = new MongoDBStore({ 
   uri: process.env.MONGO_URL,
   collection: 'sessions'
 });


app.use(session({
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: true,
	cookie: { secure: 'auto' },
	store: store
}));


function isLoggedIn(req, res, next) {
	if(res.locals.currentUser) {
		next();
	} 
	else {
		res.sendStatus(403);
	}
}

function loadUsertask(req, res, next) {
	if(!res.locals.currentUser) {
		return next();
	}

	task.find({ $or:[
			{owner: res.locals.currentUser},
			{collaborator1: res.locals.currentUser.email},
			{collaborator2: res.locals.currentUser.email},
			{collaborator3: res.locals.currentUser.email}
		]}, function(err, task) {
		if(!err) {
			for(i in task) {
				if(task[i].owner.equals(res.locals.currentUser._id)) {
					task[i]["mine"] = true;
				} else {
					task[i]["mine"] = false;
				}
			}
			// console.log(task);
			res.locals.task = task;
		}
		else {
			console.log('Error loading task.');
			res.render('index', { errors: 'Error loading task.'} );
		}
		next();
	});
}

app.use(function(req, res, next) {;

	// console.log('req.session = ', req.session);
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

app.get('/', loadUsertask , function (req, res) {
	res.render('index');
});


app.post('/user/register', function (req, res) {
	if(req.body.password !== req.body.password_confirmation) {
		return res.render('index', {errors: 'Password and password confirmation do not match'});
	}
	//Validate email length
	//Validate duplicate email
	console.log(req.body);

	if(req.body.password.length < 1 || req.body.password.length > 50) {
		err = 'Bad password';
		res.render('index', {errors: err});
		return;
	}
	else if(req.body.fl_name.length < 1 || req.body.fl_name.length > 50) {
		err = 'Name must be between 1 and 50 character.';
		res.render('index', {errors: err});
		return;
	}


	// var oldUser = Users.findOne({email: req.body.email}, function(err) {
	// 	if(!err) {
	// 		return res.render('index', {errors: "Account with this email already exists!"});
	// 	}
	// });

	var newUser = new Users();
	newUser.name = req.body.fl_name;
	newUser.email = req.body.email;
	newUser.hashed_password = req.body.password;

	newUser.save(function(err, user){
    // If there are no errors, redirect to home page
	    if(user && !err){
	    	console.log('User resgistered. Logged in.\n');
	      	req.session.userId = user._id;
	      	res.redirect('/');
	      	return;
	    }
    	var errors = "Error registering you.";
	    if(err){
	      if(err.errmsg && err.errmsg.match(/duplicate/)){
	        errors = "Account with this email already exists!";
	      }
	      return res.render('index', {errors: errors});
	    }
  		}
  	);

	// newUser.save(function (err, user) {
	// 	if(err) {
	// 		console.log('Error saving user to database.');
	// 		console.log(err);
	// 		var errors = "Error registering you.";
 //      		if(err.errmsg && err.errmsg.match(/duplicate/)){
 //        		errors = 'Account with this email already exists!';
 //      		}
 //      		return res.render('index', {errors: errors});
	// 		// res.render('index', { errors: err} );
	// 	}
	// 	else {
	// 		req.session.userId = user._id;
	// 		console.log('User registered');
	// 		res.redirect('/');

	// 	}
	// });
	// res.send(new_name); Tava dando erro pq nao pode dar res.send nada dps de renderizar header.
 //    res.render('dashboard');
	// }
});



app.post('/user/login', function (req, res) {
	var user = Users.findOne({email: req.body.email}, function(err, user) {
		if(err || !user) {
			res.render('index', {errors: "Invalid email address"});
			return;
		}
		// console.log('user= ', user);
		// console.log('actual password= ', user.hashed_password);
		// console.log('provided password= ', req.body.password);


		user.comparePassword(req.body.password, function(err, isMatch) {
			if(err || !isMatch){
				res.render('index', {errors: 'Invalid password'});
				console.log('\n\nInvalid password.\n\n');
				// res.render('index', {errors: 'Invalid password'});
				return;
	   		}
		   	else{
				req.session.userId = user._id;
				res.redirect('/');
				return;
		   	}

		});
	});
});

//Everything below this can only be done by a logged in user.
//This middleware will enforce that.

app.use(isLoggedIn);

app.post('/task/create', function (req, res) {
	var newTask = new task();

	newTask.owner = res.locals.currentUser;
	newTask.title = req.body.title;
	newTask.description = req.body.description;
	newTask.collaborator1 = req.body.collaborator1;
	newTask.collaborator2 = req.body.collaborator2;
	newTask.collaborator3 = req.body.collaborator3;
	newTask.isComplete = false;

	console.log("Creating task...\n");
	newTask.save(function(err, task) {
		if(err || !task) {
			console.log('Error saving task to the database.');
			res.render('index', { errors: 'Error saving task to the database.'} );
		}
		else {
			// console.log('New task added: ', task.title);
			res.redirect('/');
		}
	});


});


app.get('/task/complete', function(req, res) {

	console.log('Completing task. Id: ', req.query.id);

	task.findById(req.query.id, function(err, completedTask) {
		if(err || !completedTask) {
			console.log('Error finding task on database.');
			res.redirect('/');
		}
		else {
			console.log("Method called.");
			completedTask.completeTask();
			res.redirect('/');
		}
	});
});

app.get('/task/remove', function(req, res) {
	console.log('Removing task. Id: ', req.query.id);

	task.findById(req.query.id, function(err, taskToRemove) {
		if(err || !taskToRemove) {
			console.log('Error finding task on database.');
			res.redirect('/');
		}
		else {
			taskToRemove.remove();
			res.redirect('/');
		}
	});
});

app.get('/user/logout', function(req, res){
  req.session.destroy(function(){
    res.redirect('/');
  });
});



app.listen(process.env.PORT || 3000, function() {
	console.log("Listening on port 3000");
});
