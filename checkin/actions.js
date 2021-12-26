const store = require('./store');
const uuid = require('uuid');

async function saveAll() {
    const users = store.db.allUserQRs.map(u => {
        return [u.name, u.email, u.id];
    });
    await store.db.sheet.updateValues(`'AllUsers'!A1:C${users.length}`, users);
}
async function actionLoadUsers(context) {    
    const users = await store.db.sheet.readValues(`'AllUsers'!A:C`);
    let needUpdate = 0;
    users.forEach(u => {
        if (!u[2]) {
            u[2] = uuid.v1();
            needUpdate++;
        }
    });
    
    store.db.allUserQRs = users.map(u => {
        return {
            name: u[0],
            email: u[1],
            id: u[2],
        }
    });

    if (needUpdate) {
        await saveAll();        
    }

    context.res = {
        headers: {
            'content-type': 'application/json; charset=utf-8'
        },
        body: store.db.allUserQRs,
    };
}

async function actionQueryQR(context, getPrm) {
    const qrCode = getPrm('qrCode');
    if (!qrCode) {
        return context.res = {
            headers: {
                'content-type': 'application/json; charset=utf-8'
            },
            body: {
                error:`Must provide qrCode`
            },
        };
    }

    const body = store.db.allUserQRs.find(qr => qr.id === qrCode);
    context.res = {
        headers: {
            'content-type': 'application/json; charset=utf-8'
        },
        body,
    };
}

async function actionAddUser(context, getPrm) {    
    const returnData = body => {
        context.res = {
            headers: {
                'content-type': 'application/json; charset=utf-8'
            },
            body,
        };
    }
    const returnErr = error => {
        returnData({
            error,
        })
    }
    
    const name = getPrm('name');
    if (!name) return returnErr('Must specify name');

    let email = getPrm('email');
    if (!email) return returnErr('Must specify email');

    email = email.toLowerCase();

    const existing = store.db.allUserQRs.find(q => q.email === email);
    if (existing) {
        return returnData(existing);
    }

    const body = {
        name,
        email,
        id: uuid.v1(),
    };
    store.db.allUserQRs = store.db.allUserQRs.concat(body);

    await saveAll();
    
    return returnData(body);
}

async function actionReset(context) {
    store.db.allUsers = [];
    context.res = {
        headers: {
            'content-type': 'application/json; charset=utf-8'
        },
        body: 'reseted',
    };
}
module.exports = {
    actionLoadUsers,
    actionReset,
    actionQueryQR,
    actionAddUser,
}