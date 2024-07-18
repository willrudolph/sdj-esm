## Node + Local Directories

'local.run.ts' is a local runner in order to directly debug the library via Intellij/TypeScript. It appears to resolve
mapping issues and provides access to debug control when going back and forth with tests, debugging, testing, and adaptations.

```npm run build:local```

This will create the "/local" source / reference, git-ignored directory that can be accessed:

```node ./local/node/local.run.js```

Or provide the run.js path to an Intellij configuration.</br>
The TypeScript config extends the original making minor adjustments for node, so differences
between these two versions should be minor/trivial.

All testing suites are based off of the ESM build, not on this local.

Note: "local.run.ts" follows "node es" rules for imports/files:</br>
- JSON imports must use ``` assert {type: "json"};```
- As with the whole library, TS file imports must be marked ".js"
- Importing just Types from TS requires the 'type' modifier
