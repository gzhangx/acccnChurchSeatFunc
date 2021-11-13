const util = require('./util');
const store = require('./store');
module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    const getPrm = name => req.query[name] || (req.body && req.body[name]);
    const name = getPrm('name');
    const email = (getPrm('email') || '').toLowerCase().trim();
    const count = parseInt(getPrm('count') || 1);
    const role = getPrm('role') || 'user';
    const nextSunday = util.getNextSundays()[0];
    
    const inited = util.initParms();
    await store.initSheet(context, nextSunday);
    const sheetInfo = store.db.sheetInfo.sheetInfo;
    const blks = store.db.blks || inited.generateBlockSits();
    store.db.blks = blks;    

    let responseMessage = `Cant find a seat sorry ${name}`;

    const showCellStr = cell => `Dear ${name}, your seat is ${cell.blkRow[0]}${cell.row + 1}, seat ${cell.dspCol} from ${cell.side === 'L' ? 'Left' : 'Right'} `
    const found = store.db.allUsers.find(u => u.email === email);
    if (name && email && !found) {
        const user = {
            name, email, count
        };        

        const res = util.tryAddUser({
            user,
            blks,
            allUsers: store.db.allUsers,
        });

    
        if (res.length === 1) {
            responseMessage = showCellStr(res[0]);
        }
    } else {
        responseMessage = 'No email nor email';
        if (found) {
            responseMessage = `Found existing user, ${showCellStr(found.cell)}`;
        }
    }


    context.res = {
        // status: 200, /* Defaults to 200 */
        headers: {
            'content-type': 'application/json; charset=utf-8'
        },
        body: { responseMessage, email, nextSunday, sheetInfo,},
    };
}