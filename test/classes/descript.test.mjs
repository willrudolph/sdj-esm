import {SdjDescription, SdjHost, SdJson} from "../../dist/index.js";
import {cloneDeep, isEqual} from "lodash-es";
import {afterEach, beforeEach, describe, expect, test} from "@jest/globals";

const emptyDesc = {
  "sdInfo": {
    "created": 1701390090598,
    "modified": 1701390090598,
    "name": "descName",
    "uniqId": "3rh28R-Qlbx4-i6Xy-gqB03MA"
  },
  "graph": [
    {
      "sdId": 1,
      "sdKey": "dataEnt",
      "sdItems": [2]
    }
  ],
  "items": [{
    "sdId": 2,
    "sdKey": "someValue",
    "type": "strd"
  }]
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
let badDescA = {};

describe("Description Base Testing", () => {
  let hostSdj;

  beforeEach(() => {
    hostSdj = SdjHost.getHost();
  });

  afterEach(() => {
    hostSdj = undefined;
    SdjHost.setTestingInstance(undefined);
  })

  test("new() and dup check, simple bad checks", () => {
    expect(() =>{
      const classObj = new SdjDescription();
    }).toThrowError();

    expect(()=> {
      const classDesN = new SdjDescription(emptyDesc);
    }).toThrowError();

    const classDesA = new SdjDescription(emptyDesc, hostSdj);
    expect(classDesA).toBeTruthy();
    hostSdj = SdjHost.getISdjHost();

    const classDesB = new SdjDescription(blankDesc, hostSdj)
    expect(classDesB).toBeTruthy();

    let classC;
    expect(() => {
      badDescA = {"d": "adsf", "bob": false};
      classC = new SdjDescription(badDescA, hostSdj);
    }).toThrowError();
    expect(() => {
      badDescA = { "sdInfo": {
        "created": 0,
          "modified": 0,
          "name": "descName",
          "uniqId": "000000-00000-0000-0000000"
      }};
      classC = new SdjDescription(badDescA, hostSdj);
    }).toThrowError();

    expect(() => {
      badDescA = { "sdInfo": {
          "created": 0,
          "modified": 0,
          "name": "descName",
          "uniqId": "000000-00000-0000-0000000"
        }, graph:[], items: []};
      classC = new SdjDescription(badDescA, hostSdj);
    }).toThrowError();


    expect(() => {
      badDescA = { "graph": [],
        "items": []};
      classC = new SdjDescription(badDescA, hostSdj);
    }).toThrowError();
  });
});

describe("Description Test set 1", () => {
  let hostSdj;

  afterEach(() => {
    SdjHost.setTestingInstance(undefined);
  })

  beforeEach(() => {
    hostSdj = SdjHost.getISdjHost();
  })

  test("extendsId recursion exclusions", () => {
    let newBlank = cloneDeep(blankDesc);
    let newDesc;

    newBlank.graph.push({
      sdId: 1,
      sdKey: "subObj"
    }, {
      sdId: 2,
      sdKey: "subObjA",
      extendIds: [4]
    },{
      sdId: 3,
      sdKey: "subObjB",
      extendIds: [2]
    },{
      sdId: 4,
      sdKey: "subObjC",
      extendIds: [3]
    });

    expect(()=>{
      newDesc = new SdjDescription(newBlank, hostSdj);
    }).toThrowError();

    newBlank = cloneDeep(blankDesc);

    newBlank.graph.push({
      sdId: 1,
    sdKey: "subObj"
    }, {
      sdId: 2,
      sdKey: "subObjA",
    },{
      sdId: 3,
      sdKey: "subObjB",
      extendIds: [1,2]
    },{
      sdId: 4,
      sdKey: "subObjC",
      extendIds: [1,2,3]
    });

    expect(()=>{
      newDesc = new SdjDescription(newBlank, hostSdj);
    }).toThrowError();
  });
});

describe("Description Test set 2", () => {
  let hostSdj;

  afterEach(() => {
    SdjHost.setTestingInstance(undefined);
  })


  test("Host Dup Check", () => {
    let host1, sdj, sdj2, sdj3, sdj4, sdj5,
        host2;

    expect(() => {
      host2 = new SdjHost();
    }).toThrowError();


  })


  test("Test something ELSE", () => {
  });
});
