const util = require('./util');
const store = require('./store');
module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    const getPrm = name => req.query[name] || (req.body && req.body[name]);
    const name = getPrm('name');
    const email = getPrm('email');
    const role = getPrm('role') || 'user';
    const responseMessage = name && email ?`${name} email=${email}`:'Miss name or email';
    
    const inited = util.initParms();
    const blks = store.db.blks || inited.generateBlockSits();
    store.db.blks = blks;

    const user = {
        name, email, count: 1
    };
    util.tryAddUser({
        user,
        blks,
        allUsers: store.db.allUsers,
    })

    context.res = {
        // status: 200, /* Defaults to 200 */
        headers: {
            'content-type': 'application/json; charset=utf-8'
        },
        body: { responseMessage, email, rest: blks},
        email: req.query.email,
        
    };
}