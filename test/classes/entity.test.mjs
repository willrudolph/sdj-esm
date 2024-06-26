import {SdjHost, SdjEntity, SdjDescription} from "../../dist/index.js";
import blankDesc from "../json/desc.only.json";
import {expect, test, afterEach, beforeEach, describe} from "@jest/globals";

const emptyEnt = {
  "sdId": 3,
  "sdKey": "example",
  "extendIds": [1]
};

const emptyButWrong = {
  "sdId": 3,
  "sdKey": "example",
}

const wrongEntA = {
  "sdId": 0,
  "sdKey": "Example"
};

const wrongEntB = {
  "sdId": 3,
  "sdKey": "Exa&mple",
  "parents": [{}, "dfs","fds", 1]
};
const wrongEntC = {
  "sdId": 3,
  "sdKey": "Example",
  "keyValues": {"tom": [1,3,4]},
};
const wrongEntD = {
  "sdId": 3,
  "sdKey": "Example",
  "childIds": {},
  "extends":[3]
};


const zeroEnt = {
  "sdId": 0,
  "sdKey": "sdGraphZero"
}

const goodEntA = {
  "sdId": 3,
  "sdKey": "Example",
  "sdItems": [3]
}


describe("Entity Base Testing", () => {
  let hostSdj,
    sampleDesc;

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
      const classObj = new SdjEntity();
    }).toThrowError();
    expect(() =>{
      const classObj = new SdjEntity({}, {});
    }).toThrowError();
    expect(() =>{
      const classObj = new SdjEntity(emptyEnt, {});
    }).toThrowError();

    const entity = new SdjEntity(emptyEnt, sampleDesc);
    expect(entity).toBeTruthy();

    expect(()=> {
      const badEnt = new SdjEntity(emptyButWrong, sampleDesc);
    }).toThrowError();

    hostSdj = SdjHost.getISdjHost();
    expect(hostSdj.descriptions.length).toBe(1);

    const sdjEntity = new SdjEntity(goodEntA, sampleDesc);
    expect(sdjEntity).toBeTruthy();

    const sdjEntityB = new SdjEntity(goodEntA);
    expect(sdjEntityB).toBeTruthy();

    expect(() => {
      const sdjEntityD = new SdjEntity(zeroEnt);
    }).toThrowError();

    expect(() => {
      const failCons = new SdjEntity(wrongEntA, sampleDesc);
    }).toThrowError();

    expect(() => {
      const failCons = new SdjEntity(wrongEntB, sampleDesc);
    }).toThrowError();

    expect(() => {
      const failCons = new SdjEntity(wrongEntC, sampleDesc);
    }).toThrowError();

    expect(() => {
      const failCons = new SdjEntity(wrongEntD, sampleDesc);
    }).toThrowError();
  });
});

describe("Entity Test set 1", () => {
  let hostSdj;

  afterEach(() => {
    SdjHost.setTestingInstance(undefined);
  })

  test("Test something", () => {
    expect(false).toBe(false);
  });
});

describe("Entity Test set 2", () => {
  let hostSdj;

  afterEach(() => {
    SdjHost.setTestingInstance(undefined);
  })

  test("Test something ELSE", () => {
    expect(false).toBe(false);
  });
});
