const log = console.log;
const chalk = require(`chalk`);
const figlet = require(`figlet`);
const validator = require(`./validator`);

function cli(args) {
  const arguments = require('minimist')(args, {
    string: 'lang',
    default: { lang: 'swift' },
  });
  const url = arguments._[0]
  const lang = arguments.lang
  if (!url) {
    manPage();
    return {};
  }
  if (!validator.isValidURL(url)) {
    console.error(`Invalid url: ${chalk.yellow(url)}`);
    return {};
  }
  if (!validator.isAllowedLanguage(lang)) {
    console.error(`Unsupported language: ${chalk.yellow(lang)}`)
    return {};
  }
  return {url: url, lang: lang}
}

const manPage = () => {
  log(``);
  log(chalk.bold.yellowBright(figlet.textSync(`SWAG`, { horizontalLayout: `full` })));
  log(chalk.underline(`Synopsis`));
  log(``);
  log(`swag [--lang LANG] URL`);
  log(``);
  log(`LANG`)
  log(`objc|java|ts|js|swift`);
  log(``);
  log(chalk.underline(`Description`));
  log(``);
  log(`Given a Swagger URL that points to JSON, Swag deserializes the JSON and filters out redundant key:value pairs, this is then passed to quicktype which outputs code in one of its supported languages. If no language is passed as an argument Swag then defaults to Swift.`);
  log(``);
  log(chalk.underline(`Options`));
  log(``);
  log(`--lang     The programming language of the output Swagger models file.`);
  log(``);
}

module.exports = cli;