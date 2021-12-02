
const util = require('./util');

const roleSits = [
    {
        names: ['主席', '讲员', '报告', '牧師'],
        rows: ['C0', 'D0'],
    },
    {
        names: ['司琴',],
        rows: ['A0',],
    },
    {
        names: ['诗班', '赞美队'],
        rows: ['B0-7'],
    },
    {
        names: ['投影', '音效'],
        rows: ['E'],
    },
];


function assignRoles() {
    const inited = util.initParms();    
    const blks = inited.generateBlockSits();
    const toRowStartEnd = rows => {
        const dind = rows.indexOf('-');
        if (dind < 0) {
            const start = parseInt(rows);
            return {
                start,
                end: start,
            }
        } else {
            return {
                start: parseInt(rows.substr(0, dind)),
                end: parseInt(rows.substr(dind+1)),
            }
        }
    };
    const parsedRoles = roleSits.reduce((acc, itm) => {
        itm.names.forEach(role => {
            itm.rows.forEach(pos => {
                const id = util.blkLetterToId[pos[0]]
                const rows = pos.substr(1);

                if (id === undefined) {
                    return acc.push({
                        role,
                        noSeat: true, //for sound and IT etc
                    });
                }

                acc.push({
                    blkId: id,
                    rows: toRowStartEnd(rows),
                    role,
                    noSeat: false,
                });
            });
        });        
        return acc;
    },[]);

    parsedRoles.forEach(pw => {
        const { blkId, role, rows, noSeat } = pw;
        if (noSeat) return;
        const blk = blks[blkId];
        for (let i = rows.start; i <= rows.end; i++) {
            blk[i].filter(x => x).forEach(c => {
                if (!c.roles) c.roles = {};
                c.roles[role] = true;
            });
        }
    });
    return {
        pureSitConfig: inited.pureSitConfig.map(r => {
            return {
                letterCol: r.letterCol,
                min: r.min,
                max: r.max,
                maxRow: r.maxRow,
                minRow: r.minRow,
                cols: r.cols,
                rows: r.rows,
                //rowColMax, rowColMin
            }
        }),
        blks,
        getRole: rname => {
            if (roleSits[rname] === 'E') {
                return {
                    role: 'regular',
                    noSeat: true,
                }
            }
            return parsedRoles.find(r => r.role === rname) || { role: null };
        }
    };
}

module.exports = {
    assignRoles,
}