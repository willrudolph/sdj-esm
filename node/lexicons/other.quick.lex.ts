import {type ILexicon} from "../../src/index.js";

let lexicon: ILexicon = {
    name: "other"
};

lexicon.items = [{
    sdKey: "routeTitle",
    sdId: 2,
    type: "strd"
}, {
    sdKey: "compClassName",
    sdId: 3,
    type: "strd",
    limiter: "req"
}, {
    sdKey: "arrayStr",
    sdId: 4,
    type: "arystrs"
}, {
    sdKey: "objNums",
    sdId: 5,
    type: "objnum"
}, {
    sdKey: "title",
    sdId: 6,
    type: "strd"
}];

lexicon.entities = [{
    sdKey: "comp",
    sdId: 1,
    sdProps: {
        route: false,
        comp: true
    },
    parentIds: [0, 1, 2],
    childIds: [1, 3],
    sdItems: [3]
},
    {
        sdKey: "route-comp",
        sdId: 2,
        extendIds: [1],
        sdProps: {
            route: true
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
        sdItems: [4, 5, 6],
        childIds: [3],
    }];

export const extLexicon = lexicon;
