const parseQuery = queryString => {
    const query = {};
    const pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
    for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i].split('=');
        query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    }
    return query;
};

const parseRowBody = rawStr => {
    if (rawStr && typeof rawStr === 'string') {
        const parts = rawStr.split('&');
        return parts.reduce((acc, prt) => {
            const nameVal = prt.split('=');
            let val = nameVal[1];
            if (val !== undefined || val !== null) {
                val = decodeURIComponent(val);
            }
            acc[decodeURIComponent(nameVal[0])] = val;
            return acc;
        }, {});
    }
    return {};
};

const getRoleOption = (role, expectedRole) => {
    const selected = role === expectedRole ? 'selected' : '';
    return `<option value="${role}" ${selected}>${role}</option>`
};

module.exports = {
    parseRowBody,
    parseQuery,
    getRoleOption
}
