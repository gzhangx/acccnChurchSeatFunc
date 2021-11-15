const util = require('./util');
const store = require('./store');
const blkConfigs = require('./configs');

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    const getPrm = name => req.query[name] || (req.body && req.body[name]);
    const actionStr = getPrm('action');
    if (actionStr === 'reset') {
        store.db.allUsers = [];
        context.res = {            
            headers: {
                'content-type': 'application/json; charset=utf-8'
            },
            body: 'reseted',
        };
        return;
    }

    const name = getPrm('name');    
    const email = (getPrm('email') || '').toLowerCase().trim();
    const count = parseInt(getPrm('count') || 1);
    const role = getPrm('role') || util.REGULAR_USER_ROLE;
    const nextSunday = util.getNextSundays()[0];
    
    await store.initSheet(context, nextSunday);
    await store.loadData();
    const sheetInfo = store.db.sheetInfo.sheetInfo;
    const rolesBlks = blkConfigs.assignRoles();
    const blks = store.db.blks || rolesBlks.blks;
    store.db.blks = blks;
    store.db.pureSitConfig = rolesBlks.pureSitConfig;
    const roleObj = rolesBlks.getRole(role);
    
    let responseMessage = `Cant find a seat sorry ${name}`;

    const showCellStr = cell => `Dear ${name}, your seat is ${cell.blkName}${cell.dspRow}, seat ${cell.dspCol} from ${cell.side === 'L' ? 'Left' : 'Right'} `
    const found = store.db.allUsers.find(u => u.email === email);    
    if (name && email && !found) {
        const user = {
            name, email, count, role,
        };
        if (roleObj.noSeat) {
            store.db.allUsers.push(user);
            responseMessage = `No need to assign a seat`;
        } else {
            const res = util.tryAddUser({
                user,
                blks,
                allUsers: store.db.allUsers,
            });

    
            if (res.length === 1) {
                responseMessage = showCellStr(user.cell);
                await store.saveData();
                await store.saveDisplaySheet(util);
            }
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