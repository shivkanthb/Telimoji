var express = require('express');
var app = express();

var bodyParser = require('body-parser');
var port = process.env.PORT || 3000;


var cons = require('consolidate');
var path = require('path');

app.use(express.static(__dirname));

app.engine('html', cons.swig);
app.set('views', __dirname + '/');
app.set('view engine', 'html');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.get('/', function(req,res){

	res.render('index');
});




app.listen(port, function(){
	console.log("listening on port:"+port);
});