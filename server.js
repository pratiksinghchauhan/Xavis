var express = require('express');
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

var apiai = require('apiai');
var googleStocks = require('google-stocks');

var googleFinance = require('google-finance');
var yfinance = require('yfinance');

var bot = apiai("b2cc46f617de4de7845443b6444651a0");


app.use(express.static(__dirname ));


app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  
     console.log('a user connected');

     console.log(socket.id);

     socket.emit('chat message', "Hi I am Xavis <br> Current I have Knowledge of most stocks that are listed on nasdaq <br> Thinking to get more knowledgeable in future..<b>Ask me any thing like:</b> <br> Stock prices of Goog <br> News about aapl");

     socket.on('disconnect', function(){
            console.log('user disconnected');
     });


     socket.on('chat message', function(data){
		   
		    console.log("message recieved");
		   
		    msg=data['message'];
			username=data['username'];
			 
			console.log(username+ ':' + msg);
			  
            var request = bot.textRequest(msg, {sessionId: socket.id});

            request.on('response', function(response) {
                        
						console.log(response);
						
						console.log(response.result['metadata'].intentName);

						if(response.result['metadata'].intentName=='AskStocksDirectly' || response.result['metadata'].intentName=='AskcompanyNews' ){
							companyname=response.result['parameters'].companyname || response.result['parameters'].nse;
							priceornews=response.result['parameters'].priceornews;
							console.log(companyname);

							if(priceornews=="price"){

							    yfinance.getQuotes(companyname, function (err, data) {
								    if(err){
									    console.log(err);
									    socket.emit('chat message', "Sorry...I cannot connect right now... Please try again later");
							     	}
								    else{
									    console.log(data);
								      	reply="Hi you searched for the stocks prices of "+companyname+" this is what I found : <br>current price: "+data[0].LastTradePriceOnly+" with a change of : "+data[0].Change+" as on "+ data[0].LastTradeWithTime.split('-')[0] + " <br>Few more details that you would love is <br> FiftydayMovingAverage : "+  data[0].FiftydayMovingAverage +"<br> TwoHundreddayMovingAverage : "+ data[0].TwoHundreddayMovingAverage;
									    console.log(reply);
									    socket.emit('chat message', reply);
								    }
							   });

							}

							else if(priceornews=="news"){
								googleFinance.companyNews({symbol: companyname}, function (err, news) {
                  //console.log(news);
                  
                  if(err){

                    console.log(err);
                    socket.emit('chat message', "cant connect at the moment... try again in some time");

                  }
									newsresult="";
									for(n in news){
										newsresult+= "<a href = " + news[n].link + " target='_blank'><br> "+news[n].title +"</a>" ; 
										//console.log(news[n].title);
										//console.log(news[n].link);
									}

									reply="Here is what I found about company "+ companyname +"<br>"+ newsresult;
									socket.emit('chat message', reply);

									console.log(newsresult);

								});

							}
							

						}
						else{
							reply=response.result['fulfillment'].speech;
							socket.emit('chat message', reply);
						}
    });

    request.on('error', function(error) {
           console.log(error);
	});

    request.end();
  
  });

});

http.listen(process.env.VCAP_APP_PORT || 5000, function(){
  console.log('listening on *:5000');
});