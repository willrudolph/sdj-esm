import {isInfo, blankJsonJI, blankDescriptionJI, newInfoJI, ESDJ_LOG, SdjHost, SdJson} from "../dist/index.js";
import {expect, test, afterEach, beforeEach, describe} from "@jest/globals";
import sdjEmptyGoodJson from "./json/sdj-empty-good.json";
import emptyJson from "./json/empty.json";
import wrong0 from "./json/wrong/wrong-0.json";
import wrong1 from "./json/wrong/wrong-1.json";
import wrong2 from "./json/wrong/wrong-2.json";
import sdjAlmost from "./json/sdj-almost-0.json";

import testA from "./json/sdj/test-file-a.json";
import badTestA from "./json/sdj/test-bad-a.json";
//import testC from "./json/sdj/test-file-c.json";

describe("SdjJson Init and Setup", () => {
  afterEach(() => {
    SdjHost.setTestingInstance(undefined);
  });

  test('create new empty sdjJson', () => {
    let host = SdjHost.getISdjHost(),
      sdJsonJI = blankJsonJI("descName", "fileName"),
      sdjClass;

    expect(sdJsonJI.sdInfo).toMatchObject({})
    expect(isInfo(sdJsonJI.sdInfo)).toBeTruthy();
    sdjClass = new SdJson(sdJsonJI);
    expect(sdJsonJI).toBeTruthy();
    expect(sdjClass).toBeTruthy();
  });


  test('emptyGoodJson === exportJsonJI ', () => {
    let host = SdjHost.getISdjHost();
    let sdjClass = new SdJson(sdjEmptyGoodJson);
    expect(sdjEmptyGoodJson.$id).toBe(sdjClass.genJI().$id);
    expect(sdjEmptyGoodJson).toMatchObject(sdjClass.genJI());
  });

  test("blocks attempts to use bad json files", () => {
    let goodDesc = blankDescriptionJI("descName"),
      goodsdInfo = newInfoJI("jsonName"),
      goodJson = blankJsonJI("jsonName", "descName");

    expect(goodDesc.sdInfo.name).toBe(goodJson.description.sdInfo.name);
    expect(goodsdInfo.name).toBe("jsonName");
    expect(goodJson.sdInfo.name).toBe("jsonName");

    expect(() => {
      let sdjClass = new SdJson({});
    }).toThrow();
    expect(() => {
      let sdjClass = new SdJson({$id:"anythingelse", description: goodDesc, sdInfo: goodsdInfo, data: []});
    }).toThrow();
    expect(() => {
      let sdjClass = new SdJson({$id:"http://willrudolph.com/schemas/sdj-schema.json", description: {}, sdInfo: goodsdInfo, data: []});
    }).toThrow();
    expect(() => {
      let sdjClass = new SdJson({$id:"http://willrudolph.com/schemas/sdj-schema.json", sdInfo: goodsdInfo, data: []});
    }).toThrow();
    expect(() => {
      let sdjClass = new SdJson({$id:"http://willrudolph.com/schemas/sdj-schema.json", description: goodDesc, sdInfo: {}, data: []});
    }).toThrow();
    expect(() => {
      let sdjClass = new SdJson({$id:"http://willrudolph.com/schemas/sdj-schema.json", description: goodDesc, data: []});
    }).toThrow();

  });
  test("Good files bad/blank data, filled in", () => {
    let goodDesc = blankDescriptionJI("descName"),
        goodsdInfo = newInfoJI("jsonName");
    let sdjClassA = new SdJson({$id:"http://willrudolph.com/schemas/sdj-schema.json", description: goodDesc, sdInfo: goodsdInfo, data: {}});
    expect(sdjClassA).toBeTruthy();
    expect(sdjClassA.data).toEqual([]);
    goodDesc.sdInfo.name += "_B";
    let sdjClassB = new SdJson({$id:"http://willrudolph.com/schemas/sdj-schema.json", description: goodDesc, sdInfo: goodsdInfo, data: false});
    expect(sdjClassB).toBeTruthy();
    expect(sdjClassB.data).toEqual([]);
    goodDesc.sdInfo.name += "_C";
    let sdjClassC = new SdJson({$id:"http://willrudolph.com/schemas/sdj-schema.json", description: goodDesc, sdInfo: goodsdInfo, data: null});
    expect(sdjClassC).toBeTruthy();
    expect(sdjClassC.data).toEqual([]);
    goodDesc.sdInfo.name += "_D";
    let sdjClassD = new SdJson({$id:"http://willrudolph.com/schemas/sdj-schema.json", description: goodDesc, sdInfo: goodsdInfo, data: -21});
    expect(sdjClassD).toBeTruthy();
    expect(sdjClassD.data).toEqual([]);
    goodDesc.sdInfo.name += "_E";
    let sdjClassE = new SdJson({$id:"http://willrudolph.com/schemas/sdj-schema.json", description: goodDesc, sdInfo: goodsdInfo});
    expect(sdjClassE).toBeTruthy();
    expect(sdjClassE.data).toEqual([]);

  });
});

describe("import json testing", () => {
  beforeEach(() => {
    SdjHost.setTestingInstance(undefined);
  })
  test("wrong json files", () => {
    expect(() => {
      let sdjClass = new SdJson(emptyJson);
    }).toThrow();
    expect(() => {
      let sdjClass = new SdJson(wrong0);
    }).toThrow();
    expect(() => {
      let sdjClass = new SdJson(wrong1);
    }).toThrow();
    expect(() => {
      let sdjClass = new SdJson(wrong2);
    }).toThrow();
    expect(() => {
      let sdjClass = new SdJson(sdjAlmost);
    }).toThrow();

    expect(() =>{
      let sdjClass = new Sdjson(badTestA);
    }).toThrow();
  });

  test("good empty and standard files", () => {
    const sdjClass = new SdJson(sdjEmptyGoodJson);
    expect(sdjClass).toBeTruthy();

    const sdjClassA = new SdJson(testA);
    expect(sdjClassA).toBeTruthy();

    const genOut = sdjClassA.genJI();
    const reGen = new SdJson(genOut);

    expect(reGen.genJI()).toMatchObject(genOut);
  });
});
