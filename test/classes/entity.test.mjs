import {SdjHost, SdjEntity, SdjDescription, SdJson, ESDJ_LIMIT} from "../../dist/index.js";
import blankDesc from "../json/desc.only.json";
import {expect, test, afterEach, beforeEach, describe} from "@jest/globals";
import testa from "../json/entity-test-a.json";
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

  test("Entity good Create", () => {
    const entJI = {
      sdKey: "basicEnt",
      sdId: 1,
      extendIds: [2]
    }

    let ent = new SdjEntity(entJI)
    expect(ent).toBeTruthy();
  });
  test("Limiter Tests Alpha", () => {
    // Bad - parnent id, if present required to be 0
    const entJIA = {
      sdKey: "basicEntA",
      sdId: 1,
      limiter: ESDJ_LIMIT.KEY_IDX,
      sdItems: [3],
      parentIds: [2],
    };
    // Bad - No child ids for sdIndexed
    const entJIB = {
      sdKey: "basicEntB",
      sdId: 1,
      limiter: ESDJ_LIMIT.KEY_IDX,
      sdItems: [3],
      parentIds: [0],
    };
    // Bad - pointless entity, does not extend nor has sdItems
    const entJIC = {
      sdKey: "basicEntC",
      sdId: 1,
    };

    let ent;
    expect(() => {
      ent = new SdjEntity(entJIA)
    }).toThrowError();
    expect(() => {
      ent = new SdjEntity(entJIB)
    }).toThrowError();
    expect(() => {
      ent = new SdjEntity(entJIC)
    }).toThrowError();
  });
});

describe("Entity SdIndex Test 1", () => {
  let hostSdj;

  afterEach(() => {
    SdjHost.setTestingInstance(undefined);
  })

  test("Test something ELSE", () => {
    let sdJ = new SdJson(testa);

    expect(sdJ).toBeTruthy();

  });
  test("Test something ELSE", () => {
    expect(false).toBe(false);
  });
  test("Test something ELSE", () => {
    expect(false).toBe(false);
  });
  test("Test something ELSE", () => {
    expect(false).toBe(false);
  });
  test("Test something ELSE", () => {
    expect(false).toBe(false);
  });
});
