module.exports = async function (context, req) {
    const twoHoursInMilliSec = 7200000;
    const expiresTime = new Date(Date.now() + twoHoursInMilliSec);

    context.res = {
        status: 200,
        headers: {
            'Content-Type': 'text/html',
            'Set-Cookie': `AcccnCheckinAuth=7706679593; Path=/api; Expires=${expiresTime}`,
            'Cache-Control': 'no-cache. no-store',
        },
        body: '<h1>cookie set expires in 2 hours<h1>'
    };
}