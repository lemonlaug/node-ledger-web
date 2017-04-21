var _ = require('lodash'),
    express = require('express'),
    //favicon = require('serve-favicon'),
    methodOverride = require('method-override'),
    session = require('express-session'),
    logger = require('morgan'),
    errorHandler = require('errorhandler'),
    home = require('./routes/home'),
    http = require('http'),
    path = require('path'),
    engine = require('ejs-locals'),
    httpProxy = require('http-proxy'),
    LedgerRest = require('ledger-rest').LedgerRest;

var config;
try {
  config = require('./config.json');
} catch (e) {
  config = require('./sample-config.json');
}

var app = express();

var port = process.env.PORT || 3000
app.set('port', port);
app.set('views', __dirname + '/views');
app.set('view engine', 'html');
app.engine('html', engine);

//app.use(favicon(path.join(__dirname, '/public/favicon.ico')));
app.use(logger('dev'));
app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ resave: true, saveUninitialized: true, secret: process.env.SESSION_SECRET || 'pleasechangeme'}))

var proxy = httpProxy.createProxyServer();

// Example ledger .dat file from the appendix of the Ledger 3 manual
var ledgerRest = new LedgerRest(config);

var ledgerRestPort = port + 1;
ledgerRest.listen(ledgerRestPort, function() {
  console.log('Ledger REST server listening on port ' + ledgerRestPort);
});

// Proxy API requests to the ledger REST service
app.use('/api', function (req, res) {
  proxy.web(req, res, { target: {
    host: 'localhost',
    port: port + 1
  }});
});

if (app.get('env') == 'development') {
  app.use(errorHandler());
}

var routes = [
  '/',
  '/income', '/income/*',
  '/spending', '/spending/*',
  '/worth', '/worth/*',
  '/balance', '/balance/*',
];

_.each(routes, function(route) {
  app.get(route, home.index);
});

var server = http.createServer(app);
server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
