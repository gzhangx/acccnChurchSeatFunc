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
    const rolesBlks = blkConfigs.assignRoles();
    const blks = store.db.blks || rolesBlks.blks;
    store.db.blks = blks;
    store.db.pureSitConfig = rolesBlks.pureSitConfig;

    const name = 'test111';
    const user = {
        name, email, count, role,
    };
        
    const res = util.tryAddUser({
        user,
        blks,
        allUsers: store.db.allUsers,
    });
    console.log(res);
    await store.saveDisplaySheet(util);
}


test();