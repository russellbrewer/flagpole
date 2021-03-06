let Flagpole = require('../../dist/index.js').Flagpole;

Flagpole.Suite('iTunes API Tests')
    .base('https://itunes.apple.com')
    .setConsoleOutput(false)
    .onDone(function (suite) {
        suite.print();
    })


    .Scenario('See if there are any 2Pac Videos')
    .open('/search?term=2pac&entity=musicVideo').json()
    .assertions(function(response) {

        response.status().equals('200');
        response.headers('Content-Type').contains('text/javascript');
        response.headers('content-length').greaterThan(0);

        var resultCount = response.select('resultCount');
        var results = response.select('results');
        var firstTrack = results.first();

        resultCount.is('number');
        resultCount.greaterThan(0);
        results.is('array');
        results.length().equals(resultCount.get());
        firstTrack.property('wrapperType').equals('track');
        firstTrack.property('artworkUrl100').matches(/mzstatic\.com.+100x100bb\.jpg$/);

        results.comment('Loop through each result element');
        results.label('Make sure every track is type music video.');
        results.every(function(track) {
            return track.property('kind').toString() == 'music-video';
        });

        results.find('0.trackExplicitness').in(['notExplicit', 'explicit'])

        resultCount.text();

    });

