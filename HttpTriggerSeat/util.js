const fs = require('fs');
const gs = require('./getSheet');

const blkMap = Object.freeze(['A', 'B', 'C', 'D']);
const blkLetterToId = blkMap.reduce((acc, ltr, id) => {
    acc[ltr] = id;
    return acc;
}, {});

// returns array of 4 blocks, [ {min,max, minRow, maxRow, rows, cols, rowColMin:[], rowColMax:[], sits:[]}, ..  ]
// sits: array of rows, each: [null, null, ... { sitTag, col, row}]
function parseSits(pack = 2) {
    const lines = fs.readFileSync('./sitConfig.txt').toString().split('\n');
    const starts = lines[0].split('\t').reduce((acc, l, i) => {
        if (l === 'R') acc.push(i);
        return acc;
    }, []);
    const getBlk = p => {
        if (p > starts[2]) {
            if (p > starts[3]) return 3;
            return 2;
        }
        if (p < starts[1]) return 0;
        return 1;
    };
    const blkInfo = lines.slice(1).reduce((acc, l, curRow) => {
        return l.split('\t').reduce((acc, v, i) => {
            const blki = getBlk(i);
            if (v === 'X' || v === 'N') {
                let blk = acc[blki];
                if (!blk) {
                    blk = { min: i, max: i, minRow: curRow, maxRow: curRow, sits: [], rowColMin: {}, rowColMax: {} };
                    acc[blki] = blk;
                }
                if (blk.min > i) blk.min = i;
                if (blk.max < i) blk.max = i;
                if (!blk.rowColMin[curRow] && blk.rowColMin[curRow] !== 0) blk.rowColMin[curRow] = i;
                if (i <= (blk.rowColMin[curRow] || 0)) blk.rowColMin[curRow] = i;
                if (i >= (blk.rowColMax[curRow] || 0)) blk.rowColMax[curRow] = i;
                blk.maxRow = curRow;
                blk.sits.push({
                    col: i,
                    row: curRow,
                    sitTag: v,
                })
            }
            return acc;
        }, acc)
    }, []).map(b => {
        return {
            letterCol: b.sits[0].col === b.min ? 0 : b.max - b.min,
            ...b,
            cols: b.max - b.min + 1,
            rows: b.maxRow - b.minRow + 1,
            sits: b.sits.map(s => {
                const rowColMin = b.rowColMin[s.row];
                const rowColMax = b.rowColMax[s.row];
                const rowCols = rowColMax - rowColMin;
                const colPos = s.col - rowColMin;
                return ({
                    sitTag: s.sitTag,
                    side: colPos < rowCols / 2 ? 'L' : 'R',
                    col: s.col - b.min,
                    row: s.row - b.minRow,
                });
            })
        }
    });
    //console.log(starts);
    //console.log(blkInfo.map(b => ({
    //  cols: b.cols,
    //  rows: b.rows,
    //})));
    return blkInfo.map((b, bi) => {
        const rows = [];
        for (let r = 0; r < b.rows; r++) {
            const rr = [];
            rows[r] = rr;
            for (let c = 0; c < b.cols; c++) {
                rr[c] = null;
            }
        }

        b.sits.forEach(s => {
            rows[s.row][s.col] = {
                ...s,
            };
        })
        //console.log(rows.map(r => r.join('')).join('\n'));
        return {
            ...b,
            goodRowsToUse: rows.map((r, i) => {
                return !(i % pack) //|| i === rows.length - 1
            }),
            sits: rows,
        };
    });
}

