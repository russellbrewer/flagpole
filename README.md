# Flagpole

*"Run it up the flagpole and see who salutes"*

This quote represents to float an idea or concept out there and test the results. So in our context we are flying our code by this quick QA test framework and testing its success.

It is created as a quick way to run smoke or integration tests against an application that produces and HTML output. It does not run a full browser, but instead just pulls the HTML code and evaluates the DOM. So it is not an e2e, UI, browser, CSS, or JavaScript test. It does not execute any embedded scripts, so it can't be used for dynamically generated SPAs or the like. That is, unless they get pre-compiled on the server side.

Flagpole is also suitable for testing REST API frameworks, currently only supporting JSON format. We don't have plans currently to add support for XML or SOAP formats, because they suck. But hey if you want to add it, that wouldn't be too hard!

## Getting Started

First thing we need to do is install Flagpole with npm. Go into the root of your project and run this:

```bash
npm i -g flagpole
npm i flagpole
```

The above command installs it both locally (within the project) and globally. This is a little annoying that we have to do both. But we do. Globally is so that the command "flagpole" will run. The second one is so that your test suites can find it.

You should be able to run the flagpole command now, which will give you instructions on how to use the CLI.

```bash
flagpole
```

Pretty colors, eh?

Now we need a folder to put our tests in. So create one. Let's just call it tests for now.

```bash
mkdir tests
```

Let's create an empty test file just so we can see something work quickly.

```bash
touch tests/hello.js
```

Now run flagpole and point it at that folder to list the test suites in it. Like this:

```bash
flagpole list -p tests/
```

Let's create a config file now, so we don't have to pass in the path parameter.

```bash
touch flagpole.json
```

Now open that file in your favorite editor and put this in it and save:

```json
{
    "path": "tests/"
}
```

Now run the command again with no path argument.

```bash
flagpole list
```

Sweet! How about we actually do something with the test now and run it. So open that hello.js file we created earlier in your editor and put this in it:

```typescript
import { Flagpole } from 'flagpole'

Flagpole.Suite('Hello World').base('https://www.flosports.tv')

    .Scenario('Just getting a test to run').open('/')
    .assertions(function(response) {
        response.status().equals(200);
    });
```

Now run the flagpole run command, like so...

```bash
flagpole run
```

And if we did everything right, then you should see something like:

```text

     $$$$$$$$\ $$\                                         $$\           
     $$  _____|$$ |                                        $$ |          
     $$ |      $$ | $$$$$$\   $$$$$$\   $$$$$$\   $$$$$$\  $$ | $$$$$$\  
     $$$$$\    $$ | \____$$\ $$  __$$\ $$  __$$\ $$  __$$\ $$ |$$  __$$\ 
     $$  __|   $$ | $$$$$$$ |$$ /  $$ |$$ /  $$ |$$ /  $$ |$$ |$$$$$$$$ |
     $$ |      $$ |$$  __$$ |$$ |  $$ |$$ |  $$ |$$ |  $$ |$$ |$$   ____|
     $$ |      $$ |\$$$$$$$ |\$$$$$$$ |$$$$$$$  |\$$$$$$  |$$ |\$$$$$$$\ 
     \__|      \__| \_______| \____$$ |$$  ____/  \______/ \__| \_______|
                             $$\   $$ |$$ |                              
                             \$$$$$$  |$$ |                              
                              \______/ \__|  

 ================================================== 
                    HELLO WORLD                    
 ================================================== 
 » Base URL: http://www.flosports.tv 
 » Environment: dev 
 » Took 1383ms
 
 » Passed? Yes
 
 Just getting a test to run 
   ✔  Loaded HTML Page / 
   ✔  HTTP Status equals 200 
   » Took 1382ms

```

That's it! Now start learning more and writing tests!

## QA Terminology

**Suite:** A suite is a logical grouping of tests that you would always want to run together. It is recommended that you create one suite per file in the tests folder.

**Scenario:** Within a suite of tests, you will define one or more different scenarios. This would typically define a goal that a user might be trying to accomplish or otherwise the "thing" that the tests in that scenario are trying to prove works. So usually you would have one endpoint or page per scenario. And you would have one or more scenario per page or endpoint.

**Assertion:** With Flagpole, unlike some other test frameworks, you will not typically call assert directly. However, we will refer to it in this documentation. An assertion is a statement that you want to test that you are saying should be true.

