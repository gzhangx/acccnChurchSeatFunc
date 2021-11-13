const util = require('../HttpTriggerSeat/util');

function setup(blks, user) {    
    const allUsers = [];
    const res = util.tryAddUser({
        user,
        blks,
        allUsers,
    });
    return {
        blks,
        allUsers,
        res,
    }
}

function test() {
    const inited = util.initParms();
    const blks = inited.generateBlockSits();
    const u1 = {
        count: 1,
        name: 'Test'
    };
    const { allUsers } = setup(blks, u1);
    if (!u1.cell || u1.cell.col != 8) {
        console.log('Bad u1');
    }
    const u2 = {
        count: 1,
        name: 'Test2'
    };
    setup(blks, u2);
    if (!u2.cell || u2.cell.col != 11) {
        console.log('Bad u3');
    }
    const u3 = {
        count: 1,
        name: 'Test3'
    };
    setup(blks,u3);
    if (!u3.cell || u3.cell.col != 5) {
        console.log('Bad u3');
    }
}

function shoudEqual(a, b, msg) {
    if (a !== b) console.log(`${msg} expected ${b} but got  ${a}`);
}
function testMultiCount() {
    const inited = util.initParms();
    const blks = inited.generateBlockSits();
    const u1 = {
        count: 2,
        name: 'Test'
    };
    const { allUsers, res: res1 } = setup(blks, u1);
    if (!u1.cell || u1.cell.col != 9) {
        console.log('Bad u1');
    }
    shoudEqual(u1.cell.dspCol, 5, 'wrong col');
    if (u1.cells[1].col !== 10) {
        console.log('Bad u1');
    }
    if (!res1 || res1.length !== 2 || res1[0].col !== 9 || res1[1].col !== 10) {
        console.log(`res1 not found`);
    }
    const u2 = {
        count: 2,
        name: 'Test2'
    };
    const res2 = setup(blks, u2).res;
    if (!u2.cell || u2.cell.col != 5) {
        console.log('Bad u2');
    }
    if (u2.cells[1].col !== 6) {
        console.log('Bad u2');
    }
    shoudEqual(u2.cell.dspCol, 1, 'wrong col');
    const u3 = {
        count: 2,
        name: 'Test3'
    };
    const res3 = setup(blks, u3).res;
    if (!res3 || res3.length !== 2 || res3[0].row !== 0 || res3[0].col !== 10) {
        console.log('should not have res3');
    }
    
}


test();
testMultiCount();