import {ESDJ_LOG, SdjHost, SdJson,} from "../dist/index.js";
import {isEqual} from "lodash-es";
import testA from "./json/sdj/test-file-a.json" assert {type: "json"};
import testB from "./json/sdj/test-file-b.json" assert {type: "json"};

const hostSdj = SdjHost.getISdjHost({options:{logMode: ESDJ_LOG.DEV}});
const aJson = new SdJson(testA);
const bJson = new SdJson(testB);

const isEq = isEqual(bJson.genJI(), bJson);
console.log();
