const utils = require('./utils');
const request = require('superagent');
module.exports = async function (context, req) {
    const CryptoJS = require("crypto-js");
    const res = {
        headers: { "Content-Type": "text/html" },
        body: ''
    };

    const roles = ['会众', '诗班', '赞美队', '新人', '会友', '领诗',
        '主席', '牧师', '讲员', '报告', '司琴', '影音', '接待', '带位'];

    if (req.method.toLowerCase() === 'post') {
        const postData = utils.parseRowBody(req.body);
        const seatRes = await request.post('https://acccncheckin.azurewebsites.net/api/checkin?code=OAJh3Hrav1Y6m3BRaPnzR8D8EEfJUNVazmaa4XU0A%2FFClbMbw6pxZg%3D%3D').send(postData).then(r => r.body);
        res.body = `<h1>${seatRes.responseMessage}</h1>`;
        context.res = res;
        return;
    } else { 
        // check cookie:  AcccnCheckinAuth=7706679593
        if(!req.headers.cookie || req.headers.cookie.indexOf('AcccnCheckinAuth=7706679593') === -1) {
            res.body = `<h1>Bad request: unauthorized</h1>`;
            context.res = res;
            //return;    
        }
    }

    let name, email, role;
    let param = req.query.param;
    if (param) {
        param = param.replace(/ /g, '+'); //replace all space with +
        try {
            const rawQueryString = Buffer.from(param, 'base64').toString('utf8');
            const queryObject = utils.parseQuery(rawQueryString);
            name = queryObject['name'];
            email = queryObject['email'];
            role = queryObject['role'] ? queryObject['role'].replace('\n', '') : '';
        } catch (err) {
            res.body = `<h1>Bad request: invalid param!</h1>`;
            context.res = res;
            return;    
        }
    }

    if (name && email) {
        const azureEnv = process.env.AZURE_FUNCTIONS_ENVIRONMENT;
        let resBody = '<html>' +
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
            '<select id="role" name="role" style="min-width: 200px;margin:5px;padding: 5px;border-radius:5px;border: 1px solid #ccc">';

        roles.forEach((thisRole) => {
            resBody = resBody + utils.getRoleOption(thisRole, role);
        });

        resBody = resBody + '</select>' +
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

            res.body = resBody;
    } else {
        res.body = '<h1>Bad request: invalid params</h1>';
    }
    context.res = res;
}