
const util = require('./util');

const roleSits = {
    '主席': 'C0',
    '司琴': 'A0',
    '帶位': 'B11',
    '牧師': 'C0',
    '投影': 'E',
    '音效': 'E',
    '诗班': 'B0-7',
}

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
    const parsedRoles = Object.keys(roleSits).map(role => {
        const pos = roleSits[role];
        const id = util.blkLetterToId[pos[0]]
        const rows = pos.substr(1);
        
        if (id === undefined) {
            return {
                role,
                noSeat: true, //for sound and IT etc
            }
        }
        
        return {
            blkId: id,
            rows: toRowStartEnd(rows),
            role,
            noSeat: false,
        }
    });
    console.log(parsedRoles);
    parsedRoles.forEach(pw => {
        const { blkId, role, rows, noSeat } = pw;
        if (noSeat) return;
        const blk = blks[blkId];
        for (let i = rows.start; i <= rows.end; i++) {
            blk[i].filter(x=>x).forEach(c => {                
                c.role = role;
            });
        }
    });
    return {
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