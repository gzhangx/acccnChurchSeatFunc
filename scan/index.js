const utils = require('./utils');
const request = require('superagent');
module.exports = async function (context, req) {
    const CryptoJS = require("crypto-js");
    const res = {
        headers: { "Content-Type": "text/html" },
        body: ''
    };

    if (req.method.toLowerCase() === 'post') {
        const postData = utils.parseRowBody(req.body);
        const seatRes = await request.post('https://acccncheckin.azurewebsites.net/api/checkin?code=OAJh3Hrav1Y6m3BRaPnzR8D8EEfJUNVazmaa4XU0A%2FFClbMbw6pxZg%3D%3D').send(postData).then(r => r.body);
        res.body = `<h1>${seatRes.responseMessage}</h1>`;
        context.res = res;
        return;
    } else { 
        context.log(req.headers.cookie);
        // check cookie:  AcccnCheckinAuth=7706679593
        if(!req.headers.cookie || req.headers.cookie.indexOf('AcccnCheckinAuth=7706679593') === -1) {
            res.body = `Bad request: unauthorized`;
            context.res = res;
            return;    
        }
    }

    let name, email;
    const param = req.query.param;
    if (param) {
        const queryString = CryptoJS.enc.Base64.parse(param);
        const rawQueryString = queryString.toString(CryptoJS.enc.Utf8)
        const queryObject = utils.parseQuery(rawQueryString);
        name = queryObject['name'];
        email = queryObject['email'];
    }

    if (name && email) {
        const azureEnv = process.env.AZURE_FUNCTIONS_ENVIRONMENT;
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
            (azureEnv === 'Development' ? 
                '<form method="POST" action="http://localhost:7071/api/scan">' :
                '<form method="POST" action="https://acccncheckin.azurewebsites.net/api/scan">') +
            '<div style="padding: 5px;display: flex;flex-direction:column;align-items: stretch;justify-content: center">' +
            '<div class="form-line">' +
            '<label style="flex-basis: 100px;text-align:right" for="name">Name: </label>' +
            `<input id="name" style="min-width: 200px;margin:5px;padding: 5px;border-radius:5px;border: 1px solid #ccc" placeholder="name" type="text" name="name" value="${name}" />` +
            '</div>' +
            '<div class="form-line">' +
            '<label style="flex-basis: 100px;text-align:right" for="role">Role: </label>' +
            '<select id="role" name="role" style="min-width: 200px;margin:5px;padding: 5px;border-radius:5px;border: 1px solid #ccc">' +
            '<option value="会众">会众</option>' +
            '<option value="诗班">诗班</option>' +
            '<option value="赞美队">赞美队</option>' +
            '<option value="新人">新人</option>' +
            '<option value="会友">会友</option>' +
            '<option value="领诗">领诗</option>' +
            '<option value="主席">主席</option>' +
            '<option value="牧师">牧师</option>' +
            '<option value="讲员">讲员</option>' +
            '<option value="报告">报告</option>' +
            '<option value="司琴">司琴</option>' +
            '<option value="影音">影音</option>' +
            '<option value="接待">接待</option>' +
            '<option value="带位">带位</option>' +
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
        res.body = 'Bad request: invalid params'
    }
    context.res = res;
}