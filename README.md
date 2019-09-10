## SWAG

Swag is a CLI tool that when given a Swagger URL which points to JSON deserializes the JSON and filters out redundant key:value pairs, this is then passed to [quicktype](https://quicktype.io) which outputs code in one of its supported languages. If no language is passed as an argument Swag then defaults to Swift.

For more advanced JSON decoding options I encourage you to look into [quicktype](https://github.com/quicktype/quicktype), seeing as Swag is just a thin wrapper over it.



## Installation
```bash
npm install @roundfly/swag
```


## Usage
```bash
swag https://my-awesome-api.com/swagger/v1/swagger.json --lang js
```
Inputing the above in a shell outputs a models.js file with all your Swagger models deserialized.



## TODO

* Add unit tests.
* Improve error output to stderr.
* Add more language support.
* Add a CHANGELOG.md
