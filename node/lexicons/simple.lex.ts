import {ESDJ_LIMIT, type ILexicon} from "../../src/index.js";

// This file dumps to local/node/lexicons/simple.lex.js

export class SimpleSdjLexicon implements ILexicon {
    name = "simple";
    items = [{
        sdKey: "routeTitle",
        sdId: 2,
        type: "strd"
    },{
        sdKey: "compClassName",
        sdId: 3,
        type: "strd",
        limiter: ESDJ_LIMIT.REQ
    }];
    entities = [{
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

}
