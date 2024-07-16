import {
  ESDJ_LOG,
  SdjHost,
  SdJson, validIntArray,
} from "../dist/index.js";
import {isEqual} from "lodash-es";
import testA from "./json/sdj/test-file-a.json" assert {type: "json"};


const hostSdj = SdjHost.getISdjHost({options:{logMode: ESDJ_LOG.DEV}});
const classDesA = new SdJson(testA);

const dataOut = classDesA.genJI().data;
const orgData = testA.data;

const reallyEQJson = isEqual(classDesA.genJI(), testA);
const reallyEQDesc = isEqual(classDesA.description.genJI(), testA.description);
const reallyEQData = isEqual(classDesA.genJI().data, testA.data);
const reallyEQInfo = isEqual(classDesA.sdInfo, testA.sdInfo);
console.log();
