module.exports = {

    errorHandler: function (err) { if (err) console.error(err) },

    sanitize: function (object) {
        return Object.keys(object)
            .filter(key => [`definitions`].includes(key))
            .reduce((obj, key) => {
                obj[key] = object[key];
                return obj.definitions;
            }, {});
    },
    
    currentDirectory: function () {
        return process.cwd();
    }
}