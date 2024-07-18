import {blankDescriptionJI, blankJsonJI, isInfo, newInfoJI, SdjHost, SdJson} from "../dist/index.js";
import {afterEach, beforeEach, describe, expect, test} from "@jest/globals";
import sdjEmptyGoodJson from "./json/sdj-empty-good.json";
import emptyJson from "./json/empty.json";
import wrong0 from "./json/wrong/wrong-0.json";
import wrong1 from "./json/wrong/wrong-1.json";
import wrong2 from "./json/wrong/wrong-2.json";
import sdjAlmost from "./json/sdj-almost-0.json";

import testA from "./json/sdj/test-file-a.json";
import badTestA from "./json/sdj/test-bad-a.json";
import entityTestA from "./json/entity-test-a.json";
//import {extLexicon} from "../node/lexicons/other.quick.lex.js";
import {SimpleSdjLexicon} from "../local/node/lexicons/simple.lex.js";
import simpleJI from "../test/json/sdj/example-simple-lex.json";

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

  test("Simple SdIndexed Table", () => {
    const sdjClass = new SdJson(entityTestA);
    expect(sdjClass).toBeTruthy();

    const genOut = sdjClass.genJI();
    const reGen = new SdJson(genOut);

    expect(reGen.genJI()).toMatchObject(genOut);
  });

  test("Simple Entity Searches", () => {
    const sdj = new SdJson(testA);
    expect(sdj).toBeTruthy();

    const search01 = sdj.dataByEntity({sdId: 3})
    expect(search01.length).toBe(9);
    const search02 = sdj.dataByEntity({sdKey: "article"})
    expect(search02.length).toBe(9);
    const search03 = sdj.dataByEntity({sdId: 2})
    expect(search03.length).toBe(3);
    const search04 = sdj.dataByEntity({sdKey: "page"})
    expect(search04.length).toBe(3);
    const search05 = sdj.dataByEntity({sdId: 1})
    expect(search05.length).toBe(1);
    const search06 = sdj.dataByEntity({sdKey: "folder"})
    expect(search06.length).toBe(1);
    const search07 = sdj.dataByEntity({childIds: [3]})
    expect(search07.length).toBe(3);
    const search08 = sdj.dataByEntity({parentIds: [0]})
    expect(search08.length).toBe(4);
    const searchA = sdj.dataByEntity({sdItems: [1]});
    expect(searchA.length).toBe(13);

  });

  test("Entity SdProps Searches", () => {
    const hostSdj = SdjHost.getISdjHost({lexicons: [new SimpleSdjLexicon()]});
    const sdj = new SdJson(simpleJI);
    expect(sdj).toBeTruthy();
    const search01 = sdj.dataByEntity({sdProps:{route: false}});
    expect(search01.length).toBe(26);
    const search02 = sdj.dataByEntity({sdProps:{route: false}, checkData: true});
    expect(search02.length).toBe(0);
    const search03 = sdj.dataByEntity({sdProps:{route: true}});
    expect(search03.length).toBe(8);
    const search04 = sdj.dataByEntity({sdProps:{route: true}, checkData: true});
    expect(search04.length).toBe(0);
    const search05 = sdj.dataByEntity({sdProps:{route: true, comp: false}});
    expect(search05.length).toBe(0);
    const search06 = sdj.dataByEntity({sdProps:{route: true, comp: true}});
    expect(search06.length).toBe(8);
    const search07 = sdj.dataByEntity({sdProps:{route: false, comp: false}});
    expect(search07.length).toBe(23);
    const search08 = sdj.dataByEntity({sdProps:{route: true, comp: false}, checkData: true});
    expect(search08.length).toBe(0);
    const search09 = sdj.dataByEntity({sdProps:{route: false, comp: false}, checkData: true});
    expect(search09.length).toBe(23);
    const search10 = sdj.dataByEntity({sdProps:{route: false, comp: true}, checkData: true});
    expect(search10.length).toBe(3);
  });


  test("Bad Searches", () => {
    const sdj = new SdJson(testA);
    expect(sdj).toBeTruthy();
    const search01 = sdj.dataByEntity({})
    expect(search01.length).toBe(0);
    const search02 = sdj.dataByEntity({sdKedfasy: "article"})
    expect(search02.length).toBe(0);
    const search03 = sdj.dataByEntity({sdId: -1})
    expect(search03.length).toBe(0);
    const search04 = sdj.dataByEntity({limiter: "0"})
    expect(search04.length).toBe(0);
    const search05 = sdj.dataByEntity(() => {});
    expect(search05.length).toBe(0);
    const search06 = sdj.dataByEntity([])
    expect(search06.length).toBe(0);
    const search07 = sdj.dataByEntity({type: 3})
    expect(search07.length).toBe(0);
    const search08 = sdj.dataByEntity({type: "bob"})
    expect(search08.length).toBe(0);
    const search09 = sdj.dataByEntity({sdId: "numb"})
    expect(search09.length).toBe(0);
  });

  test("Simple Item Searches", () => {
    const sdj = new SdJson(testA);
    expect(sdj).toBeTruthy();

    const search01 = sdj.dataByItem({sdId: 2})
    expect(search01.length).toBe(13);
    const search02 = sdj.dataByItem({sdKey: "title"})
    expect(search02.length).toBe(13);
    const search03 = sdj.dataByItem({sdId: 3})
    expect(search03.length).toBe(13);
/*    const search04 = sdj.dataByItem({sdKey: "htmlText"})
    expect(search04.length).toBe(0);
    const search05 = sdj.dataByItem({sdId: 1});
    expect(search05.length).toBe(13);
    const search06 = sdj.dataByItem({sdId: 2})
    expect(search06.length).toBe(13);
    const search07 = sdj.dataByItem({type: "strl"})
    expect(search07.length).toBe(0);
    const search08 = sdj.dataByItem({type: "title"})
    expect(search08.length).toBe(0);
    const search09 = sdj.dataByItem({type: "strl"})
    expect(search09.length).toBe(0);*/
  });

  test("Bad Item Searches", () => {
    const sdj = new SdJson(testA);
    expect(sdj).toBeTruthy();

/*    const search01 = sdj.dataByItem()
    expect(search01.length).toBe(9);
    const search02 = sdj.dataByItem({sdKey: "article"})
    expect(search02.length).toBe(9);
    const search03 = sdj.dataByItem({sdId: 2})
    expect(search03.length).toBe(3);
    const search04 = sdj.dataByItem({sdKey: "page"})
    expect(search04.length).toBe(3);*/


  });

});
