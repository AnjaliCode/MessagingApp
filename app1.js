var path = require('path');
var ObjectID = require("bson-objectid");
const request = require('request');
var JSON = require('JSON');
//var jquery = require('jquery');
var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

var PORT = 8080 || process.env.PORT;
app.set('PORT', PORT);

//  app.use(express.static(path.join(__dirname, 'public')));

    app.get("/", function(req, res){
      res.sendFile(path.join(__dirname, 'index.html'));
    });

    io.on('connection', function(socket){
      console.log('Socket is open on the port...');
      var userName = '';
      socket.on('send username', function(username){
        userName = username;
        name = username;
        console.log('username: ', username);
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

        console.log('message: ', message);

     //Updating the last message in conversations end point
      const options_conversations = {
        url: 'https://sec.meetkaruna.com/api/v1/conversations',
        method: 'GET'
      }
      request(options_conversations, function(err, output, body){
        if(err) throw error;
        var json = JSON.parse(body);

        for(var i=0; i<json.data.length; i++){
          if(userName == json.data[i].name){
            index = i;
            console.log('index: ', index);
            uuid = json.data[i].uuid;
            console.log('uuid: ', uuid);
          }
        }
        if(index != -1) {
          json.data[index].last_message = JSON.stringify(message);

          const options = {
            url: 'https://sec.meetkaruna.com/api/v1/conversations/' + json.data[index].uuid,
            method: 'GET'
            };
            request(options, function(error, response, theBody) {
            if(error) throw error;
            var jsonResponse = JSON.parse(theBody);
            jsonResponse.data[index].messages.push(JSON.stringify(message));

            const optionsPost = {
              urlPost: 'https://sec.meetkaruna.com/api/v1/conversations/' + json.data[index].uuid,
              method: 'POST'
            };
            request(optionsPost, function(errors, reply, dBody){
              if(errors) throw errors;
              jsonResponse.data[index].messages.push(JSON.stringify(message));
            });

            for(var i in jsonResponse.data[index].messages){
              socket.emit('all messages', json.data[index].messages[i]);
            }
          });
          }

      else {
        var conversation = {};
        var uuid_conversation = ObjectID.generate();
        var name = userName;
        var unread = 1;
        var last_message = message;

        conversation.uuid = uuid_conversation;
        conversation.name = name;
        conversation.unread = 1;
        conversation.last_message = message;
        console.log('conversation: ', conversation);

        const optionsPostConver = {
          urlPost: 'https://sec.meetkaruna.com/api/v1/conversations/',
          method: 'POST'
        };
        request(optionsPostConver, function(errors, reply, dBody){
          if(errors) throw errors;
          json.data.push(JSON.stringify(conversation));
        });

      }
      });

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
