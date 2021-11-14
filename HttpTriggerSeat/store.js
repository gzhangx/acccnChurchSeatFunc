const gs = require('./getSheet');
const credentials = require('./credentials.json');
const db = {
    context: null,
    sheet: null,
    allUsers: [],
    blk: null,
    sheetInfo: {
        sheetInfo: null,
        freeInd: 0,
        lastInfoRefreshTime: 0,
        dbSheetId: 0,
        dbSheetNamePrefix:'WEBSTORE_'
    }
};

const createSheet = async (name) => {
    const sheet = db.sheet;
    const sheetInfos = db.sheetInfo.sheetInfo;
    let freeInd = db.sheetInfo.freeInd;
    for (let i = 0; i < sheetInfos.length; i++) {
        const sheet = sheetInfos[i];
        if (sheet.title === name) return sheet.sheetId;
    }

    while (true) {
        if (sheetInfos.find(s => s.sheetId === freeInd)) {
            freeInd++;
            continue;
        }
        break;
    }
    db.context.log(`freeInd for ${name} ${freeInd}`);
    try {
        await sheet.createSheet(freeInd, name);
    } catch (exc) {
        db.context.log(`Warning failed to create sheet ${exc.message}`);
    }

    db.sheetInfo.freeInd = freeInd;    
};

async function saveData() {
    const allUsers = db.allUsers;
    if (!allUsers?.length) return;
    await db.sheet.updateValues(`'${db.sheetInfo.fullSaveSheetName}'!A1:C${allUsers.length}`,
        allUsers.map(n => {
            const cell = n.cell;
            return [n.email, `${cell.blkName}${cell.dspRow}-${cell.side}${cell.dspCol}`
                , JSON.stringify(n)
            ];
        })
    );
}

async function loadData() {
    if (db.allUsers.length === 0) {
        const vals = await db.sheet.readValues(`'${db.sheetInfo.fullSaveSheetName}'!A:C`);
        console.log(vals);
        db.allUsers = vals.map(v => JSON.parse(v[2]));
    }
}

module.exports = {
    db,
    saveData,
    loadData,
    initSheet: async (context, dateStr) => {
        db.context = context;
        if (!db.sheet) {
            const client = await gs.getClient('gzprem');
            db.sheet = client.getSheetOps(credentials.sheetId);
        }
        const now = new Date();
        const curMs = now.getTime();
        if (!db.sheetInfo.sheetInfo || curMs - db.sheetInfo.lastInfoRefreshTime > 10 * 1000) {
            context.log(`Refreshing sheetInfo ${curMs}`);
            db.sheetInfo.sheetInfo = await db.sheet.sheetInfo();
            db.sheetInfo.lastInfoRefreshTime = curMs;
        }

        db.sheetInfo.fullSaveSheetName = db.sheetInfo.dbSheetNamePrefix + dateStr;
        await createSheet(db.sheetInfo.fullSaveSheetName);
    },
}