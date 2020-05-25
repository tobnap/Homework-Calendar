// Puppeteer is an external library that allows you to control a browser from a javascript application
var puppeteer = require('puppeteer');

async function doLogin(page, login, loginEmail, loginPassword) {
    if (login == true) {
        await page.type('[type=email]', loginEmail);

        await Promise.all([
            page.click('#identifierNext'),
            page.waitForSelector('[type=password]', {visible: true}),
        ]);

        await page.type('[type=password]', loginPassword);

        await Promise.all([
            page.click('#passwordNext'),
            page.waitForNavigation({ waitUntil: 'networkidle0' }),
        ]);
    }
}

async function preNavigate(preNavigation, preNavButtons, preNavButtonTypes, preNavButtonNumbers) {
    if (preNavigation == true) {
        for (var i = 0; i < preNavButtons.length; i++) {
            if (preNavButtonTypes[i] == 'id') {
                document.getElementById(preNavButtons[i]).click();
            } else if (preNavButtonTypes[i] == 'classname') {
                document.getElementsByClassName(preNavButtons[i])[preNavButtonNumbers[i]].click();
            } else if (preNavButtonTypes[i] == 'name') {
                document.getElementsByName(preNavButtons[i])[preNavButtonNumbers[i]].click();
            } else if (preNavButtonTypes[i] == 'tagname') {
                document.getElementsByTagName(preNavButtons[i])[preNavButtonNumbers[i]].click();
            } else if (preNavButtonTypes[i] == 'tagnamens') {
                document.getElementsByTagNameNS(preNavButtons[i])[preNavButtonNumbers[i]].click();
            } else {
                console.log('invalid type');
            }
        }
    }
}

async function gotoWeek(page, weekNum) {
    while (weekNum != 0) {
        if (weekNum > 0) {
            await Promise.all([
                page.click('[id=' + navForward + ']'),
                page.waitForSelector('[id=load]', {visible: false}),
            ]);
            weekNum--;
        } else {
            await Promise.all([
                page.click('[id=' + navBack + ']'),
                page.waitForSelector('[id=load]', {visible: false}),
            ]);
            weekNum++;
        }
    }
}

