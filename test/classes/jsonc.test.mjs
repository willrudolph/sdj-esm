import {SdjHost, SdJson} from "../../dist/index.js";
import testA from "../json/sdj/test-file-a.json";
import {afterEach, beforeEach, describe, expect, test} from "@jest/globals";
import {cloneDeep} from "lodash-es";
import {SimpleSdjLexicon} from "../lexicons/simple.lex.js"
import {json} from "node:stream/consumers";

const accurateDesc = {
  "sdInfo": {
    "created": 1701390090598,
    "modified": 1701390090598,
    "name": "descName",
    "uniqId": "3rh28R-Qlbx4-i6Xy-gqB03MA"
  },
  "graph": [{
      "sdId": 1,
      "sdKey": "someEnt",
      "sdItems": [2]
    }],
  "items": [{
    "sdId": 2,
    "sdKey":"exampleItem",
    "type": "numb"
  }]
}


const emptyDescItemOnly = {
  "sdInfo": {
    "created": 1701390090598,
    "modified": 1701390090598,
    "name": "descName4234",
    "uniqId": "3rh28R-Qlbx4-i6Xy-gqB03MA"
  },
  "graph": [],
  "items": [{
    "sdId": 2,
    "sdKey":"exampleItem",
    "type": "numb"
  }]
};

const emptyDescEntityOnly = {
  "sdInfo": {
    "created": 1701390090598,
    "modified": 1701390090598,
    "name": "descName24332",
    "uniqId": "3rh28R-Qlbx4-i6Xy-gqB03MA"
  },
  "graph": [
    {
      "sdId": 1,
      "sdKey": "someEnt"
    }
  ],
  "items":[]
};

const blankWLexicon = {
  "sdInfo": {
    "created": 0,
    "modified": 0,
    "name": "descName144",
    "uniqId": "000000-00000-0000-0000000"
  },
  "lexicons":["simple"],
  "graph": [],
  "items": []
}

const badDescA = {
  "sdInfo": {
    "created": 0,
    "modified": 0,
    "name": "descName123412",
  },
  "graph": [],
  "items": []
}

const badDescB = {
  "sdInfo": {
    "created": 0,
    "modified": 0,
    "name": "descName12342",
    "uniqId": "000000-00000-0000-0000000"
  },
  "graph": [],
}

let badDescC = {
  "sdInfo": {
    "created": 0,
    "modified": 0,
    "name": "descName1234213",
    "uniqId": "000000-00000-0000-0000000"
  },
  "items": [],
};

let badDescD = {
  "sdInfo": {
    "created": 0,
    "modified": 0,
    "name": "descName1234",
    "uniqId": "000000-00000-0000-0000000"
  },
  "lexicons": ["dont", "know"],
  "items": [],
  "graph": [],
};

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

    const classDesB = new SdJson(testA);
    expect(classDesB).toBeTruthy();

  });

  test("Json Create with Good/Bad Descriptions", () => {
    const jsonInst = new SdJson(emptyDescItemOnly);
    expect(jsonInst).toBeTruthy();

    const secondItem = new SdJson(emptyDescEntityOnly);
    expect(secondItem).toBeTruthy();

    // Due to no Lexicon
    expect(() => {
      const test = new SdJson(blankWLexicon);
    }).toThrowError();

    expect(() => {
      const test = new SdJson(badDescA);
    }).toThrowError()

    expect(() => {
      const test = new SdJson(badDescB);
    }).toThrowError()

    expect(() => {
      const test = new SdJson(badDescC);
    }).toThrowError()

    expect(() => {
      const test = new SdJson(badDescD);
    }).toThrowError()

  });

  test("Blank Description w/Lexicon ", () => {
    let testLex = new SimpleSdjLexicon()
    hostSdj = SdjHost.getISdjHost({lexicons: [testLex]});
    const test = new SdJson(blankWLexicon);
    expect(test).toBeTruthy();

    expect(test.description.items.length).toBe(4);
    expect(test.description.graph.length).toBe(4);
    let newJI = test.genJI();
    expect(newJI.description.items.length).toBe(0);
    expect(newJI.description.graph.length).toBe(0);
    expect(newJI.description.lexicons).toMatchObject(blankWLexicon.lexicons);
  });

  test("Json create check w/Desc Only and Without data", () => {
    const tempTestDataClone = cloneDeep(testA);
    delete tempTestDataClone.data;
    const jsonInst = new SdJson(tempTestDataClone);

    expect(tempTestDataClone.data).toBeFalsy();
    expect(testA.data).toBeTruthy();
    expect(jsonInst).toBeTruthy();
    expect(jsonInst.genJI().data).toMatchObject([]);

    const jsInst2 = new SdJson(accurateDesc);
    expect(jsInst2).toBeTruthy();
    expect(jsInst2.description.genJI()).toMatchObject(accurateDesc);
  });

});

