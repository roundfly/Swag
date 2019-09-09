const allowedLangs = [`objc`, `java`, `ts`, `js`, `swift`];
const URL = require(`url`).URL;

module.exports = {
    isValidURL: function(string) {
        try {
            new URL(string);
            return true;
          } catch (err) {
            return false;
          }        
    },
    isAllowedLanguage: function(lang) {
        return allowedLangs.includes(lang)    
    },
    isEmptyObject: function(obj) {
        return Object.entries(obj).length === 0 && obj.constructor === Object
    }
}