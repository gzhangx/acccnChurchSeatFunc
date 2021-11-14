const gs = require('./getSheet');
const credentials = require('./credentials.json');
const db = {
    context: null,
    sheet: null,
    allUsers: [],
    blk: null,
    pureSitConfig: null,
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

async function saveDisplaySheet(util) {
    let colors = [[0, 0, 255], [0, 255, 0], [255, 0, 0], [0, 255, 255], [255, 0, 255], [255, 200, 200]];
    let fontColor = ['#ffff00', '#ff00ff', '#00ffff', '#000000', '#000000', '#000000'];
    let rgbFontColor = [[255, 255, 0], [255, 0, 255], [0, 255, 255], [0, 0, 0], [0, 0, 0], [0, 0, 0]]
    while (colors.length < db.allUsers.length) {
        colors.map(c => c.map(c => parseInt(c / 2))).forEach(c => {
            if (c[0] + c[1] + c[2] < 255 + 128) {
                fontColor.push('#ffffff');
                rgbFontColor.push([255, 255, 255])
            } else {
                fontColor.push('#000000')
                rgbFontColor.push([0, 0, 0])
            }
            return colors.push(c);
        });
    }

    const rgb255toClr = rgb => ['red', 'green', 'blue'].reduce((acc, name, i) => {
        acc[name] = rgb[i] / 255.0;
        return acc;
    }, {});
    const rgbColors = colors.map(rgb255toClr);
    rgbFontColor = rgbFontColor.map(rgb255toClr)
    colors = colors.map(c => `#${c.map(c => c.toString(16).padStart(2, '0')).join('')}`);



    const blockSpacing = 2;
    const fMax = (acc, cr) => acc < cr ? cr : acc;

    const pureSitConfig = db.pureSitConfig;
    const blockColMaxes = pureSitConfig.map(r => r.cols);
    const numCols = blockColMaxes.reduce((acc, r) => acc + r + blockSpacing, 0);
    //const numRows = blockConfig.map(r => r.length).reduce(fMax, 0);
    const numRows = pureSitConfig.map(r => r.rows).reduce(fMax, 0);

    const STARTCol = 4;
    const STARTRow = 3;
    const namesSpacking = 3;

    const namesStartRow = STARTRow + numRows + namesSpacking;
    const CELLSIZE = 20;

    const blockStarts = blockColMaxes.reduce((acc, b) => {
        const curStart = acc.cur + blockSpacing + acc.prev;
        acc.prev = b;
        acc.res.push(curStart);
        acc.cur = curStart;
        return acc;
    }, {
        res: [],
        prev: 0,
        cur: STARTCol - blockSpacing,
    }).res;


    const { blkLetterToId, blkMap } = util;    
    const data = [];    
    for (let i = 0; i < STARTRow + numRows; i++) {
        data[i] = [];
        for (let j = 0; j < STARTCol + numCols; j++) {
            data[i][j] = null;
        }        
    }

    //top col cord
    pureSitConfig.forEach((bc, i) => {
        data[STARTRow - 2][bc.letterCol + blockStarts[i] - 1] = {
            user: {
                id: blkMap[i]
            }
        }
    });
    for (let i = 0; i < numRows; i++) {
        data[i + STARTRow - 1][0] = {
            user: {
                id: (i+1).toString()
            }
        }
    }


    db.allUsers.forEach(user=> {
        user.cells.forEach(c => {
            const uiCol = blockStarts[c.accessPos.b] + c.col;
            const uiRow = STARTRow + c.row;
            try {
                data[uiRow - 1][uiCol - 1] = u;
            } catch (err) {
                data[uiRow - 1][uiCol - 1] = u;
                throw err;
            }
        })

    });
    
    const rowData = data.map(r => {
        return {
            values: r.map((cval) => {
                const user = cval && cval.user;
                const stringValue = (cval ? (user?.id || '-') : '').toString();
                const horizontalAlignment = 'CENTER';
                const cell = {
                    userEnteredValue: { stringValue }
                };
                if (user && user.id) {
                    cell.userEnteredFormat = {
                        backgroundColor: rgbColors[user.pos],
                        horizontalAlignment,
                        textFormat: {
                            foregroundColor: rgbFontColor[user.pos],
                            //fontFamily: string,
                            //"fontSize": integer,
                            bold: true,
                            //"italic": boolean,
                            //"strikethrough": boolean,
                            //"underline": boolean,                                            
                        },
                        borders: {
                            bottom: {
                                style: 'SOLID',
                                width: 1,
                                color: {
                                    blue: 0,
                                    green: 1,
                                    red: 0
                                }
                            }
                        }
                    };
                } else {
                    cell.userEnteredFormat = {
                        horizontalAlignment,
                        backgroundColor: cval ? {
                            blue: 0,
                            green: 1,
                            red: 1
                        } : {
                            blue: 1,
                            green: 1,
                            red: 1
                        },
                    }
                }
                return cell;
            })
        };
    });
}

module.exports = {
    db,
    saveData,
    loadData,
    saveDisplaySheet,
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