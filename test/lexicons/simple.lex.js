
export class SimpleSdjLexicon {
    name = "simple";
    items = [{
            sdKey: "routeTitle",
            sdId: 2,
            type: "strd"
        }, {
            sdKey: "compClassName",
            sdId: 3,
            type: "strd",
            limiter: "req"
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
//# sourceMappingURL=simple.lex.js.map
