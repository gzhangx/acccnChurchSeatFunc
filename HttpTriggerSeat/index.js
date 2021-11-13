const util = require('./util');
const store = require('./store');
module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    const getPrm = name => req.query[name] || (req.body && req.body[name]);
    const name = getPrm('name');
    const email = getPrm('email');
    const count = parseInt(getPrm('count') || 1);
    const role = getPrm('role') || 'user';
    const nextSunday = util.getNextSundays()[0];
    
    const inited = util.initParms();
    await store.initSheet(context);
    const sheetInfo = await store.db.sheet.sheetInfo();
    const blks = store.db.blks || inited.generateBlockSits();
    store.db.blks = blks;

    const user = {
        name, email, count
    };
    const res = util.tryAddUser({
        user,
        blks,
        allUsers: store.db.allUsers,
    });


    let responseMessage = `Cant find a seat sorry ${name}`;
    if (res.length === 1) {
        const res0 = res[0];
        responseMessage = `Dear ${name}, your seat is ${res0.blkRow[0]}${res0.row + 1}, seat ${res0.dspCol} from ${res0.side==='L'?'Left':'Right'} `;
    }


    context.res = {
        // status: 200, /* Defaults to 200 */
        headers: {
            'content-type': 'application/json; charset=utf-8'
        },
        body: { responseMessage, email, nextSunday, sheetInfo},
    };
}