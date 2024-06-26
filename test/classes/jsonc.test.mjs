import {SdjHost, SdjDescription, SdJson} from "../../dist/index.js";
import testA from "../json/sdj/test-file-a.json";
import {expect, test, afterEach, beforeEach, describe} from "@jest/globals";
import {cloneDeep} from "lodash-es";

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
    "created": 0,
    "modified": 0,
    "name": "descName",
    "uniqId": "000000-00000-0000-0000000"
  },
  "graph": [],
  "items": []
}
let badDescA = {};

describe("Json Class Base Testing", () => {
  let hostSdj;

  afterEach(() => {
    hostSdj = undefined;
    SdjHost.setTestingInstance(undefined);
  })

  test("create errors", () => {
    expect(() =>{
      const classObj = new SdJson({});
    }).toThrowError();
    expect(() =>{
      const classObj = new SdJson([]);
    }).toThrowError();
    expect(() =>{
      const classObj = new SdJson(11);
    }).toThrowError();
    expect(() =>{
      const classObj = new SdJson("DSs");
    }).toThrowError();
    expect(() =>{
      const classObj = new SdJson({data:[]});
    }).toThrowError();
    expect(() =>{
      const classObj = new SdJson({description:{}});
    }).toThrowError();
  });

  test("new() and dup check, simple bad checks", () => {
    expect(() =>{
      const classObj = new SdJson();
    }).toThrowError();

    const classDesA = new SdJson(testA);
    expect(classDesA).toBeTruthy();
    hostSdj = SdjHost.getISdjHost();
    expect(hostSdj.descriptions.length).toBe(1);

    const classDesB = new SdJson(testA);
    expect(classDesB).toBeTruthy();
    expect(hostSdj.descriptions.length).toBe(1);
    expect(hostSdj.descriptions[0].sdInfo.name).toBe(testA.description.sdInfo.name);

  });

  test("Json create check w/Desc Only and Without data", () => {
    const tempTestDataClone = cloneDeep(testA);
    delete tempTestDataClone.data;
    const jsonInst = new SdJson(tempTestDataClone);

    expect(tempTestDataClone.data).toBeFalsy();
    expect(testA.data).toBeTruthy();
    expect(jsonInst).toBeTruthy();
    expect(jsonInst.genJI().data).toMatchObject([]);

    const jsInst2 = new SdJson(emptyDesc);
    expect(jsInst2).toBeTruthy();
    expect(jsInst2.description.genJI()).toMatchObject(emptyDesc);
  });

});

describe("Description Test set 1a", () => {
  let hostSdj;

  afterEach(() => {
    SdjHost.setTestingInstance(undefined);
  })

  test("Test something", () => {
    const classDesA = new SdJson(testA);
    expect(classDesA.genJI()).toMatchObject(testA);
  });
});

describe("Description Test set 2", () => {
  let hostSdj;

  afterEach(() => {
    SdjHost.setTestingInstance(undefined);
  })

  test("Test something ELSE", () => {
  });
});