// Scrape function "scrapes" or gathers data from pages with classroom assignments
async function scrape(login, loginEmail, loginPassword, preNavigation, preNavButtons, preNavButtonTypes, preNavButtonNumbers, navigation, navButtons, navButtonTypes, navButtonNumbers, elements, elementTypes, elementNumbers, replace, replaceText, navForward, navBack, url, weekNum) {
    // Launch an instance of a chromium browser controlled by puppeteer not in headless mode
    var browser = await puppeteer.launch({ headless: false });
    var page = await browser.newPage();

    // Puppeteer goes to the url and waits for the page to load
    await page.goto(url);

    // If the login parameter is true, login
    await doLogin(page, login, loginEmail, loginPassword);

    // If the preNavigation parameter is true, do the required navigation to get to the page with the classroom assigments
    await preNavigate(preNavigation, preNavButtons, preNavButtonTypes, preNavButtonNumbers);

    // If week number is not 0 navigate forward or backward in time and adjust weekNum accordingly until weekNum is 0
    await gotoWeek(page, weekNum);

    // Executes the code on the page to gather the assignment data
    var data = await page.evaluate( (navigation, navButtons, navButtonTypes, navButtonNumbers, elements, elementTypes, elementNumbers) => {
        var week = [];

        // Loop for every day in a school week
        for (var i = 0; i < 5; i++) {
            var day = [];

            // If navigation is true, navigate to the element that needs to be scraped
            if (navigation == true) {
                for (var j = 0; j < navButtons.length; j++) {
                    if (navButtonTypes[i][j] == 'id') {
                        document.getElementById(navButtons[i][j]).click();
                    } else if (navButtonTypes[i][j] == 'classname') {
                        document.getElementsByClassName(navButtons[i][j])[navButtonNumbers[i][j]].click();
                    } else if (navButtonTypes[i][j] == 'name') {
                        document.getElementsByName(navButtons[i][j])[navButtonNumbers[i][j]].click();
                    } else if (navButtonTypes[i][j] == 'tagname') {
                        document.getElementsByTagName(navButtons[i][j])[navButtonNumbers[i][j]].click();
                    } else if (navButtonTypes[i][j] == 'tagnamens') {
                        document.getElementsByTagNameNS(navButtons[i][j])[navButtonNumbers[i][j]].click();
                    } else {
                        console.log('invalid type');
                    }
                }
            }

            // Scrape assigment info from page and adds it to day array
            if (elementTypes[i] == 'id') {
                day.push(document.getElementById(elements[i]).innerText);
            } else if (elementTypes[i] == 'classname') {
                for (var j = 0; j < document.getElementsByClassName(elements[i])[elementNumbers[i]].childNodes.length; j++) {
                    day.push(document.getElementsByClassName(elements[i])[elementNumbers[i]].childNodes[j].innerText);
                }
            } else if (elementTypes[i] == 'name') {
                for (var j = 0; j < document.getElementsByName(elements[i])[elementNumbers[i]].childNodes.length; j++) {
                    day.push(document.getElementsByName(elements[i])[elementNumbers[i]].childNodes[j].innerText);
                }
            } else if (elementTypes[i] == 'tagname') {
                for (var j = 0; j < document.getElementsByTagName(elements[i])[elementNumbers[i]].childNodes.length; j++) {
                    day.push(document.getElementsByTagName(elements[i])[elementNumbers[i]].childNodes[j].innerText);
                }
            } else if (elementTypes[i] == 'tagnamens') {
                for (var j = 0; j < document.getElementsByTagNameNS(elements[i])[elementNumbers[i]].childNodes.length; j++) {
                    day.push(document.getElementsByTagNameNS(elements[i])[elementNumbers[i]].childNodes[j].innerText);
                }
            } else {
                console.log('invalid type');
            }

            // Push the array full of the assigments for that day to the assigments for the week array
            week.push(day);
        }

        return week;
    }, navigation, navButtons, navButtonTypes, navButtonNumbers, elements, elementTypes, elementNumbers);

    browser.close()

    console.log(data);

    return data;
}

// Express is an external library that allows your application to accept http requests
var express = require('express');
// To read post requests express needs body parser
var bodyParser = require("body-parser");
var app = express();
var port = 8080;

// Configure express to user body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// For every file ending in .html in the html folder send the file to the user loading the page
app.get('/*.html?', function (req,res) {
    res.sendFile(req.url, {root: './html'});
});

// Respond to api request from client
app.post('/api', function (req, res) {
    var response = [];
    (async () => {
        // Loop through every source that needs to be scraped. 
        for (var i = 0; i < req.body.data.length; i++) {
            var request = req.body.data[i];
            // Pass info from request into scrape function
            data = scrape(request.login, request.loginEmail, request.loginPassword, request.preNavigation, request.preNavButtons, request.preNavButtonTypes, request.preNavButtonNumbers, request.navigation, request.navButtons, request.navButtonTypes, request.navButtonNumbers, request.elements, request.elementTypes, request.elementNumbers, request.replace, request.replaceText, request.navForward, request.navBack, request.url, request.weekNum);
            response.push(await data);
        }
        // Return response to the client
        res.send(response);
    })();
});

app.listen(port, () => console.log(`App listening at port ${port}`));

//Bio Google Calendar
//scrape(false, '', '', true, ['tab-controller-container-week'], ['id'], [0], true, [[]], [[]], [[]], ['x2y3', 'x3y3', 'x4y3', 'x5y3', 'x6y3'], ['id', 'id', 'id', 'id', 'id'], [0, 0, 0, 0, 0], false, [], 'nextButton', 'prevButton', 'https://calendar.google.com/calendar/embed?src=spartandocs.org_mqhtkienr3dqv20drmtfhd2rgs%40group.calendar.google.com&ctz=America/New_York', 0);