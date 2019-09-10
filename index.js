#!/usr/bin/env node

const process = require(`process`);
const https = require(`https`);
const { exec } = require(`child_process`);
const fs = require(`fs`);
const arguments = process.argv.slice(2)
const cli = require(`./lib/cli`);
const validator = require(`./lib/validator`);
const utils = require(`./lib/utils`);
const errorHandler = utils.errorHandler;

const main = () => {
    const obj = cli(arguments);
    if (validator.isEmptyObject(obj)) {
        return;
    }
    const { url, lang } = obj;
    https.get(url, (res) => {
        let data = ``;
        res.on(`data`, (chunk) => {
            data += chunk;
        });
        res.on(`end`, () => {
            const object = JSON.parse(data);
            const filtered = JSON.stringify(utils.sanitize(object));
            fs.writeFileSync(`model.json`, filtered, errorHandler)
            const command = `quicktype model.json --lang ${lang} --src ${utils.currentDirectory()} -o SwaggerModel.${lang}`;
            exec(command, errorHandler);
        });
    }).on(`error`, errorHandler);    
}
main();