function initParms(pack=2) {
    const blockSpacing = 2;
    const fMax = (acc, cr) => acc < cr ? cr : acc;
    const pureSitConfig = parseSits(pack);
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


    function getDisplayData(blockSits) {
        const data = [];
        const debugCOLLimit = 30;
        for (let i = 0; i < STARTRow + numRows; i++) {
            data[i] = [];
            for (let j = 0; j < STARTCol + numCols; j++) {
                data[i][j] = null;
            }

            //debug
            //data[i] = [];
            for (let j = 0; j < debugCOLLimit; j++)
                data[i][j] = null;
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
                    id: getDisplayRow(i).toString()
                }
            }
        }


        blockSits.forEach(blk => {
            blk.forEach(r => {
                r.forEach(c => {
                    if (!c) return;
                    //data[c.uiPos.row - STARTRow][c.uiPos.col - STARTCol] = c.user ? c.user.id : 'e';
                    //if (c.uiPos.col < debugCOLLimit) //debug
                    try {
                        data[c.uiPos.row - 1][c.uiPos.col - 1] = c;
                    } catch (err) {
                        data[c.uiPos.row - 1][c.uiPos.col - 1] = c;
                        throw err;
                    }
                })
            })
        });
        return data;
    }


    ///arry of 4 blks, [a,b,c,d]
    ///each block: array of rows[r,r,r,r....]
    ///each row: array of seats: {sitTag:X, col,row, blkRow:'A0', blkRowId: 'A0-5', user:{}, uiPos{col,row}}
    function generateBlockSits(preSiteItemsByBlkRowId) {
        const blockSits = pureSitConfig.map((cblk, bi) => {
            return cblk.sits.map(s => {
                return s.map(r => {
                    if (!r) return null;

                    const blk = {
                        ...r,
                        blkRow: `${blkMap[bi]}${r.row}`,
                        blkRowId: `${blkMap[bi]}${r.row}-${r.col}`,
                        dspCol: r.side === 'L' ? r.col - cblk.rowColMin[r.row] + cblk.min + 1 : cblk.rowColMax[r.row] - r.col - cblk.min + 1,
                        user: null,
                        uiPos: {
                            col: blockStarts[bi] + r.col,
                            row: STARTRow + r.row,                            
                        }
                    };
                    if (preSiteItemsByBlkRowId) {
                        const users = preSiteItemsByBlkRowId[blk.blkRowId];
                        if (users) {
                            users.forEach(user => {
                                blk.user = user;
                                user.posInfo.rowInfo = blk;
                                //user.posInfo.side = `${blk.side}-${user.posInfo.side}`;
                                user.posInfo.side = blk.side;
                            });
                        }
                    }
                    return blk;
                });
            });
        });
        return blockSits;
    }



    return {
        generateBlockSits,
        blkMap,
        blkLetterToId,
        STARTCol,
        STARTRow,        
    }
}

function getCellInfo(cell) {
    return {
        blkName: cell.blkRow[0],
        col: cell.col,
        row: cell.row,
        dspRow: cell.row + 1,
        dspCol: cell.dspCol,    
        side: cell.side,
        accessPos: cell.accessPos,
    }
}
//user has name, email, count
function tryAddUser({ blks, user, allUsers, fixedToBlk, spacing=2 }) {    
    let found = null;
    let badBlkCount = 0;
    for (let rowi = 0; badBlkCount < blks.length; rowi++) {            
        let possible = [];
        let spots = [];
        let possibleCount = 0;
        badBlkCount = 0
        for (let blki = 0; blki < blks.length; blki++) {
            const curBlk = blks[blki];
            spots = [];
            const curRow = curBlk[rowi];
            if (!curRow) {
                badBlkCount++;                
                continue;
            }
            let leftFromPossibleCandidate = spacing;
            let leftTotal = spacing;
            let right = 0;
            for (let ci = 0; ci < curRow.length; ci++) {
                const cell = curRow[ci];                
                if (!cell) continue;
                cell.accessPos = { b: blki, r: rowi, c: ci };
                if (!cell.user) {
                    if (possibleCount < user.count) {
                        if (leftFromPossibleCandidate >= spacing) {
                            possible.push(cell);
                            possibleCount++;
                            if (possibleCount >= user.count) leftFromPossibleCandidate = 0;
                        } else {
                            leftFromPossibleCandidate++;
                        }
                        leftTotal++;
                    } else {
                        right++;
                        leftFromPossibleCandidate++;
                        leftTotal++;
                        if (right >= spacing && possible) {
                            spots.push(possible);
                            possibleCount = 0;
                            left = 0;
                            possible = [];
                        }
                    }
                } else {                    
                    possibleCount = 0;
                    possible = [];
                    right = 0;
                    leftFromPossibleCandidate = 0;
                    leftTotal = 0;
                }
                if (spots.length > 1) break;
            }

            if (possibleCount >= user.count) {
                spots.push(possible);                
            }
            if (spots.length === 1) {
                found = spots[0];
            } else if (spots.length > 0) {
                found = spots[1];
            }
            if (found) {
                allUsers.push(user);
                user.cells = [];
                user.cell = getCellInfo(found[0]);
                found.forEach(f => {
                    f.user = user;                    
                    user.cells.push(getCellInfo(f));
                });
                return found;
            }
        }
        if (rowi < 10) rowi++;
    }
    return found;
}

function getDateStr(date) {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

function getNextSundays() {
    let cur = new Date();
    const oneday = 24 * 60 * 60 * 1000;
    while (cur.getDay() !== 0) {
        cur = new Date(cur.getTime() + oneday);
    }
    const res = [];
    for (let i = 0; i < 10; i++) {
        res[i] = (getDateStr(new Date(cur.getTime() + (oneday * i))));
    }
    return res;
}

module.exports = {
    initParms,
    parseSits,
    tryAddUser,
    getNextSundays,
    blkLetterToId,
}