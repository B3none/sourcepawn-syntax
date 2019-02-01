const https = require('https');

module.exports = {
    parse: (code, isUrl) => {
        if (isUrl) {
            const request = https.get(code, response => {
                console.log(response);
            });

            console.log(request);
        }

        code = code
            .split('new String:').join('char ')
            .split('new const String:').join('const char ')
            .split('new Handle:').join('Handle ')
            .split('new bool:').join('bool ')
            .split('new Float:').join('float ')
            .split('bool:') // Check for bools in brackets
            .split('bool:').join('stock bool ')
            .split('public Action:').join('public Action ')
        ;

        console.log(code);
    }
};
