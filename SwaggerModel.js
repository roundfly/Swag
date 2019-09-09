// To parse this data:
//
//   const Convert = require("./file");
//
//   const model = Convert.toModel(json);
//   const packageLock = Convert.toPackageLock(json);
//   const package = Convert.toPackage(json);
//   const swaggerModel = Convert.toSwaggerModel(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
function toModel(json) {
    return cast(JSON.parse(json), r("SwaggerModel"));
}

function modelToJson(value) {
    return JSON.stringify(uncast(value, r("SwaggerModel")), null, 2);
}

function toPackageLock(json) {
    return cast(JSON.parse(json), r("PackageLock"));
}

function packageLockToJson(value) {
    return JSON.stringify(uncast(value, r("PackageLock")), null, 2);
}

function toPackage(json) {
    return cast(JSON.parse(json), r("Package"));
}

function packageToJson(value) {
    return JSON.stringify(uncast(value, r("Package")), null, 2);
}

function toSwaggerModel(json) {
    return cast(JSON.parse(json), r("SwaggerModel"));
}

function swaggerModelToJson(value) {
    return JSON.stringify(uncast(value, r("SwaggerModel")), null, 2);
}

function invalidValue(typ, val) {
    throw Error(`Invalid value ${JSON.stringify(val)} for type ${JSON.stringify(typ)}`);
}

function jsonToJSProps(typ) {
    if (typ.jsonToJS === undefined) {
        var map = {};
        typ.props.forEach((p) => map[p.json] = { key: p.js, typ: p.typ });
        typ.jsonToJS = map;
    }
    return typ.jsonToJS;
}

function jsToJSONProps(typ) {
    if (typ.jsToJSON === undefined) {
        var map = {};
        typ.props.forEach((p) => map[p.js] = { key: p.json, typ: p.typ });
        typ.jsToJSON = map;
    }
    return typ.jsToJSON;
}

function transform(val, typ, getProps) {
    function transformPrimitive(typ, val) {
        if (typeof typ === typeof val) return val;
        return invalidValue(typ, val);
    }

    function transformUnion(typs, val) {
        // val must validate against one typ in typs
        var l = typs.length;
        for (var i = 0; i < l; i++) {
            var typ = typs[i];
            try {
                return transform(val, typ, getProps);
            } catch (_) {}
        }
        return invalidValue(typs, val);
    }

    function transformEnum(cases, val) {
        if (cases.indexOf(val) !== -1) return val;
        return invalidValue(cases, val);
    }

    function transformArray(typ, val) {
        // val must be an array with no invalid elements
        if (!Array.isArray(val)) return invalidValue("array", val);
        return val.map(el => transform(el, typ, getProps));
    }

    function transformDate(typ, val) {
        if (val === null) {
            return null;
        }
        const d = new Date(val);
        if (isNaN(d.valueOf())) {
            return invalidValue("Date", val);
        }
        return d;
    }

    function transformObject(props, additional, val) {
        if (val === null || typeof val !== "object" || Array.isArray(val)) {
            return invalidValue("object", val);
        }
        var result = {};
        Object.getOwnPropertyNames(props).forEach(key => {
            const prop = props[key];
            const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
            result[prop.key] = transform(v, prop.typ, getProps);
        });
        Object.getOwnPropertyNames(val).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(props, key)) {
                result[key] = transform(val[key], additional, getProps);
            }
        });
        return result;
    }

    if (typ === "any") return val;
    if (typ === null) {
        if (val === null) return val;
        return invalidValue(typ, val);
    }
    if (typ === false) return invalidValue(typ, val);
    while (typeof typ === "object" && typ.ref !== undefined) {
        typ = typeMap[typ.ref];
    }
    if (Array.isArray(typ)) return transformEnum(typ, val);
    if (typeof typ === "object") {
        return typ.hasOwnProperty("unionMembers") ? transformUnion(typ.unionMembers, val)
            : typ.hasOwnProperty("arrayItems")    ? transformArray(typ.arrayItems, val)
            : typ.hasOwnProperty("props")         ? transformObject(getProps(typ), typ.additional, val)
            : invalidValue(typ, val);
    }
    // Numbers can be parsed by Date but shouldn't be.
    if (typ === Date && typeof val !== "number") return transformDate(typ, val);
    return transformPrimitive(typ, val);
}

function cast(val, typ) {
    return transform(val, typ, jsonToJSProps);
}

function uncast(val, typ) {
    return transform(val, typ, jsToJSONProps);
}

function a(typ) {
    return { arrayItems: typ };
}

function u(...typs) {
    return { unionMembers: typs };
}

