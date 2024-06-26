import {SdjDescription, SdjHost, SdjData, SdjEntity} from "../../dist/index.js";
import blankDesc from "../json/desc.only.json";
import {expect, test, afterEach, beforeEach, describe} from "@jest/globals";


const emptyEnt = {
  "sdId": 3,
  "sdKey": "Example",
  "sdItems": [3]
};

const emptyData = {
  "sdId": 3,
  "sdKey": "Example",
  "type": "something"
};

const wrongDataA = {
  "sdId": 0,
  "sdKey": "Example",
  "sdChildren": {}
};

const wrongDataB = {
  "sdId": 3,
  "sdKey": "Example",
  "sdChildren": [1,2,3]
};

const wrongDataC = {
  "sdId": 3,
  "sdKey": "Example",
  "sdInfo": "something"
};
const wrongDataD = {
  "sdId": -1,
  "sdKey": "Example",
};

const wrongDataE = {
  "sdId": {},
  "sdKey": "Example",

};

const wrongDataF = {
  "sdId": 3,
  "sdKey": "87Example",

};
const wrongDataG = {
  "sdId": 3,
  "sdKey": "Example",
  "sdInfo": []
};
const wrongDataH = {
  "sdId": 5,
  "sdKey": "Example",
  "%$%": "value"
};

const goodDataA = {
  "sdId": 3,
  "sdKey": "Example",
  "____" : "value"
}

const goodData = {
  "sdId": 3,
  "sdKey": "gooddata",
  "somevalue" : "value"
}

describe("Data Base Testing", () => {
  let hostSdj, sampDesc, sampleEntity;

  afterEach(() => {
    sampleEntity = undefined;
    sampDesc = undefined;
    hostSdj = undefined;
    SdjHost.setTestingInstance(undefined);
  })

  beforeEach(() => {
    hostSdj = SdjHost.getHost();
    sampDesc = new SdjDescription(blankDesc, hostSdj);
    sampleEntity = new SdjEntity(emptyEnt, sampDesc);
  })

  test("new() and error set", () => {
    expect(() =>{
      const classObj = new SdjData();
    }).toThrowError();

    expect(() =>{
      const classObj = new SdjData(sampleEntity);
    }).toThrowError();

    expect(() =>{
      const classObj = new SdjData(sampDesc);
    }).toThrowError();

    expect(() =>{
      const classObj = new SdjData({}, goodDataA);
    }).toThrowError();

    const entity = new SdjData(goodDataA, sampleEntity);
    expect(entity).toBeTruthy();

    const sdjDataity = new SdjData(goodDataA);
    expect(sdjDataity).toBeTruthy();
    expect(sdjDataity.path).toBe(goodDataA.sdKey)

  });

  test("item input error set 1", () => {
    expect(() => {
      const failCons = new SdjData(wrongDataA);
    }).toThrowError();

    expect(() => {
      const failCons = new SdjData(wrongDataB);
    }).toThrowError();

    expect(() => {
      const failCons = new SdjData(wrongDataC);
    }).toThrowError();

    expect(() => {
      const failCons = new SdjData(wrongDataD);
    }).toThrowError();
  });

  test("item input error set 2", () => {
    expect(() => {
      const failCons = new SdjData(wrongDataE, sampleEntity);
    }).toThrowError();

    expect(() => {
      const failCons = new SdjData(wrongDataF, sampleEntity);
    }).toThrowError();

    expect(() => {
      const failCons = new SdjData(wrongDataG, sampleEntity);
    }).toThrowError();

    expect(() => {
      const failCons = new SdjData(wrongDataH, sampleEntity);
    }).toThrowError();
  });

});

describe("Data Test set 1", () => {
  let hostSdj, sampDesc, sampleEntity;

  beforeEach(() => {
    hostSdj = SdjHost.getHost();
    sampDesc = new SdjDescription(blankDesc, hostSdj);
    sampleEntity = new SdjEntity(emptyEnt, sampDesc);
  })

  afterEach(() => {
    SdjHost.setTestingInstance(undefined);
    hostSdj = undefined;
  })

  test("Validate Test", () => {
    const rootSdj = new SdjData(goodData, sampleEntity),
        emptySdjData = new SdjData(goodDataA);

    expect(rootSdj.validateData()).toBe(true);
    expect(rootSdj.validateData(true)).toBe(true);

    expect(emptySdjData.validateData()).toBe(false);
    expect(() => {
      let checkVal = emptySdjData.validateData(true);
    }).toThrowError();

  });

  test("Simple Path", () => {
    const rootSdj = new SdjData(goodData, sampleEntity);
    const parentSdj = new SdjData(goodData, sampleEntity, rootSdj);
    const dataSdj = new SdjData(goodDataA, sampleEntity, parentSdj);

    expect(rootSdj.path).toBe(goodData.sdKey);
    expect(rootSdj.depth).toBe(0);
    expect(parentSdj.path).toBe(goodData.sdKey + "/" + goodData.sdKey);
    expect(parentSdj.depth).toBe(1);
    expect(dataSdj.path).toBe(rootSdj.sdKey + "/" + parentSdj.sdKey + "/" + dataSdj.sdKey);
    expect(dataSdj.depth).toBe(2);

    expect(dataSdj.genJI()).toMatchObject(goodDataA);
    expect(parentSdj.genJI()).toMatchObject(goodData);
    expect(rootSdj.genJI()).toMatchObject(goodData);
  });
});

describe("Data Test set 2", () => {
  let hostSdj;

  afterEach(() => {
    SdjHost.setTestingInstance(undefined);
  })

  test("Test something ELSE", () => {
    expect(false).toBe(false);
  });
});
