let Flagpole = require('../dist/index.js').Flagpole;

let suite = Flagpole.Suite('Test Google')
    .base('http://www.google.com')
    .setConsoleOutput(false)
    .onDone(function (suite) {
        suite.print();
    });

let homepage = suite.Scenario('Homepage').open('/')
    .assertions(function (test) {
        test.status().equals(200);
        test.headers('content-type').contains('text/html');

        test.select('input[type="submit"]').attribute('value')
            .in(["Google Search", "Search"]);

        test.select('img').each(function (img, index) {
            img.load('Image ' + index).assertions(function (response) {
                response.length().greaterThan(0);
            });
        });

        test.optional().select('link[rel="stylesheet"]').each(function (link, index) {
            link.load('Stylesheet ' + index, true);
        });

        test.select('form')
            .attribute('action').equals('/search')
            .and().fillForm({
                q: 'milesplit'
            })
            .submit(searchResults);


    });

let searchResults = suite.Scenario('Search Results')
    .assertions(function (test) {
        test.status().equals(200);
        test.headers('content-type').contains('text/html');
        
        test.select('input[name="q"]').val().equals('milesplit');

        test.loadTime().lessThan(1000);
        
    });