describe("Default Description Lock-out", () => {
  let hostSdj;

  beforeEach(() =>{
    hostSdj = SdjHost.getHost();
  })

  afterEach(() => {
    SdjHost.setTestingInstance(undefined);
  })

  test("Std Description lock", () => {
    const classDesA = new SdJson(testA);
    expect(classDesA.genJI()).toMatchObject(testA);

    expect(() => {
      classDesA.description.graph[0] = undefined;
    }).toThrowError();

    expect(() => {
      classDesA.description.items[0] = undefined;
    }).toThrowError();

    expect(() => {
      classDesA.description.graph = undefined;
    }).toThrowError();

    expect(() => {
      classDesA.description.items = undefined;
    }).toThrowError();

    expect(() => {
      classDesA.description.graph[0].sdKey = "bobo";
    }).toThrowError();

    expect(() => {
      classDesA.description.item[0].sdId = 15;
    }).toThrowError();

    expect(() => {
      classDesA.description.name = undefined;
    }).toThrowError();

    expect(() => {
      classDesA.description.sdInfo = undefined;
    }).toThrowError();

    expect(() => {
      classDesA.description.sdInfo.name = undefined;
    }).toThrowError();

    expect(() => {
      classDesA.description.sdInfo.uniqId = "undefined";
    }).toThrowError();

    expect(() => {
      classDesA.description.lang = "fr";
    }).toThrowError();

  });


  test("Std Lock/Unlock tests", () => {
    const jsonTest = new SdJson(testA);
    expect(jsonTest.genJI()).toMatchObject(testA);


    expect(() => {
      jsonTest.description.items.pop();
    }).toThrowError();

    jsonTest.lock(false);
    const itemsLen = jsonTest.description.items.length;

    const oldItem = jsonTest.description.items.pop();
    expect(jsonTest.description.items.length).toBe(itemsLen -1);

    expect(jsonTest.isValid).toBeFalsy();
    expect(() => {
      jsonTest.lock(true);
    }).toThrowError()

    jsonTest.description.items.push(oldItem);
    expect(jsonTest.isValid).toBeTruthy();
    jsonTest.lock(true);

  });
});


describe("Description Test set 1a", () => {
  let hostSdj;

  afterEach(() => {
    SdjHost.setTestingInstance(undefined);
  })

  test("Test something", () => {
    const initial = new SdJson(testA);
    let ref, testClone;
    expect(initial).toBeTruthy();
    expect(initial.genJI()).toMatchObject(testA);

    testClone = cloneDeep(testA);
    testClone.description.lang = "";

    ref = new SdJson(testClone);
    expect(ref.description.lang).toBe("en");

    testClone.lang = "asdfasdga";
    expect(() =>{
      ref = new SdJson(testClone);
    }).toThrowError();

    testClone.lang = "EN";
    ref = new SdJson(testClone);

    expect(() => {
      ref.lang = "Baballea"
    }).toThrowError();

    ref.$lang = "asdfasdga";
    expect(ref.lang).toBe("en");

    ref.$lang = "fr";
    expect(ref.lang).toBe("fr");

    expect(ref.lang).toBe("fr");

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
