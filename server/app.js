let express = require('express'),
    fs = require('fs'),
    app = express(),
    path = require('path'),
    port = 3007;

app.use('/static/', express.static(path.resolve('dist', 'static')));

app.use('/api/project/list', function(request, response, next) {
    response.sendFile(path.resolve('server', 'data', 'projects.json'));
    // response.sendFile(path.resolve('server', 'data', 'projects-synthetic.json'));
});

app.use('/', function(request, response) {
    response.sendFile(path.resolve('dist', 'index.html'));
});

app.listen(port, function() {
    console.log(`Server started on port ${port}`);
});