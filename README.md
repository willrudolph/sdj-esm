# SDJ-ESM
## Self-Described JSON - ESM JavaScript/TypeScript Library

## What it is:
SDJ-ESM is an ESM library that reads and creates .json files which are a subset of standard json/text files. 
Unlike standard JSON, sdj files internalize a self-description of the data which it contains.
By separating the description from the data; this allows customizable, consistent, and validatable structure.  
With a single JSON schema, SDJ files can be used to describe, store, retrieve, and transmit nearly any type of data.
The library transforms sdj data between immutable and mutable forms of sdj json/javascript/typescript objects.

## What it Does:

- TypeScript/JavaScript implementation/testing/instantiation of SDJ file type/JSON schema
- Creates JS data objects and provides a range of methods for data reference of data elements/structure
- Allows easy hydration/de-hydration between data/class/immutable states
- Enforce type validation and data structure descriptions
- Shared ESM module access for Node.js (+18.x) allowing same module to work FE or BE  
- Variable and customizable logging system that verifies/throws errors/logs
- Extensibility via custom/shared/private Lexicon add-ons


## How to get started:
Add the library via npm as a dependency. SDJ-ESM requires 'lodash-es' as a peer dependency.
```bash
npm install lodash-es
npm install sdj-esm
```

- Example SDJ files and SDJ Editor coming soon --

### Load in the JSON file:
Since JSON files are allowed by ES modules you can use the following syntax for local/static linked files.
```javascript
import sdjFile from "./sdjfile.json"

const sdJson = new SdJson(sdjFile);
```
Or via fetch or another http loader, this would be a simple example:
```javascript
let sdJson;

fetch("//(some location)/sdjfile.json")
  .then((response) => response.json())
  .then(json => {
    sdJson = new SdJson(json);
  })
```

Note; the SDJ Library is fault intolerant and will throw errors on invalid files/format. If you do not know if the file is a valid SDJ file, then you will need to wrap the creation in a
Try...Catch. Or use standalone ```genJson(json)``` function for an error safe version.

### Release Notes:
0.0.7 Initial NPM/Git testing release

[About](https://github.com/willrudolph/sdj-esm/blob/main/ABOUT.md) this library, about the [SDJ project](https://github.com/willrudolph/sdj) roadmap, and [Copyright](https://github.com/willrudolph/sdj-esm/blob/main/COPYRIGHT) info. 

Licensed under [MPLv2](https://github.com/willrudolph/sdj-esm/blob/main/LICENSE).

