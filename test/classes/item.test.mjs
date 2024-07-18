import {SdjDescription, SdjHost, SdjItem} from "../../dist/index.js";
import blankDesc from "../json/desc.only.json";
import {afterEach, beforeEach, describe, expect, test} from "@jest/globals";


const emptyItem = {
  "sdId": 3,
  "sdKey": "Example",
  "type": "something"
};

const wrongItemA = {
  "sdId": 0,
  "sdKey": "Example",
  "type": "avalue"
};

const wrongItemB = {
  "sdId": 3,
  "sdKey": "Example",
  "type": "_DFcoure"
};

const wrongItemC = {
  "sdId": 3,
  "sdKey": "Example",
  "type": "avalue",
  "limiter": "bob"
};
const wrongItemD = {
  "sdId": -1,
  "sdKey": "Example",
  "type": "avalue"
};

const wrongItemE = {
  "sdId": {},
  "sdKey": "Example",
  "type": "seevev"
};

const wrongItemF = {
  "sdId": 3,
  "sdKey": "87Example",
  "type": "avalue"
};
const wrongItemG = {
  "sdId": 3,
  "sdKey": "Example",
  "type": "avalue",
  "limiter": {}
};
const wrongItemH = {
  "sdId": 5,
  "sdKey": "Example",
  "type": "__avalue"
};



const goodItemA = {
  "sdId": 3,
  "sdKey": "Example",
  "type": "something"
}


describe("Item Base Testing", () => {
  let hostSdj, sampleDesc;

  afterEach(() => {
    sampleDesc = undefined;
    hostSdj = undefined;
    SdjHost.setTestingInstance(undefined);
  })

  beforeEach(() => {
    hostSdj = SdjHost.getHost();
    sampleDesc = new SdjDescription(blankDesc, hostSdj);
  })

  test("new() and error set", () => {
    expect(() =>{
      const classObj = new SdjItem();
    }).toThrowError();

    expect(() =>{
      const classObj = new SdjItem(sampleDesc);
    }).toThrowError();

    expect(() =>{
      const classObj = new SdjItem({}, goodItemA);
    }).toThrowError();

    expect(() =>{
      const classObj = new SdjItem({}, {});
    }).toThrowError();

    const entity = new SdjItem(emptyItem, sampleDesc);
    expect(entity).toBeTruthy();

    const sdjItemity = new SdjItem(goodItemA, sampleDesc);
    expect(sdjItemity).toBeTruthy();

    expect(() =>{
      const sdjItem2 = new SdjItem(goodItemA, {});
    }).toThrowError();

    const sdjItem2 = new SdjItem(goodItemA);
    expect(sdjItem2).toBeTruthy();

  });

  test("item input error set 1", () => {
    expect(() => {
      const failCons = new SdjItem(wrongItemA);
    }).toThrowError();

    expect(() => {
      const failCons = new SdjItem(wrongItemB);
    }).toThrowError();

    expect(() => {
      const failCons = new SdjItem(wrongItemC);
    }).toThrowError();

    expect(() => {
      const failCons = new SdjItem(wrongItemD);
    }).toThrowError();
  });

  test("item input error set 2", () => {
    expect(() => {
      const failCons = new SdjItem(wrongItemE);
    }).toThrowError();

    expect(() => {
      const failCons = new SdjItem(wrongItemF);
    }).toThrowError();

    expect(() => {
      const failCons = new SdjItem(wrongItemG);
    }).toThrowError();

    expect(() => {
      const failCons = new SdjItem(wrongItemH);
    }).toThrowError();
  });

});

describe("Item Test set 1", () => {
  let hostSdj;

  afterEach(() => {
    SdjHost.setTestingInstance(undefined);
  })

  test("Test something", () => {
    expect(false).toBe(false);
  });
});

describe("Item Test set 2", () => {
  let hostSdj;

  afterEach(() => {
    SdjHost.setTestingInstance(undefined);
  })

  test("Test something ELSE", () => {
    expect(false).toBe(false);
  });
});
