const https = require('https');
const fs = require('fs');

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
            .split('decl String:').join('char ')
            .split('new const String:').join('static const char ')
            .split('new Handle:').join('Handle ')
            .split('new bool:').join('bool ')
            .split('bool:').join('bool ')
            .split('new Float:').join('float ')
            .split('Handle:').join('Handle ')
            .split('public Action:').join('public Action ')
            .replace(/new (.*?):/g, "$1 ")
            .split('new ').join('int ')
            .split('Plugin:myinfo').join('Plugin myinfo')
            .replace(/const String:(.*?)\[]/g, "char[] $1")
        ;

        if (code.includes('#include <sourcemod>')) {
            let publicVoids = [
                'OnAllPluginsLoaded',
                'OnAutoConfigsBuffered',
                'OnClientFloodCheck',
                'OnClientFloodResult',
                'OnConfigsExecuted',
                'OnGameFrame',
                'OnLibraryAdded',
                'OnLibraryRemoved',
                'OnMapEnd',
                'OnMapStart',
                'OnPluginEnd',
                'OnPluginPauseChange',
                'OnPluginStart',
                'OnServerCfg',
            ];

            publicVoids.map(v => code = code.split('public ' + v).join('public void ' + v));
        }

        // Tell it to use the new style declarations
        code = "#pragma newdecls required\n" + code;

        fs.writeFile(process.cwd() + '/output/new.sp', code, function(err) {
            if (err) {
                return console.log(err);
            }

            console.log('The file was saved!');
        });
    }
};