function o(props, additional) {
    return { props, additional };
}

function m(additional) {
    return { props: [], additional };
}

function r(name) {
    return { ref: name };
}

const typeMap = {
    "SwaggerModel": o([
        { json: "LoginModel", js: "LoginModel", typ: r("LoginModel") },
        { json: "PowerBILoginModel", js: "PowerBILoginModel", typ: r("PowerBILoginModel") },
        { json: "RefreshTokenModel", js: "RefreshTokenModel", typ: r("RefreshTokenModel") },
        { json: "BusinessTripBaseModel", js: "BusinessTripBaseModel", typ: r("BusinessTripEModel") },
        { json: "BusinessTripUpdateModel", js: "BusinessTripUpdateModel", typ: r("BusinessTripEModel") },
        { json: "BusinessTripDetailBaseModel", js: "BusinessTripDetailBaseModel", typ: r("BusinessTripDetailBaseModel") },
        { json: "BusinessTripDetailTagModel", js: "BusinessTripDetailTagModel", typ: r("DetailTagModel") },
        { json: "DayOffRequestBaseModel", js: "DayOffRequestBaseModel", typ: r("DayOffRequestBaseModel") },
        { json: "TenantBaseModel", js: "TenantBaseModel", typ: r("TenantBaseModel") },
        { json: "UserBaseModel", js: "UserBaseModel", typ: r("UserBaseModel") },
        { json: "TenantUpdateModel", js: "TenantUpdateModel", typ: r("TenantUpdateModel") },
        { json: "SessionUpdateModel", js: "SessionUpdateModel", typ: r("SessionUpdateModel") },
        { json: "SessionEventModel", js: "SessionEventModel", typ: r("SessionEventModel") },
        { json: "TaskBaseModel", js: "TaskBaseModel", typ: r("TaskBaseModel") },
        { json: "TaskUpdateModel", js: "TaskUpdateModel", typ: r("TaskUpdateModel") },
        { json: "TaskDetailBaseModel", js: "TaskDetailBaseModel", typ: r("TaskDetailBaseModel") },
        { json: "TaskDetailTagModel", js: "TaskDetailTagModel", typ: r("DetailTagModel") },
    ], false),
    "BusinessTripEModel": o([
        { json: "required", js: "required", typ: a("") },
        { json: "type", js: "type", typ: "" },
        { json: "properties", js: "properties", typ: r("BusinessTripBaseModelProperties") },
    ], false),
    "BusinessTripBaseModelProperties": o([
        { json: "Name", js: "Name", typ: r("CityName") },
        { json: "CityName", js: "CityName", typ: r("CityName") },
        { json: "Description", js: "Description", typ: r("CityName") },
        { json: "StartDate", js: "StartDate", typ: r("EndDate") },
        { json: "EndDate", js: "EndDate", typ: r("EndDate") },
        { json: "Picture", js: "Picture", typ: r("CityName") },
        { json: "Status", js: "Status", typ: u(undefined, r("Status")) },
    ], false),
    "CityName": o([
        { json: "type", js: "type", typ: r("Type") },
    ], false),
    "EndDate": o([
        { json: "format", js: "format", typ: r("Format") },
        { json: "type", js: "type", typ: r("Type") },
    ], false),
    "Status": o([
        { json: "format", js: "format", typ: r("Format") },
        { json: "enum", js: "enum", typ: a(0) },
        { json: "type", js: "type", typ: r("Type") },
    ], false),
    "BusinessTripDetailBaseModel": o([
        { json: "required", js: "required", typ: a("") },
        { json: "type", js: "type", typ: "" },
        { json: "properties", js: "properties", typ: r("BusinessTripDetailBaseModelProperties") },
    ], false),
    "BusinessTripDetailBaseModelProperties": o([
        { json: "BusinessTripId", js: "BusinessTripId", typ: r("EndDate") },
        { json: "Note", js: "Note", typ: r("CityName") },
        { json: "CityName", js: "CityName", typ: r("CityName") },
        { json: "Blob", js: "Blob", typ: r("CityName") },
        { json: "ExpenseCategoryId", js: "ExpenseCategoryId", typ: r("Status") },
        { json: "Expense", js: "Expense", typ: r("EndDate") },
        { json: "ExpenseCurrencyId", js: "ExpenseCurrencyId", typ: r("Status") },
        { json: "BusinessTripDetailTags", js: "BusinessTripDetailTags", typ: r("BusinessTripDetailTags") },
        { json: "Latitude", js: "Latitude", typ: r("CityName") },
        { json: "Longitude", js: "Longitude", typ: r("CityName") },
    ], false),
    "BusinessTripDetailTags": o([
        { json: "uniqueItems", js: "uniqueItems", typ: true },
        { json: "type", js: "type", typ: "" },
        { json: "items", js: "items", typ: r("User") },
    ], false),
    "User": o([
        { json: "$ref", js: "$ref", typ: "" },
    ], false),
    "DetailTagModel": o([
        { json: "required", js: "required", typ: a("") },
        { json: "type", js: "type", typ: "" },
        { json: "properties", js: "properties", typ: r("BusinessTripDetailTagModelProperties") },
    ], false),
    "BusinessTripDetailTagModelProperties": o([
        { json: "TagType", js: "TagType", typ: r("CityName") },
        { json: "TagValue", js: "TagValue", typ: r("CityName") },
    ], false),
    "DayOffRequestBaseModel": o([
        { json: "type", js: "type", typ: "" },
        { json: "properties", js: "properties", typ: r("DayOffRequestBaseModelProperties") },
    ], false),
    "DayOffRequestBaseModelProperties": o([
        { json: "RequestType", js: "RequestType", typ: r("Status") },
        { json: "Description", js: "Description", typ: r("CityName") },
        { json: "StartDate", js: "StartDate", typ: r("EndDate") },
        { json: "EndDate", js: "EndDate", typ: r("EndDate") },
    ], false),
    "LoginModel": o([
        { json: "required", js: "required", typ: a("") },
        { json: "type", js: "type", typ: "" },
        { json: "properties", js: "properties", typ: r("LoginModelProperties") },
    ], false),
    "LoginModelProperties": o([
        { json: "Username", js: "Username", typ: r("CityName") },
        { json: "Password", js: "Password", typ: r("EndDate") },
        { json: "DeviceId", js: "DeviceId", typ: r("CityName") },
    ], false),
    "PowerBILoginModel": o([
        { json: "required", js: "required", typ: a("") },
        { json: "type", js: "type", typ: "" },
        { json: "properties", js: "properties", typ: r("PowerBILoginModelProperties") },
    ], false),
    "PowerBILoginModelProperties": o([
        { json: "Username", js: "Username", typ: r("CityName") },
        { json: "Password", js: "Password", typ: r("EndDate") },
    ], false),
    "RefreshTokenModel": o([
        { json: "type", js: "type", typ: "" },
        { json: "properties", js: "properties", typ: r("RefreshTokenModelProperties") },
    ], false),
    "RefreshTokenModelProperties": o([
        { json: "RefreshToken", js: "RefreshToken", typ: r("CityName") },
    ], false),
    "SessionEventModel": o([
        { json: "type", js: "type", typ: "" },
        { json: "properties", js: "properties", typ: r("SessionEventModelProperties") },
    ], false),
    "SessionEventModelProperties": o([
        { json: "EventType", js: "EventType", typ: r("Status") },
        { json: "Time", js: "Time", typ: r("EndDate") },
        { json: "Latitude", js: "Latitude", typ: r("CityName") },
        { json: "Longitude", js: "Longitude", typ: r("CityName") },
    ], false),
    "SessionUpdateModel": o([
        { json: "required", js: "required", typ: a("") },
        { json: "type", js: "type", typ: "" },
        { json: "properties", js: "properties", typ: r("SessionUpdateModelProperties") },
    ], false),
    "SessionUpdateModelProperties": o([
        { json: "Id", js: "Id", typ: r("EndDate") },
        { json: "Status", js: "Status", typ: r("Status") },
        { json: "SessionEvents", js: "SessionEvents", typ: r("BusinessTripDetailTags") },
    ], false),
    "TaskBaseModel": o([
        { json: "required", js: "required", typ: a("") },
        { json: "type", js: "type", typ: "" },
        { json: "properties", js: "properties", typ: r("TaskBaseModelProperties") },
    ], false),
    "TaskBaseModelProperties": o([
        { json: "Name", js: "Name", typ: r("CityName") },
        { json: "Description", js: "Description", typ: r("CityName") },
        { json: "DueDate", js: "DueDate", typ: r("EndDate") },
        { json: "CreatedAt", js: "CreatedAt", typ: r("EndDate") },
        { json: "Status", js: "Status", typ: r("Status") },
        { json: "AssignedTo", js: "AssignedTo", typ: r("EndDate") },
    ], false),
    "TaskDetailBaseModel": o([
        { json: "required", js: "required", typ: a("") },
        { json: "type", js: "type", typ: "" },
        { json: "properties", js: "properties", typ: r("TaskDetailBaseModelProperties") },
    ], false),
    "TaskDetailBaseModelProperties": o([
        { json: "TaskId", js: "TaskId", typ: r("EndDate") },
        { json: "Note", js: "Note", typ: r("CityName") },
        { json: "Blob", js: "Blob", typ: r("CityName") },
        { json: "TaskDetailTags", js: "TaskDetailTags", typ: r("BusinessTripDetailTags") },
        { json: "Latitude", js: "Latitude", typ: r("CityName") },
        { json: "Longitude", js: "Longitude", typ: r("CityName") },
    ], false),
    "TaskUpdateModel": o([
        { json: "required", js: "required", typ: a("") },
        { json: "type", js: "type", typ: "" },
        { json: "properties", js: "properties", typ: r("TaskUpdateModelProperties") },
    ], false),
    "TaskUpdateModelProperties": o([
        { json: "Name", js: "Name", typ: r("CityName") },
        { json: "Description", js: "Description", typ: r("CityName") },
        { json: "DueDate", js: "DueDate", typ: r("EndDate") },
        { json: "Status", js: "Status", typ: r("Status") },
    ], false),
    "TenantBaseModel": o([
        { json: "required", js: "required", typ: a("") },
        { json: "type", js: "type", typ: "" },
        { json: "properties", js: "properties", typ: r("TenantBaseModelProperties") },
    ], false),
    "TenantBaseModelProperties": o([
        { json: "User", js: "User", typ: r("User") },
        { json: "Name", js: "Name", typ: r("CityName") },
        { json: "Licences", js: "Licences", typ: r("Licences") },
    ], false),
    "Licences": o([
        { json: "format", js: "format", typ: r("Format") },
        { json: "maximum", js: "maximum", typ: 0 },
        { json: "minimum", js: "minimum", typ: 0 },
        { json: "type", js: "type", typ: r("Type") },
        { json: "enum", js: "enum", typ: u(undefined, a(0)) },
    ], false),
    "TenantUpdateModel": o([
        { json: "required", js: "required", typ: a("") },
        { json: "type", js: "type", typ: "" },
        { json: "properties", js: "properties", typ: r("TenantUpdateModelProperties") },
    ], false),
    "TenantUpdateModelProperties": o([
        { json: "Id", js: "Id", typ: r("Licences") },
        { json: "Licences", js: "Licences", typ: r("Licences") },
    ], false),
    "UserBaseModel": o([
        { json: "required", js: "required", typ: a("") },
        { json: "type", js: "type", typ: "" },
        { json: "properties", js: "properties", typ: r("UserBaseModelProperties") },
    ], false),
    "UserBaseModelProperties": o([
        { json: "FirstName", js: "FirstName", typ: r("CityName") },
        { json: "LastName", js: "LastName", typ: r("CityName") },
        { json: "Phone", js: "Phone", typ: r("Phone") },
        { json: "Password", js: "Password", typ: r("CityName") },
        { json: "Email", js: "Email", typ: r("CityName") },
        { json: "Role", js: "Role", typ: r("Licences") },
    ], false),
    "Phone": o([
        { json: "pattern", js: "pattern", typ: "" },
        { json: "type", js: "type", typ: r("Type") },
    ], false),
    "PackageLock": o([
        { json: "name", js: "name", typ: "" },
        { json: "version", js: "version", typ: "" },
        { json: "lockfileVersion", js: "lockfileVersion", typ: 0 },
        { json: "requires", js: "requires", typ: true },
        { json: "dependencies", js: "dependencies", typ: r("PackageLockDependencies") },
    ], false),
    "PackageLockDependencies": o([
        { json: "@babel/runtime", js: "@babel/runtime", typ: r("TartuGecko") },
        { json: "@mark.probst/typescript-json-schema", js: "@mark.probst/typescript-json-schema", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "@mark.probst/unicode-properties", js: "@mark.probst/unicode-properties", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "acorn", js: "acorn", typ: r("TartuGecko") },
        { json: "ansi-regex", js: "ansi-regex", typ: r("TartuGecko") },
        { json: "ansi-styles", js: "ansi-styles", typ: r("TartuGecko") },
        { json: "array-back", js: "array-back", typ: r("TartuGecko") },
        { json: "balanced-match", js: "balanced-match", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "brace-expansion", js: "brace-expansion", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "brfs", js: "brfs", typ: r("TartuGecko") },
        { json: "buffer-equal", js: "buffer-equal", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "buffer-from", js: "buffer-from", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "camelcase", js: "camelcase", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "chalk", js: "chalk", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "cliui", js: "cliui", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "code-point-at", js: "code-point-at", typ: r("TartuGecko") },
        { json: "collection-utils", js: "collection-utils", typ: r("TartuGecko") },
        { json: "color-convert", js: "color-convert", typ: r("TartuGecko") },
        { json: "color-name", js: "color-name", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "command-line-args", js: "command-line-args", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "command-line-usage", js: "command-line-usage", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "concat-map", js: "concat-map", typ: r("TartuGecko") },
        { json: "concat-stream", js: "concat-stream", typ: r("TartuGecko") },
        { json: "convert-source-map", js: "convert-source-map", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "core-util-is", js: "core-util-is", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "cross-spawn", js: "cross-spawn", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "decamelize", js: "decamelize", typ: r("TartuGecko") },
        { json: "deep-extend", js: "deep-extend", typ: r("TartuGecko") },
        { json: "deep-is", js: "deep-is", typ: r("TartuGecko") },
        { json: "duplexer2", js: "duplexer2", typ: r("TartuGecko") },
        { json: "encoding", js: "encoding", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "end-of-stream", js: "end-of-stream", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "escape-string-regexp", js: "escape-string-regexp", typ: r("TartuGecko") },
        { json: "escodegen", js: "escodegen", typ: r("TartuGecko") },
        { json: "esprima", js: "esprima", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "estraverse", js: "estraverse", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "esutils", js: "esutils", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "execa", js: "execa", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "falafel", js: "falafel", typ: r("Falafel") },
        { json: "fast-levenshtein", js: "fast-levenshtein", typ: r("TartuGecko") },
        { json: "figlet", js: "figlet", typ: r("TartuGecko") },
        { json: "find-replace", js: "find-replace", typ: r("FindReplace") },
        { json: "find-up", js: "find-up", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "foreach", js: "foreach", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "fs.realpath", js: "fs.realpath", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "function-bind", js: "function-bind", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "get-caller-file", js: "get-caller-file", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "get-stream", js: "get-stream", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "glob", js: "glob", typ: r("TartuGecko") },
        { json: "graphql", js: "graphql", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "has", js: "has", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "has-flag", js: "has-flag", typ: r("TartuGecko") },
        { json: "iconv-lite", js: "iconv-lite", typ: r("TartuGecko") },
        { json: "inflight", js: "inflight", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "inherits", js: "inherits", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "invert-kv", js: "invert-kv", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "is-fullwidth-code-point", js: "is-fullwidth-code-point", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "is-stream", js: "is-stream", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "is-url", js: "is-url", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "isarray", js: "isarray", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "isexe", js: "isexe", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "iterall", js: "iterall", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "js-base64", js: "js-base64", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "json-stable-stringify", js: "json-stable-stringify", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "jsonify", js: "jsonify", typ: r("TartuGecko") },
        { json: "lcid", js: "lcid", typ: r("TartuGecko") },
        { json: "levn", js: "levn", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "locate-path", js: "locate-path", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "lodash", js: "lodash", typ: r("TartuGecko") },
        { json: "lodash.padend", js: "lodash.padend", typ: r("TartuGecko") },
        { json: "magic-string", js: "magic-string", typ: r("TartuGecko") },
        { json: "map-age-cleaner", js: "map-age-cleaner", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "mem", js: "mem", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "merge-source-map", js: "merge-source-map", typ: r("MergeSourceMap") },
        { json: "mimic-fn", js: "mimic-fn", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "minimatch", js: "minimatch", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "minimist", js: "minimist", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "moment", js: "moment", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "nice-try", js: "nice-try", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "node-fetch", js: "node-fetch", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "npm-run-path", js: "npm-run-path", typ: r("TartuGecko") },
        { json: "number-is-nan", js: "number-is-nan", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "object-inspect", js: "object-inspect", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "object-keys", js: "object-keys", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "once", js: "once", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "optionator", js: "optionator", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "os-locale", js: "os-locale", typ: r("TartuGecko") },
        { json: "p-defer", js: "p-defer", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "p-finally", js: "p-finally", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "p-is-promise", js: "p-is-promise", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "p-limit", js: "p-limit", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "p-locate", js: "p-locate", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "p-try", js: "p-try", typ: r("TartuGecko") },
        { json: "pako", js: "pako", typ: r("TartuGecko") },
        { json: "path-exists", js: "path-exists", typ: r("TartuGecko") },
        { json: "path-is-absolute", js: "path-is-absolute", typ: r("TartuGecko") },
        { json: "path-key", js: "path-key", typ: r("TartuGecko") },
        { json: "path-parse", js: "path-parse", typ: r("TartuGecko") },
        { json: "pluralize", js: "pluralize", typ: r("TartuGecko") },
        { json: "prelude-ls", js: "prelude-ls", typ: r("TartuGecko") },
        { json: "process-nextick-args", js: "process-nextick-args", typ: r("TartuGecko") },
        { json: "pump", js: "pump", typ: r("TartuGecko") },
        { json: "quicktype", js: "quicktype", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "quote-stream", js: "quote-stream", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "readable-stream", js: "readable-stream", typ: r("TartuGecko") },
        { json: "reduce-flatten", js: "reduce-flatten", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "regenerator-runtime", js: "regenerator-runtime", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "require-directory", js: "require-directory", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "require-main-filename", js: "require-main-filename", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "resolve", js: "resolve", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "safe-buffer", js: "safe-buffer", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "safer-buffer", js: "safer-buffer", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "semver", js: "semver", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "set-blocking", js: "set-blocking", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "shallow-copy", js: "shallow-copy", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "shebang-command", js: "shebang-command", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "shebang-regex", js: "shebang-regex", typ: r("TartuGecko") },
        { json: "signal-exit", js: "signal-exit", typ: r("TartuGecko") },
        { json: "source-map", js: "source-map", typ: r("TartuGecko") },
        { json: "static-eval", js: "static-eval", typ: r("TartuGecko") },
        { json: "static-module", js: "static-module", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "stream-chain", js: "stream-chain", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "stream-json", js: "stream-json", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "string-to-stream", js: "string-to-stream", typ: r("TartuGecko") },
        { json: "string-width", js: "string-width", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "string_decoder", js: "string_decoder", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "strip-ansi", js: "strip-ansi", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "strip-eof", js: "strip-eof", typ: r("TartuGecko") },
        { json: "supports-color", js: "supports-color", typ: r("TartuGecko") },
        { json: "table-layout", js: "table-layout", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "test-value", js: "test-value", typ: r("TestValue") },
        { json: "through2", js: "through2", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "tiny-inflate", js: "tiny-inflate", typ: r("TartuGecko") },
        { json: "type-check", js: "type-check", typ: r("TartuGecko") },
        { json: "typedarray", js: "typedarray", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "typescript", js: "typescript", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "typical", js: "typical", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "unicode-trie", js: "unicode-trie", typ: r("UnicodeTrie") },
        { json: "urijs", js: "urijs", typ: r("TartuGecko") },
        { json: "util-deprecate", js: "util-deprecate", typ: r("TartuGecko") },
        { json: "uuid", js: "uuid", typ: r("TartuGecko") },
        { json: "vlq", js: "vlq", typ: r("TartuGecko") },
        { json: "which", js: "which", typ: r("TartuGecko") },
        { json: "which-module", js: "which-module", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "wordwrap", js: "wordwrap", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "wordwrapjs", js: "wordwrapjs", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "wrap-ansi", js: "wrap-ansi", typ: r("WrapANSI") },
        { json: "wrappy", js: "wrappy", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "xtend", js: "xtend", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "y18n", js: "y18n", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "yaml", js: "yaml", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "yargs", js: "yargs", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "yargs-parser", js: "yargs-parser", typ: r("TartuGecko") },
    ], false),
    "TartuGecko": o([
        { json: "version", js: "version", typ: "" },
        { json: "resolved", js: "resolved", typ: "" },
        { json: "integrity", js: "integrity", typ: "" },
        { json: "requires", js: "requires", typ: u(undefined, r("PurpleRequires")) },
        { json: "optional", js: "optional", typ: u(undefined, true) },
    ], false),
    "PurpleRequires": o([
        { json: "regenerator-runtime", js: "regenerator-runtime", typ: u(undefined, "") },
        { json: "color-convert", js: "color-convert", typ: u(undefined, "") },
        { json: "typical", js: "typical", typ: u(undefined, "") },
        { json: "quote-stream", js: "quote-stream", typ: u(undefined, "") },
        { json: "resolve", js: "resolve", typ: u(undefined, "") },
        { json: "static-module", js: "static-module", typ: u(undefined, "") },
        { json: "through2", js: "through2", typ: u(undefined, "") },
        { json: "color-name", js: "color-name", typ: u(undefined, "") },
        { json: "buffer-from", js: "buffer-from", typ: u(undefined, "") },
        { json: "inherits", js: "inherits", typ: u(undefined, "") },
        { json: "readable-stream", js: "readable-stream", typ: u(undefined, "") },
        { json: "typedarray", js: "typedarray", typ: u(undefined, "") },
        { json: "esprima", js: "esprima", typ: u(undefined, "") },
        { json: "estraverse", js: "estraverse", typ: u(undefined, "") },
        { json: "esutils", js: "esutils", typ: u(undefined, "") },
        { json: "optionator", js: "optionator", typ: u(undefined, "") },
        { json: "source-map", js: "source-map", typ: u(undefined, "") },
        { json: "fs.realpath", js: "fs.realpath", typ: u(undefined, "") },
        { json: "inflight", js: "inflight", typ: u(undefined, "") },
        { json: "minimatch", js: "minimatch", typ: u(undefined, "") },
        { json: "once", js: "once", typ: u(undefined, "") },
        { json: "path-is-absolute", js: "path-is-absolute", typ: u(undefined, "") },
        { json: "safer-buffer", js: "safer-buffer", typ: u(undefined, "") },
        { json: "invert-kv", js: "invert-kv", typ: u(undefined, "") },
        { json: "vlq", js: "vlq", typ: u(undefined, "") },
        { json: "path-key", js: "path-key", typ: u(undefined, "") },
        { json: "execa", js: "execa", typ: u(undefined, "") },
        { json: "lcid", js: "lcid", typ: u(undefined, "") },
        { json: "mem", js: "mem", typ: u(undefined, "") },
        { json: "end-of-stream", js: "end-of-stream", typ: u(undefined, "") },
        { json: "core-util-is", js: "core-util-is", typ: u(undefined, "") },
        { json: "isarray", js: "isarray", typ: u(undefined, "") },
        { json: "process-nextick-args", js: "process-nextick-args", typ: u(undefined, "") },
        { json: "safe-buffer", js: "safe-buffer", typ: u(undefined, "") },
        { json: "string_decoder", js: "string_decoder", typ: u(undefined, "") },
        { json: "util-deprecate", js: "util-deprecate", typ: u(undefined, "") },
        { json: "escodegen", js: "escodegen", typ: u(undefined, "") },
        { json: "has-flag", js: "has-flag", typ: u(undefined, "") },
        { json: "prelude-ls", js: "prelude-ls", typ: u(undefined, "") },
        { json: "isexe", js: "isexe", typ: u(undefined, "") },
        { json: "code-point-at", js: "code-point-at", typ: u(undefined, "") },
        { json: "is-fullwidth-code-point", js: "is-fullwidth-code-point", typ: u(undefined, "") },
        { json: "strip-ansi", js: "strip-ansi", typ: u(undefined, "") },
        { json: "camelcase", js: "camelcase", typ: u(undefined, "") },
        { json: "decamelize", js: "decamelize", typ: u(undefined, "") },
    ], false),
    "LivingstoneSouthernWhiteFacedOwl": o([
        { json: "version", js: "version", typ: "" },
        { json: "resolved", js: "resolved", typ: "" },
        { json: "integrity", js: "integrity", typ: "" },
        { json: "requires", js: "requires", typ: u(undefined, m("")) },
    ], false),
    "Falafel": o([
        { json: "version", js: "version", typ: "" },
        { json: "resolved", js: "resolved", typ: "" },
        { json: "integrity", js: "integrity", typ: "" },
        { json: "requires", js: "requires", typ: r("FalafelRequires") },
        { json: "dependencies", js: "dependencies", typ: r("FalafelDependencies") },
    ], false),
    "FalafelDependencies": o([
        { json: "isarray", js: "isarray", typ: r("LivingstoneSouthernWhiteFacedOwl") },
    ], false),
    "FalafelRequires": o([
        { json: "acorn", js: "acorn", typ: "" },
        { json: "foreach", js: "foreach", typ: "" },
        { json: "isarray", js: "isarray", typ: "" },
        { json: "object-keys", js: "object-keys", typ: "" },
    ], false),
    "FindReplace": o([
        { json: "version", js: "version", typ: "" },
        { json: "resolved", js: "resolved", typ: "" },
        { json: "integrity", js: "integrity", typ: "" },
        { json: "requires", js: "requires", typ: r("FindReplaceRequires") },
        { json: "dependencies", js: "dependencies", typ: r("FindReplaceDependencies") },
    ], false),
    "FindReplaceDependencies": o([
        { json: "array-back", js: "array-back", typ: r("ArrayBack") },
    ], false),
    "ArrayBack": o([
        { json: "version", js: "version", typ: "" },
        { json: "resolved", js: "resolved", typ: "" },
        { json: "integrity", js: "integrity", typ: "" },
        { json: "requires", js: "requires", typ: r("ArrayBackRequires") },
    ], false),
    "ArrayBackRequires": o([
        { json: "typical", js: "typical", typ: "" },
    ], false),
    "FindReplaceRequires": o([
        { json: "array-back", js: "array-back", typ: "" },
        { json: "test-value", js: "test-value", typ: "" },
    ], false),
    "MergeSourceMap": o([
        { json: "version", js: "version", typ: "" },
        { json: "resolved", js: "resolved", typ: "" },
        { json: "integrity", js: "integrity", typ: "" },
        { json: "requires", js: "requires", typ: r("MergeSourceMapRequires") },
        { json: "dependencies", js: "dependencies", typ: r("MergeSourceMapDependencies") },
    ], false),
    "MergeSourceMapDependencies": o([
        { json: "source-map", js: "source-map", typ: r("TartuGecko") },
    ], false),
    "MergeSourceMapRequires": o([
        { json: "source-map", js: "source-map", typ: "" },
    ], false),
    "TestValue": o([
        { json: "version", js: "version", typ: "" },
        { json: "resolved", js: "resolved", typ: "" },
        { json: "integrity", js: "integrity", typ: "" },
        { json: "requires", js: "requires", typ: r("TestValueRequires") },
        { json: "dependencies", js: "dependencies", typ: r("FindReplaceDependencies") },
    ], false),
    "TestValueRequires": o([
        { json: "array-back", js: "array-back", typ: "" },
        { json: "typical", js: "typical", typ: "" },
    ], false),
    "UnicodeTrie": o([
        { json: "version", js: "version", typ: "" },
        { json: "resolved", js: "resolved", typ: "" },
        { json: "integrity", js: "integrity", typ: "" },
        { json: "requires", js: "requires", typ: r("UnicodeTrieRequires") },
        { json: "dependencies", js: "dependencies", typ: r("UnicodeTrieDependencies") },
    ], false),
    "UnicodeTrieDependencies": o([
        { json: "pako", js: "pako", typ: r("LivingstoneSouthernWhiteFacedOwl") },
    ], false),
    "UnicodeTrieRequires": o([
        { json: "pako", js: "pako", typ: "" },
        { json: "tiny-inflate", js: "tiny-inflate", typ: "" },
    ], false),
    "WrapANSI": o([
        { json: "version", js: "version", typ: "" },
        { json: "resolved", js: "resolved", typ: "" },
        { json: "integrity", js: "integrity", typ: "" },
        { json: "requires", js: "requires", typ: r("WrapANSIRequires") },
        { json: "dependencies", js: "dependencies", typ: r("WrapANSIDependencies") },
    ], false),
    "WrapANSIDependencies": o([
        { json: "ansi-regex", js: "ansi-regex", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "is-fullwidth-code-point", js: "is-fullwidth-code-point", typ: r("LivingstoneSouthernWhiteFacedOwl") },
        { json: "string-width", js: "string-width", typ: r("TartuGecko") },
        { json: "strip-ansi", js: "strip-ansi", typ: r("LivingstoneSouthernWhiteFacedOwl") },
    ], false),
    "WrapANSIRequires": o([
        { json: "string-width", js: "string-width", typ: "" },
        { json: "strip-ansi", js: "strip-ansi", typ: "" },
    ], false),
    "Package": o([
        { json: "name", js: "name", typ: "" },
        { json: "version", js: "version", typ: "" },
        { json: "description", js: "description", typ: "" },
        { json: "main", js: "main", typ: "" },
        { json: "bin", js: "bin", typ: r("Bin") },
        { json: "scripts", js: "scripts", typ: r("Scripts") },
        { json: "keywords", js: "keywords", typ: a("") },
        { json: "author", js: "author", typ: "" },
        { json: "license", js: "license", typ: "" },
        { json: "dependencies", js: "dependencies", typ: r("PackageDependencies") },
    ], false),
    "Bin": o([
        { json: "@roundfly/swag", js: "@roundfly/swag", typ: "" },
        { json: "swag", js: "swag", typ: "" },
    ], false),
    "PackageDependencies": o([
        { json: "chalk", js: "chalk", typ: "" },
        { json: "figlet", js: "figlet", typ: "" },
        { json: "minimist", js: "minimist", typ: "" },
        { json: "quicktype", js: "quicktype", typ: "" },
    ], false),
    "Scripts": o([
        { json: "test", js: "test", typ: "" },
    ], false),
    "Type": [
        "integer",
        "string",
    ],
    "Format": [
        "date-time",
        "int32",
        "int64",
        "password",
    ],
};

module.exports = {
    "modelToJson": modelToJson,
    "toModel": toModel,
    "packageLockToJson": packageLockToJson,
    "toPackageLock": toPackageLock,
    "packageToJson": packageToJson,
    "toPackage": toPackage,
    "swaggerModelToJson": swaggerModelToJson,
    "toSwaggerModel": toSwaggerModel,
};
