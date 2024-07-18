import testA from "../test/json/sdj/test-file-a.json" assert {type: "json"};
import simpleJI from "../test/json/sdj/example-simple-lex.json" assert {type: "json"};
import {ESDJ_LOG, SdjHost, SdJson, type SdJsonJI} from "../src/index.js";
import {SimpleSdjLexicon} from "./lexicons/simple.lex.js";
import {extLexicon} from "./lexicons/other.quick.lex.js";

const badDescA = {
    "sdInfo": {
        "created": 0,
        "modified": 0,
        "name": "descName",
        "uniqId": "000000-00000-0000-0000000"
    },
    "lexicons": ["simple"],
    "graph": [],
    "items": []
}

const hostSdj = SdjHost.getISdjHost({lexicons: [extLexicon, new SimpleSdjLexicon()], options:{logMode: ESDJ_LOG.DEV, }});
//const aJson = new SdJson(<SdJsonJI>testA);
const descBasedSdj = new SdJson(badDescA);
const testAClass = new SdJson(<SdJsonJI>testA);
const rtnJI = descBasedSdj.genJI();
const simpleSdj = new SdJson(<SdJsonJI>simpleJI);
const search01 = testAClass.dataByItem({sdId: 2})

const search02 = testAClass.dataByItem({sdKey: "title"})

const search03 = testAClass.dataByItem({sdId: 3})

const search04 = testAClass.dataByItem({sdKey: "htmlText"})

const search05 = testAClass.dataByItem({sdId: 1});

const search06 = testAClass.dataByItem({sdId: 2})

const search07 = testAClass.dataByItem({type: "strl"})

const search08 = testAClass.dataByItem({type: "title"})

const search09 = testAClass.dataByItem({type: "strl"});

console.log();
