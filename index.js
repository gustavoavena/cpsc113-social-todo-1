var express = require('express');
var exphbs  = require('express-handlebars');
var app = express();
var bodyParser = require('body-parser');
var session = require('express-session');
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/social-todo');
var MongoDBStore = require('connect-mongodb-session')(session);
// var $ = require('jQuery');


app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


var Users = require('./models/users.js');
var Tasks = require('./models/tasks.js');

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

function loadUserTasks(req, res, next) {
	if(!res.locals.currentUser) {
		return next();
	}

	Tasks.find({ $or:[
			{owner: res.locals.currentUser},
			{collaborator1: res.locals.currentUser.email},
			{collaborator2: res.locals.currentUser.email},
			{collaborator3: res.locals.currentUser.email}
		]}, function(err, tasks) {
		if(!err) {
			for(i in tasks) {
				console.log(tasks[i],'\n',  res.locals.currentUser);
				if(tasks[i].owner.equals(res.locals.currentUser._id)) {
					console.log("Loading my task!\n\n\n", tasks[i]);
					tasks[i]["mine"] = true;
				} else {
					tasks[i]["mine"] = false;
				}
			}
			console.log(tasks);
			res.locals.tasks = tasks;
		}
		else {
			console.log('Error loading tasks.');
			res.render('index', { errors: 'Error loading tasks.'} );
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

app.get('/', loadUserTasks , function (req, res) {
	res.render('index');
});


app.post('/user/register', function (req, res) {
	if(req.body.password !== req.body.password_confirmation) {
		return res.render('index', {errors: 'Passwords dont match.'});
	}


	var newUser = new Users();
	newUser.name = req.body.fl_name;
	newUser.email = req.body.email;
	newUser.hashed_password = req.body.password;

	newUser.save(function (err, user) {
		if(err) {
			err = 'Error registering you!';
			console.log('Error saving user to database');
			console.log(err.errors);
			res.render('index', { errors: err} );
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



app.post('/user/login', function (req, res) {
	var user = Users.findOne({email: req.body.email}, function(err, user) {
		if(err || !user) {
			res.render('index', {errors: 'bad login, no such user.'});
			return;
		}
		console.log('user= ', user);
		console.log('actual password= ', user.hashed_password);
		console.log('provided password= ', req.body.password);


		user.comparePassword(req.body.password, function(err, isMatch) {
			if(err || !isMatch){
				res.render('index', {errors: 'bad password duder'});
	   		}
		   	else{
				req.session.userId = user._id;
				res.redirect('/');
		   	}

		});
	});
});

//Everything below this can only be done by a logged in user.
//This middleware will enforce that.

app.use(isLoggedIn);

app.post('/tasks/create', function (req, res) {
	var newTask = new Tasks();

	newTask.owner = res.locals.currentUser;
	newTask.title = req.body.title;
	newTask.description = req.body.description;
	newTask.collaborator1 = req.body.collaborator1;
	newTask.collaborator2 = req.body.collaborator2;
	newTask.collaborator3 = req.body.collaborator3;
	newTask.isComplete = false;

	newTask.save(function(err, task) {
		if(err || !task) {
			console.log('Error saving task to the database.', err);
			res.render('index', { errors: 'Error saving task to the database.'} );
		}
		else {
			console.log('New task added: ', task.title);
			res.redirect('/');
		}
	});


});


app.get('/tasks/complete', function(req, res) {

	console.log('Completing task. Id: ', req.query.id);

	Tasks.findById(req.query.id, function(err, completedTask) {
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

app.get('/user/logout', function(req, res){
  req.session.destroy(function(){
    res.redirect('/');
  });
});



app.listen(3000, function() {
	console.log("Listening on port 3000");
});
