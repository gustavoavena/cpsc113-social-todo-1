var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/social-todo');



var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;


 var stringField = {
 	type: String,
 	minlength: 1,
 	maxlength: 50
 };

var UserSchema = new Schema({
    name    : stringField,
    email     : {
    	type: String,
 		minlength: 1,
 		maxlength: 50,
 		lowercase: true
    },
    password_hash	: stringField,

});


module.exports = mongoose.model('Users', UserSchema);