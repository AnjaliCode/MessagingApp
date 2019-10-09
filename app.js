var path = require('path');
var ObjectID = require("bson-objectid");
var request = require('request');
var session = require('express-session');
var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

var PORT = 8080 || process.env.PORT;
app.set('PORT', PORT);

//app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized:true}));

  var userName = '';

      app.get("/", function(req, res){
        res.sendFile(path.join(__dirname, 'index.html'));
          if(req.user){
            console.log('req.user: ', req.user);
            userName = req.user;
            console.log('user named ', req.user, ' is already present');
          }
       }); // app.get

      io.on('connection', function(socket){
        console.log('Socket is open on the port...');
        var total=io.engine.clientsCount;
        console.log('total: ', total);
        if(total>1){
          for(var i=0; i<total; i++){
            socket.emit('disconnect');
          }
        }

      socket.on('send username', function(username){
        userName = username;
        name = username;
        console.log('username: ', username);

          var url = "https://sec.meetkaruna.com/api/v1/conversations";
          var uuid, index;
          request(url, function(err, output, body){
            if(err) throw err;
            var json = JSON.parse(body);
            for(var i=0; i<json.data.length; i++){
              if(username == json.data[i].name){
                index = i;
                console.log('index: ', index);
                uuid = json.data[i].uuid;
                console.log('uuid: ', uuid);
              }
            }
            if(index != -1) {

              var otherUrl = "https://sec.meetkaruna.com/api/v1/conversations/" + uuid;
              console.log('otherUrl: ', otherUrl);
                  request(otherUrl, function(error, response, theBody){
                    if(error) throw error;
                    var jsonResponse = JSON.parse(theBody);
                    var messages = [];
                    for(var j=0; j<jsonResponse.data.messages.length; j++) {
                      jsonResponse.data.messages[j].date =  Date.parse(jsonResponse.data.messages[j].created_at);
                      messages.push(jsonResponse.data.messages[j]);
                    }
                    var sortedMessages = messages.sort(function(a,b){
                        return b.date - a.date;
                    });
                    socket.emit('allMessages',sortedMessages);
                }); // second request
                var name = json.data[index].name;
                var unread = json.data[index].unread;
                var last_message = json.data[index].last_message;

              socket.emit('conversation meta', {name: name, unread: unread, last_message: last_message});
            }
        }); //first request
      });

  socket.on('send to server', function(data){
    console.log('data on server: ', data);
      var message = {};
      var uuid = ObjectID.generate();
      var body = data;
      var direction = 'incoming';
      var created_at = ''+new Date()+ '';

      message.uuid =uuid;
      message.body = body;
      message.direction = direction;
      message.create_at = created_at;

      var conversation = {};
      var uuid_conversation = ObjectID.generate();
      var name = userName;
      var unread = 1;
      var last_message = message;

      conversation.uuid = uuid_conversation;
      conversation.name = name;
      conversation.unread = 1;
      conversation.unread = message;
      console.log('conversation: ', conversation);

      if(data == 'Hi')
        socket.emit('send to client', 'Hello, I am the automated system. Please ask any questions feel necessary');
      });

      socket.on('disconnect', function(){
        console.log('Socket is disconnected');
      });
    }); // io.connection


http.listen(PORT, function(){
  console.log("Server has started on PORT ",app.get('PORT'), " ...");
});
