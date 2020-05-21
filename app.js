var puppeteer = require('puppeteer');

async function scrape(login, loginEmail, loginPassword, preNavigation, preNavButtons, preNavButtonTypes, preNavButtonNumbers, navigation, navButtons, navButtonTypes, navButtonNumbers, elements, elementTypes, elementNumbers, replace, replaceText, navForward, navBack, url, weekNum) {
    var browser = await puppeteer.launch({ headless: false });
    var page = await browser.newPage();

    await page.goto(url);

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

    console.log(weekNum);

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

    var data = await page.evaluate( (navigation, navButtons, navButtonTypes, navButtonNumbers, elements, elementTypes, elementNumbers) => {
        var week = [];

        for (var i = 0; i < 5; i++) {
            var day = [];

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

            if (elementTypes[i] == 'id') {
                var test = (document.getElementById(elements[i]).innerText).replace(/HOMEWORK: .*$/, '');
                day.push(test);
                //day.push((document.getElementById(elements[i]).innerText).replace(/HOMEWORK: .*$/, ''));
            } else if (elementTypes[i] == 'classname') {
                console.log(elements);
                console.log(elementNumbers);
                for (var j = 0; j < document.getElementsByClassName(elements[i])[elementNumbers[i]].childNodes.length; j++) {
                    console.log(i);
                    console.log(elements[i]);
                    day.push(document.getElementsByClassName(elements[i])[elementNumbers[i]].childNodes[j].innerText);
                }
            } else if (elementTypes[i] == 'name') {
                for (var j = 0; j < document.getElementsByName(elements[i])[elementNumbers[i]].childNodes.length; j++) {
                    day.push(document.getElementsByName(elements[i])[elementNumbers[i]].childNodes[j].innerText);
                }
                //day.push(document.getElementsByName(elements[i])[elementNumbers[i]].innerText);
            } else if (elementTypes[i] == 'tagname') {
                for (var j = 0; j < document.getElementsByTagName(elements[i])[elementNumbers[i]].childNodes.length; j++) {
                    day.push(document.getElementsByTagName(elements[i])[elementNumbers[i]].childNodes[j].innerText);
                }
                //day.push(document.getElementsByTagName(elements[i])[elementNumbers[i]].innerText);
            } else if (elementTypes[i] == 'tagnamens') {
                for (var j = 0; j < document.getElementsByTagNameNS(elements[i])[elementNumbers[i]].childNodes.length; j++) {
                    day.push(document.getElementsByTagNameNS(elements[i])[elementNumbers[i]].childNodes[j].innerText);
                }
                //day.push(document.getElementsByTagNameNS(elements[i])[elementNumbers[i]].innerText);
            } else {
                console.log('invalid type');
            }

            week.push(day);
        }

        return week;
    }, navigation, navButtons, navButtonTypes, navButtonNumbers, elements, elementTypes, elementNumbers);

    browser.close()

    console.log(data);

    return data;
}

var express = require('express');
var app = express();
var port = 8080;

app.get('/*.html?', function (req,res) {
    res.sendFile(req.url, {root: './html'});
});

app.get('/api', function (req, res) {
    var response = [];
    (async () => {
        for (var i = 0; i < req.query.data.length; i++) {
            var request = req.query.data[i];
            console.log(request);
            data = scrape(request.login, request.loginEmail, request.loginPassword, request.preNavigation, request.preNavButtons, request.preNavButtonTypes, request.preNavButtonNumbers, request.navigation, request.navButtons, request.navButtonTypes, request.navButtonNumbers, request.elements, request.elementTypes, request.elementNumbers, request.replace, request.replaceText, request.navForward, request.navBack, request.url, request.weekNum);
            response.push(await data);
        }
        console.log(response);
        res.send(response);
    })();
});

app.listen(port, () => console.log(`Example app listening at port ${port}`));

//Algebra Google Classroom
//scrape(true, 'sn23.napolitanot@spartandocs.org', 'xxxxxxxx', false, [], [], [], false, [[]], [[]], [[]], ['reG5qe', 'reG5qe', 'reG5qe', 'reG5qe', 'reG5qe'], ['classname', 'classname', 'classname', 'classname', 'classname'], [1, 2, 3, 4, 5], false, [], 'navForward1', 'navBack1', 'https://classroom.google.com/u/0/calendar/this-week/course/Mzc0NDUxMzMwMTNa', 0);

//Algebra Planbook
//scrape(false, '', '', false, [], [], [], false, [[]], [[]], [[]], ['x2y3', 'x3y3', 'x4y3', 'x5y3', 'x6y3'], ['id', 'id', 'id', 'id', 'id'], [0, 0, 0, 0, 0], false, [], 'nextButton', 'prevButton', 'https://planbook.com/planbook.html?t=1045823&k=Dottery&v=W&c=12587273&y=1218647', 0);

//English Planbook
//scrape(false, '', '', false, [], [], [], false, [[]], [[]], [[]], ['x2y4', 'x3y4', 'x4y4', 'x5y4', 'x6y4'], ['id', 'id', 'id', 'id', 'id'], [0, 0, 0, 0, 0], false, [], 'nextButton', 'prevButton', 'https://www.planbook.com/planbook.html?t=1048052&k=howsare&v=W&y=1357655', 0);

//Bio Google Calendar
//scrape(false, '', '', true, ['tab-controller-container-week'], ['id'], [0], true, [[]], [[]], [[]], ['x2y3', 'x3y3', 'x4y3', 'x5y3', 'x6y3'], ['id', 'id', 'id', 'id', 'id'], [0, 0, 0, 0, 0], false, [], 'nextButton', 'prevButton', 'https://calendar.google.com/calendar/embed?src=spartandocs.org_mqhtkienr3dqv20drmtfhd2rgs%40group.calendar.google.com&ctz=America/New_York', 0);