## Format of a test suite

Every suite should be located in its own file within the tests folder (or a subfolder).

It should start with the definition of the suite's name, like:

```
Flagpole.Suite('iTunes API Tests')
````

This is not required but typically after that you would define the base URL that you want to use. All of the scenarios will build their URL off of this base.

```
.base('https://itunes.apple.com')

```

Next we would usually define each scenario, like so:

```
.Scenario('See if there are any 2Pac Videos')
```

Next we need to define the type of scenario this is, currently either "html" or "json" but more may be added. HTML is the default, so if you're testing a REST API be sure to set it:

```
.json()
```

Then we would typically specify the endpoint that are want to hit. Remember this gets build in context with the base URL that we specified earlier, so you should not enter the full URL path.

There are some cases where we may not want to set it yet, like if the URL of the test will be dynamic based on the result of another test. We'll get to that later, but in that case you'd skip this step.

```
.open('/search?term=2pac&entity=musicVideo')
```

And finally we do our assertions callback, which will get called after the page or endpoint loads.

```
.assertions(function(response) {
   // Your test assertions will go in here
}
```

Putting it all together it would look like this:

```javascript
import { Flagpole } from 'flagpole';
// or
let Flagpole = require('flagpole').Flagpole;


Flagpole.Suite('iTunes API Tests')
    .base('https://itunes.apple.com')

    .Scenario('See if there are any 2Pac Videos')
    .type('json')
    .open('/search?term=2pac&entity=musicVideo')
    .assertions(function(response) {
        // Your test assertions will go in here
    });
```

## Response Traversal

Once the endpoint is loaded, the assertions callback will fire with the response object. 

The first thing you may want to do is test some of the basic response headers and such. Things like...

```javascript

// Check for HTTP status code
response.status().equals(200);
// Check for certain header values
response.headers('Content-Type').contains('text/javascript');
response.headers('content-length').greaterThan(0);

```

You can also test for load time being under a threshold:

```javascript
test.loadTime().lessThan(1000);
```

Now let's look into the response body and check for certain things to exit. We want to traverse the body. This works both for HTML and JSON responses.

So for an HTML response, we might want to do something with CSS selectors like:

```javascript
var topStories = response.select('#topStories articles');
```

While for a JSON response we may want to do:

```javascript
var results = response.select('data.results');
```

Once you have grabbed a certain element like that, you could do further traversal. Some are available for JSON too, but this is usually more of an HTML thing.

```javascript
var summaries = topStories.find('p.summary');
```

You could also do most of the jQuery methods like children, closest, next, etc. But I won't get into all of those for now.

For a selector that returns a multiple matching elements, you can also use nth (or its synonym eq), first, and last.

## Making assertions

Cool! So now we selected something....

```javascript
var results = response.select('data.results');
```

"But what do we do with it???" Well, I'm glad you asked, young padwan! We make assertions.

But just because we have an element... that doesn't mean we want to make an assertion against the element directly. No, more like you wan to make an assertion about something about that element.

Like maybe we want to make sure it is a certain data type.

```javascript
results.is('array');
```

Well that was easy, but what if we also want to make sure the array isn't empty?

```javascript
results.length().greaterThan(0);
```

BAM! Okay, okay, but let's check some of the actual content. Sure...

```javascript
results.first().property('id').is('number').greaterThan(0);
```

Ohhh... see I'm pretty slick there with my chaining. Like when you do a spin move on the dance floor and then throw in a split at the end or something.

So above we selected the first element of the results array, and then looked at the id property.

Built in with that property('id') method is an exists() call, so we don't need to explicitly check for the exists. And then we chain it to then make sure it's a number that is greater than 0.

What else can we check for?

```javascript
let firstElement = results.first();
firstElement.property('id').is('number').greaterThan(0)
    .and().property('kind').equals('music-video')
    .and().property('artist-name').contains('Makaveli')
    .and().property('first-name').startsWith('Tu')
    .and().property('last-name').endsWith('ur')
    .and().property('status').matches(/hip-?hop/i)
    .and().property('genre').similarTo('greatest of all time');
```

Alright, so we started using and(). This makes it a bit more legible, but also whenever you use and() it returns you back the last element that you traversed to. So sometimes you get lost in your chaining and you might end up being on a property, but you want to get back to the element. The and() will go back to that last thing you got from a traversal method.

If, on the other hand, you just wanted to do two tests on the same property then you don't need the and() ... like this:

```javascript
let firstElement = results.first();
firstElement.property('artist-name').startsWith('Tu').endsWith('pac');
```

Got it? Good!

And if you're doing more HTML specific things you can do that too with jQuery similar methods, like this...

```javascript
let topStories = response.select('#topStories articles');
let lastStory = topStories.last();
lastStory.find('strong.title').text().trim().length().greaterThan(0);
lastStory.find('a.author').attribute('href')
    .and().text().matches(/a-z+/i)
    .and().data('author-id').is('number');
```

Okay, so we got the last element. We made sure it had a title with actual text in it.

Then we checked on the author link. We made sure it had a href attribute (again this uses an implied exists() so we don't need to explicity test the exists).

Then we made sure it had text that matched the regex in the author. And last we checked for a data attribute, just like jQuery might support.

If we wanted to check the value on a form, we'd do it similar to jQuery also...

```javascript
let commentBox = response.select('#commentForm textarea[name="comment"]');
commentBox.val().equals('Enter your comment here');
```

Beautiful!

## Loops

So what if you want to loop through all elements in that results array? We got you!

Remember earlier we fetched the results array? Let's loop through each element of that.

```javascript
results.each(function(track) {
    track.property('trackId').is('number');
    track.property('kind').equals('music-video');
});
```

## Delaying execution and dynamic endpoints

Okay... now you say... well that's great if you know the URL, but what if you want to build something dynamically based on something else. Like run one scenario, that triggers another scenario based on something in the first scenario.

Well if you thought you could trip me up that easily, HAH!

```javascript

let articleTest = Scenario('Check on an article')
    .assertions(function(response) {
        response.status().equals(200);
        response.select('main article.body').text().length().greaterThan(0);
    });

let homepageTest = Scenario('Check on homepage content').open('/')
    .assertions(function(response) {
        response.status().equals(200);
        response.select('#topStories article a.title').first()
            .text().length().greaterThan(0)
            .and().click(articleTest);
    });

```

So you're all wait... a minute... but we're not actually running a web browser, so how can we CLICK something?!? We'll you'd be right about that. That is really some sugar syntax to just make it nice and similate a click on an "a href" tag. If you tried that on something without a href element then it would fail.

So what we actually did though... notice the articleTest does not have an open() method. So we never give it a URL to open at first. So it doesn't automatically execute.

When we call the click() method and pass in a reference to that scenario, it applies that URL to that scenario, which causes it to execute asynchronously. 

SWEET!

But what if you don't like all that sugar? And you wanna fetch that href content yourself. Then you go on with your bad self and you do that...

```javascript

let articleTest = Scenario('Check on an article')
    .assertions(function(response) {
        response.status().equals(200);
        response.select('main article.body').text().length().greaterThan(0);

    });

let homepageTest = Scenario('Check on homepage content').open('/')
    .assertions(function(response) {
        response.status().equals(200);
        var articleLink = response.select('#topStories article a.title').first()
            .text().length().greaterThan(0)
            .and().attribute('href').toString();
        articleTest.open(articleLink);
    });

```

So if you can parse though all of the chaining... at the end of the day we ran a toString() method which made the whole thing return the value of that attribute. We could also have done a get() method instead of toString() ... they are similar but not exactly the same. But both result in returning that value.

After that then we manually told articleTest to open that URL... which (since the assertions and url are then defined) causes it to execute right away.

If for some reason you really don't want something to execute... even after giving it both assertions and a URL, then you can use the wait() and execute() methods.


```javascript

let articleTest = Scenario('Check on an article')
    .wait()
    .assertions(function(response) {
        response.status().equals(200);
        response.select('main article.body').text().length().greaterThan(0);

    });

let homepageTest = Scenario('Check on homepage content').open('/')
    .assertions(function(response) {
        response.status().equals(200);
        var articleLink = response.select('#topStories article a.title').first()
            .text().length().greaterThan(0)
            .and().attribute('href').toString();
        articleTest.open(articleLink);
        setTimeout(function() {
            articleTest.execute();
        }, 5000);
    });

```

So since we told it to wait() at first, even after we set the open() then it will then wait for that execute() ... which in this case fires 5 seconds later.

## Simulating filling a form and submitting

For simple forms, we can complete them... check their input and submit them. 

The resulting page will run in another scenario that gets delayed until the form submission response comes back.

```javascript

let suite = Flagpole.Suite('Test Google')
    .base('http://www.google.com')
    .setConsoleOutput(false)
    .onDone(function (suite) {
        suite.print();
    });

let homepage = suite.Scenario('Homepage').open('/')
    .assertions(function (test) {
        test.status().equals(200)
            .headers('content-type').contains('text/html')
            .select('form')
                .attribute('action').equals('/search')
                .and().fillForm({
                    q: 'milesplit'
                })
                .submit(searchResults);
    });

let searchResults = suite.Scenario('Search Results')
    .assertions(function (test) {
        test.status().equals(200)
            .headers('content-type').contains('text/html')
            .select('input[name="q"]').val().equals('milesplit');
    });

```

## Using the CLI

**List all tests**

flagpole list

**Execute a specific suite**

flagpole run -s api

**Execute multiple named suites**

flagpole run -s api smoke

**Execute all tests**

flagpole run

**Set the root path where to look for the tests**

flagpole -p path/to/project/tests

**Run tests and specify a config file**

flagpole run -c path/to/config.json

**Having trouble? Run it with additional debug info**

flagpole list --debug

## Using a config file

By default Flagpole will look for a file called flagpole.json in the path supplied as a command line parameter, or (if no path argument was provided) in the current working directory.

In that file, you can specify a couple of things:

```javascript

{
  "path": "test/flagpole",
  "base": {
    "dev": "http://www.mysite.local",
    "staging": "http://staging.mysite.com",
    "prod": "http://www.mysite.com"
  }
}
```

The path setting will set the default path of where to look for tests. You can override this with the path argument in the command line. However, this makes it so you can place the config file in the base of your project (or where ever you intend to run it from) and it will know where your tests are without you having to tell it.

The base setting is to define the base domain where the tests will start from, with respect to the environment (which is set as a command line argument).

So rather than having to specify the base method in each test suite, just set it once in the config.

I'm sure we'll add more config options as the need arises.

## What about the things that Flagpole doesn't support??!

Well at the end of the data, you're just writing JavaScript (or TypeScript). So you can usually do the thing that you think the framework can't do yourself!

There is a plain old assert() method you can do to create your own assertions. So let's say you want to test if something is an even number but you're all "Flagpole don't have an assertEvent() method!!!" Well do it your own dang self:

```typescript
let someNumber: number = response.select('#something span.num').parseInt().get();
response.assert(someNumber % 2 == 0, "Number is even");
```

Also if you want to conditionally run tests or not within a given scenario you can do that. You don't need our help to do that, bro.

```javascript
if (someNumber % 2 == 0) {
    response.select('div.thisThing').text().similarTo('foo');
}
else {
    response.select('div.thatOtherThing').text().similarTo('bar');
}
```

Or if you want to run a whole scenario conditionally, cool. So use the technique we outlined above to not run a scenario at first. Either by not (yet) setting the URL to open or by setting wait() on it. Let's assume we put wait() on otherScenario below.

```javascript
if (someNumber % 2 == 0) {
    otherScenario.execute();
}
else {
    otherScenario.skip();
}
```

Ahhh... I threw a new one on you! There is a skip method for scenarios. This will not execute any of the assertions in it, but it will mark it as completed and your suite can pass without running this scenario.

## More Advanced Topics

Let's say you want to loop through every item in an array of elements and make sure it passes. But you don't really want to do an each() method and make assertions because then you'll have SO MANY assertions in your report. You just want one line in the tests and make sure they all pass. 

```javascript
let results = response.select('results');
results.label('Make sure every track is type music video.');
results.every(function(track) {
    return track.property('kind').toString() == 'music-video';
});
```

They key here is we are NOT making assertions in the every function callbacks. We are evaluating the result ourselves and returning true or false. If it meets the criteria return true, if not return false. So don't try to rely on an assertion method, use get() or toString() to get values and evaluate them yourself. 

If every loop over that array returns true, then the test passes. Notice that before it we put a label() method to set the pass/fail message. This is optional but will make your assertion log make more sense if you put a descriptive label of what you are testing for.

Similar to that, maybe we just want to test that AT LEAST ONE in the array passes. That's what some() is for.

```javascript
let results = response.select('results');
results.label('Make sure at least one track is a music video');
results.some(function(track) {
    return track.property('kind').toString() == 'music-video';
});
```

Works the same way, except the assertion passes if at least one returns true.

