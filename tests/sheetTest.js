const util = require('../HttpTriggerSeat/util');
const store = require('../HttpTriggerSeat/store');
const blkConfigs = require('../HttpTriggerSeat/configs');

async function test() {
    const nextSunday = util.getNextSundays()[0];
    const context = {
        log: s => console.log(s),
    };
    await store.initSheet(context, nextSunday);
    await store.loadData();
    const { blks } = store.getBlkAndRole('');

    const name = 'test11122225';
    const email = 'tst115@testemail.com';
    const user = {
        name, email, count:1, role:'',
    };
        
    const res = util.tryAddUser({
        user,
        blks,
        allUsers: store.db.allUsers,
    });
    await store.saveData();
    await store.saveDisplaySheet(util);
}


test();