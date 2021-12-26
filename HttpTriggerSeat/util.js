const fs = require('fs');
const gs = require('./getSheet');
const REGULAR_USER_ROLE = 'user';
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
            sits: rows,
        };
    });
}

function initParms(pack=2) {
    const pureSitConfig = parseSits(pack);

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
                        blkName: blkMap[bi],
                        blkId: bi,
                        dspCol: r.side === 'L' ? r.col - cblk.rowColMin[r.row] + cblk.min + 1 : cblk.rowColMax[r.row] - r.col - cblk.min + 1,
                        user: null,                        
                    };                    
                    return blk;
                });
            });
        });
        return blockSits;
    }



    return {
        pureSitConfig,
        generateBlockSits,
        blkMap,
        blkLetterToId,      
    }
}

function getCellInfo(cell) {
    return {
        blkName: cell.blkName,
        col: cell.col,
        row: cell.row,
        dspRow: cell.row + 1,
        dspCol: cell.dspCol,    
        side: cell.side,
        accessPos: cell.accessPos,
    }
}
//user has name, email, count
function tryAddUser({ blks, user, allUsers, spacing = 2 }) {
    allUsers.forEach(usr => {
        usr.cells.map(cell => {
            const { b, r, c } = cell.accessPos;
            blks[b][r][c].user = usr;
        });        
    });
    let found = null;
    let badBlkCount = 0;
    const MAXROW = 12;
    for (let rowic = 0; badBlkCount < blks.length; rowic++) {
        const rowi = rowic < MAXROW ? rowic * 2 + 1 : (rowic - MAXROW) * 2;
        let possible = [];
        let spots = [];
        let possibleCount = 0;
        badBlkCount = 0
        for (let blki = 0; blki < blks.length; blki++) {
            const curBlk = blks[blki];
            spots = [];
            const curRow = curBlk[rowi];
            if (!curRow) {
                if (rowi > MAXROW)
                    badBlkCount++;                
                continue;
            }
            let leftFromPossibleCandidate = spacing;
            let right = 0;
            for (let ci = 0; ci < curRow.length; ci++) {
                const cell = curRow[ci];                
                if (!cell) continue;
                if (user.role !== cell.role) {
                    const usrRoleHasReq = user.role && user.role !== REGULAR_USER_ROLE;
                    if (!!cell.role || usrRoleHasReq) continue;
                }
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
                    } else {
                        right++;
                        leftFromPossibleCandidate++;
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
    }
    if (!found) {
        user.cells = [];
        user.unableToSit = true;
        allUsers.push(user);
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
    REGULAR_USER_ROLE,
    initParms,
    parseSits,
    tryAddUser,
    getNextSundays,
    blkMap,
    blkLetterToId,
}