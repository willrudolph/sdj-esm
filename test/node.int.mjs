import {
  blankDescriptionJI, newInfoJI,
  SdjDescription,
  SdjHost, SdjEntity,
  SdJson, validIntArray,
} from "../dist/index.js";
import testA from "./json/sdj/test-file-a.json" assert {type: "json"};
import {getRegEx} from "../dist/index.js";
//import { createRequire } from "module";
//import {cloneDeep} from "lodash-es";
import emptyMin from "./json/sdj/test-min-ang-lex-empty.json" assert {type: "json"};

const emptyEnt = {
  "sdId": 3,
  "sdKey": "Example",
  "childIds": {},
  "extendIds":[1]
};


const emptyDesc = {
  "sdInfo": {
    "created": 1701390090598,
    "modified": 1701390090598,
    "name": "descName",
    "uniqId": "3rh28R-Qlbx4-i6Xy-gqB03MA"
  },
  "graph": [],
  "items": []
};

const blankDesc = {
  "sdInfo": {
    "created": 1701390090598,
    "modified": 1701390090598,
    "name": "descName",
    "uniqId": "000000-00000-0000-0000000"
  },
  "graph": [],
  "items": []
}

const lexRegEx = getRegEx("typeLexName");

/*lexRegEx.lastIndex = 0;
let result = lexRegEx.test("route-comp");
lexRegEx.lastIndex = 0;
let result3 = lexRegEx.test("route-comp");
let goodDesc = blankDescriptionJI("descName"),
    goodsdInfo = newInfoJI("jsonName");*/

/*let sampleDesc = new SdjDescription(blankDesc, SdjHost.getHost());
let sdjClassC = new SdJson({$id:"http://willrudolph.com/schemas/sdj-schema.json",
  description: goodDesc, sdInfo: goodsdInfo});*/

//const check = validIntArray([0]);
//const require = createRequire(import.meta.url);
//const host = SdjHost.getISdjHost({options:{logMode: "DEV"}});
//const testExt = require("./json/sdj/test-extends.json");
//const classDesA = new SdJson(testA);


let host;
let lexicon = {
  name: "min-ang"
};

lexicon.items = [{
  sdKey: "routeTitle",
  sdId: 2,
  type: "strd"
},{
  sdKey: "compClassName",
  sdId: 3,
  type: "strd",
  limiter: "req"
}];

lexicon.entities = [{
    sdKey: "comp",
    sdId: 1,
    sdProps: {
      route: false,
      comp: true
    },
    parentIds: [0, 1, 2],
    childIds: [1, 2, 3],
    sdItems: [3]
  },
  {
    sdKey: "route-comp",
    sdId: 2,
    extendIds: [1],
    sdProps: {
      route: true,
    },
    parentIds: [0, 2],
    sdItems: [2],
    childIds: [1, 2, 3]
  },
  {
    sdKey: "data-obj",
    sdId: 3,
    sdProps: {
      route: false,
      comp: false
    },
    parentIds: [0, 1, 2, 3],
    childIds: [3],
  }];

host = SdjHost.getISdjHost({lexicons: [lexicon]});
let sdJson = new SdJson(emptyMin);


console.log();
