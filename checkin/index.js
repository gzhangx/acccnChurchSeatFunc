const util = require('./util');
const store = require('./store');
const actions = require('./actions');
const { pick } = require('lodash');

function parseRowBody(rawStr) {    
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
module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    const rawBody = parseRowBody(req.rawBody);
    const getPrm = name => req.query[name] || (req.body && req.body[name]) || rawBody[name];
    const actionStr = getPrm('action');
    if (actionStr && actions[actionStr]) {
        await store.initSheet(context);
        return await actions[actionStr](context, getPrm);
    }
    
    const name = getPrm('name');    
    const email = (getPrm('email') || '').toLowerCase().trim();
    const count = parseInt(getPrm('count') || 1);
    let role = getPrm('role') || util.REGULAR_USER_ROLE;
    const nextSunday = util.getNextSundays()[0];
    
    await store.initSheet(context, nextSunday);
    await store.loadData();

    const { blks, roleObj } = store.getBlkAndRole(role);
    const unknownRole = !roleObj.role;
    if (unknownRole) {
        role = util.REGULAR_USER_ROLE
    } else {
        role = roleObj.role;
    }
    
    let responseMessage = `Cant find a seat sorry ${name}`;

    const showCellStr = cell => `Dear ${name}, your seat is ${cell.blkName}${cell.dspRow}, seat ${cell.dspCol} from ${cell.side === 'L' ? 'Left' : 'Right'} `;
    const extratCellData = cell => ({
        name,
        ...pick(cell, ['blkName', 'dspRow', 'dspCol', 'side', 'col', 'row']),
    });
    const found = store.db.allUsers.find(u => u.email === email);
    const getMultiUserMsg = user => {
        const cell = user.cell;
        const all = user.cells.map(c => {
            return `${c.side}${c.dspCol}`;
        }).join(',');
        return `Dear ${name}, your seats are at ${cell.blkName}${cell.dspRow} seats ${all}`;
    }
    let cellInfo = null;
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

    
            if (res && res.length > 0) {
                if (res.length === 1) {
                    responseMessage = showCellStr(user.cell);
                } else {                
                    responseMessage = getMultiUserMsg(user);
                }
                cellInfo = res.map(extratCellData);
                await store.saveData();
                store.db.needBuildDisplay = true;
                new Promise(async () => {
                    if (store.db.needBuildDisplay) {
                        await store.saveDisplaySheet(util);
                        store.db.needBuildDisplay = false;
                    }
                });                
            } else {
                responseMessage = `Unable to sit ${name} role=${role}`;
            }
        }
    } else {
        responseMessage = 'No email nor email';
        if (found) {
            if (found.count === 1) {
                responseMessage = `Found existing user, ${showCellStr(found.cell)}`;
            } else {
                responseMessage = getMultiUserMsg(found);
            }
            cellInfo = found.cells.map(extratCellData);
        }
    }


    context.res = {
        // status: 200, /* Defaults to 200 */
        headers: {
            'content-type': 'application/json; charset=utf-8'
        },
        body: {
            responseMessage, email, nextSunday,
            cellInfo,
        },
    };
}