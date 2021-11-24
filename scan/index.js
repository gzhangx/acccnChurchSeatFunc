const request = require('superagent');
module.exports = async function (context, req) {
    const CryptoJS = require("crypto-js");

    function parseQuery(queryString) {
        var query = {};
        var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
        for (var i = 0; i < pairs.length; i++) {
            var pair = pairs[i].split('=');
            query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
        }
        return query;
    }


    context.log('JavaScript HTTP trigger function processed a request.');

    const param = req.query.param;

    const res = {
        headers: { "Content-Type": "text/html" },
        body: ''
    };

    let name, email;
    if (param) {
        const queryString = CryptoJS.enc.Base64.parse(param);
        var rawQueryString = queryString.toString(CryptoJS.enc.Utf8)
        const queryObject = parseQuery(rawQueryString);
        name = queryObject['name'];
        email = queryObject['email'];
    }

    const parseRowBody = rawStr => {
        if (rawStr && typeof rawStr === 'string') {
            const parts = rawStr.split('&');
            return parts.reduce((acc, prt) => {
                const nameVal = prt.split('=');
                let val = nameVal[1];
                if (val !== undefined || val !== null) val = decodeURIComponent(val);
                acc[decodeURIComponent(nameVal[0])] = val;
                return acc;
            }, {});
        }
        return {};
    }
    const postData = parseRowBody(req.body)
    if (postData.postMark) {
        const seatRes = await request.post('https://acccnseatengine.azurewebsites.net/api/HttpTriggerSeat').send(postData).then(r => r.body);
        res.body = `<h1>${seatRes.responseMessage}</h1>`;
        context.res = res;
        return;
    }
    if (name && email) {
        res.body = '<html>' +
            '<header>' +
            '<meta name="viewport" content="width=device-width,initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no"/>' +
            '<style>' +
            'body {text-align:center}' +
            '.form-line {display: flex; align-items: center}' +
            '</style>' +
            '</header>' +
            '<body>' +
            '<div style="width: 100%;height:100%;display: flex;flex-direction:column;align-items: center;justify-content: center">' +
            '<h1>ACCCN Check In</h1>' +
            '<div>' +
            '<form method="POST" action="https://acccnseatengine.azurewebsites.net/api/scan">' +
            //'<form method="POST" action="http://localhost:7071/api/scan">' +
            '<input type="hidden" name="postMark" value="true">' +
            '<div style="padding: 5px;display: flex;flex-direction:column;align-items: stretch;justify-content: center">' +
            '<div class="form-line">' +
            '<label style="flex-basis: 100px;text-align:right" for="name">Name: </label>' +
            `<input id="name" style="min-width: 200px;margin:5px;padding: 5px;border-radius:5px;border: 1px solid #ccc" placeholder="name" type="text" name="name" value="${name}" />` +
            '</div>' +
            '<div class="form-line">' +
            '<label style="flex-basis: 100px;text-align:right" for="role">Role: </label>' +
            '<select id="role" name="role" style="min-width: 200px;margin:5px;padding: 5px;border-radius:5px;border: 1px solid #ccc">' +
            '<option value="会众">会众</option>' +
            '<option value="主席">主席</option>' +
            '<option value="司琴">司琴</option>' +
            '<option value="带位">带位</option>' +
            '<option value="牧师">牧师</option>' +
            '<option value="投影">投影</option>' +
            '<option value="音效">音效</option>' +
            '<option value="诗班">诗班</option>' +
            '</select>' +
            '</div>' +
            '<div class="form-line">' +
            '<label style="flex-basis: 100px;text-align:right" for="party-size">Party Size: </label>' +
            '<select id="party-size" name="count" style="min-width: 200px;margin:5px;padding: 5px;border-radius:5px;border: 1px solid #ccc">' +
            '<option value="1">1</option>' +
            '<option value="2">2</option>' +
            '<option value="3">3</option>' +
            '<option value="4">4</option>' +
            '<option value="5">5</option>' +
            '<option value="6">6</option>' +
            '<option value="7">7</option>' +
            '<option value="8">8</option>' +
            '<option value="9">9</option>' +
            '<option value="10">10</option>' +
            '</select>' +
            '</div>' +
            '<div class="form-line">' +
            '<label style="flex-basis: 100px;text-align:right" for="email">Email: </label>' +
            `<input id="email" style="min-width: 200px;margin:5px;padding: 5px;border-radius:5px;border: 1px solid #ccc" placeholder="email" type="text" name="email" value="${email}" />` +
            '</div>' +
            '<div style="padding: 20px 5px">' +
            '<button style="margin:5px;padding: 5px 10px;" type="submit">Submit</button>' +
            '<button style="margin:5px;padding: 5px 10px;" type="reset">Reset</button>' +
            '</div>' +
            '</form>' +
            '</div>' +
            '</div>' +
            '</body>' +
            '</html>';
    } else {
        res.body = 'Bad request'
    }

    context.res = res;
}