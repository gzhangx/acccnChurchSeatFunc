const gs = require('./getSheet');
const credentials = require('./credentials.json');
const db = {
    allUsers: [],
    blk: null,
    sheetInfo: {
        sheetInfo: null,
        freeInd: 0,
        lastInfoRefreshTime: 0,
    }
};

module.exports = {
    db,
    initSheet: async (context) => {
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

    },
}