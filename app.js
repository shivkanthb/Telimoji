

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var swig = require('swig');

var routes = require('./routes/index');
var users = require('./routes/user');

var app = express();

var tgbot = require('node-telegram-bot-api');

var bot = new tgbot("234037388:AAHi2XEQOYZhMyzspCX-EI8_sEpchmLkFHc", { polling: { timeout: 2000, interval: 500 }});


var imojiClient = new (require("imoji-node"))({
        apiKey: '778664ed-1548-4ce4-b7ac-0c4d78d538c5',
        apiSecret: 'U2FsdGVkX19AhiDjv8dXWqYvmHPWQj87COJcOTDbzi8='
    });
  
 var exec = require('child_process').exec;
   
var env = process.env.NODE_ENV || 'development';
app.locals.ENV = env;
app.locals.ENV_DEVELOPMENT = env == 'development';

// view engine setup
app.engine('swig', swig.renderFile)
app.set('view cache', false);
swig.setDefaults({ cache: false });
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'swig');

// app.use(favicon(__dirname + '/public/img/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var request = require('request');
var fs = require('fs');

var download = function(uri, filename, callback){
  request.head(uri, function(err, res, body){
    // console.log('content-type:', res.headers['content-type']);
    // console.log('content-length:', res.headers['content-length']);
    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
};


var getStickers = function(input,type, callback) {
	
//    console.log("Came to this function wuth input "+input);
   var vals=[];
   var elem ={};
   var telegram_results=[];
   imojiClient.search({
        query: input,
        offset: 0,
        numResults: 18
    })
        .then(function (searchResults) {
			// console.log("DAO");
            // console.log(searchResults['results'].length);
            
            vals= searchResults.results;
            
           if(vals.length!=0)
           {
                for(var j=0;j<vals.length;j++)
                {
                    elem={};
					if(type=='article')
					{
						elem.type='article';
                    	elem.id=vals[j]['id'];
						var img_url = vals[j].images.bordered.png['150'].url;
						var pos = img_url.indexOf('.png');
						img_url=img_url.substring(0,pos+4);
						getShortUrl(img_url);
						elem.thumb_url=img_url;
						elem.title=vals[j]['tags'][0] || input;
						elem.message_text = img_url || "dai";
						
					}
					else if(type=="photo")
					{
						elem.type='photo';
						elem.id=vals[j]['id'];
						var img_url = vals[j].images.bordered.png['150'].url;
						elem.photo_url=img_url;
						elem.thumb_url=img_url;
						elem['photo_height']=150;
						elem['photo_width']=150;
					}
					
					telegram_results.push(elem);
                    
                }
           }
           else
		   {
			   var temp1 = {
					type :'article',
					id : 999 + 1 + '#',
					// message_text : "goo.gl/QfWdYt",
                    message_text:'goo.gl/QfWdYt',
					title : "Oops. No matching sticker found."
				}
				
				telegram_results.push(temp1);
		   }
  			
				callback(telegram_results);
        })
        .catch(function (err) {
            console.error(err);
			callback(telegram_results);
            // res.status(500);
        });
	
};






bot.on('inline_query', function(q){
	console.log("Query q is :"+ q['query']);
	var input = q['query'];
	console.log(q['query'].length);
	var result = [];
	
	if(input.length!=0)
	{
		getStickers(input,"photo", function(output) {
			console.log("Stickers output received");
			bot.answerInlineQuery(q.id, output, {
				next_offset: '',
				cache_time: 100
			});
			
		});
	}
	
		
});


var getRandomSticker = function(key, callback) {
    
    request("http://realmojiapi.herokuapp.com/api?input="+key, function(err, response, body) {
       
    // console.log(body);
       if(err) console.log("error");
       else
       {
           callback(body);
       }
        
    });
    
};

bot.onText(/\/help/, function(msg, match) {
    fromId = msg.from.id;
    var msg="Hey. There are two ways to use the imoji bot.\n\n1. Type '@imoji_bot' followed by a keyword and wait for the list to sticker options to load. Eg - @imoji_bot happy \n\n2. Add imoji_bot to your group chats and use '/imoji' followed by a keyword to get a random sticker. Eg - /imoji cool.";
    bot.sendMessage(fromId,msg);
});

bot.onText(/\/imoji (.+)/, function(msg, match) {
    var fromId;
    var privateSender = msg.from.id;
    if(msg.chat.id)
    {
        fromId = msg.chat.id;
    }
    else
        fromId = msg.from.id;
         
    var keyword = match[1];
    
    
    console.log("Key searched for is %s",keyword);

    //  bot.sendMessage(fromId,"type /imoji followed by a search term or complete sentence to get a random sticker"); 
     
     getRandomSticker(keyword, function(resp) {
        var resp = JSON.parse(resp);
    
        if(resp.status!="SUCCESS")
        {
            bot.sendMessage(privateSender,"Sorry, couldnt find a sticker for your keyword "+keyword);
        }
            
        else
        {
            var url=resp.url;
            var pos=url.indexOf('.png');
            url = url.substring(0,pos+4);
            var new_name = fromId+"-bordered.png";
            var cmd = "wget \'"+url+"\' && mv bordered-150.png "+new_name;

            download(url, new_name, function(){
                console.log('image download process');
                // if (error != null) {
                // console.log("ERROR: " + error);
                // }
                // else {
                    
                    bot.sendPhoto(fromId, new_name, {caption: ''}).then(function () {
                        resp.statusCode=200;
                        // res.send();
                        //deleting the image from heroku
                         fs.unlink(new_name,function() {
                            console.log("image deleted");
                        });
                        
                    });
                    
                    
                // }
            });
        //     child = exec(cmd, function (error, stdout, stderr) {
        //         if (error !== null) {
        //         console.log("ERROR: " + error);
        //         }
        //         else {
                    
        //             bot.sendPhoto(fromId, new_name, {caption: ''}).then(function () {
        //                 resp.statusCode=200;
        //                 // res.send();
        //                 //deleting the image from heroku
        //                 child = exec("rm "+new_name, function (error, stdout, stderr) {
        //                 });
        //             });
                    
                    
        //         }
                
        //  });
        }
     });
    
});

bot.on('message', function(msg) {
    var fromId=msg.from.id;
   var incoming_msg = msg.text;

    // console.log(JSON.stringify(msg));
  if(msg.text)
  {
    if(incoming_msg=="goo.gl/QfWdYt" || incoming_msg=="/help") {}
    else if(incoming_msg!="undefined" && incoming_msg.indexOf('/imoji')!=-1 && incoming_msg!="/imoji" ) {}
    else
    {
        var errormsg;
        if(msg.chat.id!=fromId)
            errormsg = "Type /imoji followed by a search term or complete sentence on your group chat to get a random sticker!";
         else
            errormsg = "Type /imoji followed by a search term or complete sentence to get a random sticker!";
        
        bot.sendMessage(fromId,errormsg); 
    } 
  }
  
   
});


var http = require("http");
setInterval(function() {
    http.get("http://telimoji.herokuapp.com");
}, 300000); // every 5 minutes (300000)

app.use('/', routes);
app.use('/users', users);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace

if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err,
            title: 'error'
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {},
        title: 'error'
    });
});


module.exports = app;
