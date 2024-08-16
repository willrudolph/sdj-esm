import testA from "../json/sdj/test-file-a.json";
import testB from "../json/sdj/test-file-b.json";
import {afterEach, describe, expect, test} from "@jest/globals";
import {SdjHost, SdJson} from "../../dist/index.js";

describe("SdjData Test Suite - Small File Testing", () => {
    let testJson, dataObj, betaObj;
    afterEach(() => {
        SdjHost.setTestingInstance(undefined);
    })

    test("Initial confirmations", () => {
        testJson = new SdJson(testA);
        expect(testJson).toBeTruthy();
        dataObj = testJson.dataByPath(testA.data[0].sdKey);
        expect(dataObj).toBeTruthy();
        expect(dataObj.sdKey).toBe(testA.data[0].sdKey);
        expect(dataObj.sdChildren.length).toBe(3);
        expect(dataObj.sdChildren[0].$sdIndex).toBe(0);
        expect(dataObj.sdChildren[1].$sdIndex).toBe(1);
        expect(dataObj.sdChildren[2].$sdIndex).toBe(2);
        betaObj = testJson.dataByPath("home.home_page1");
        expect(betaObj).toBeTruthy();
        expect(betaObj.sdKey).toBe("home_page1");
        expect(betaObj.sdChildren.length).toBe(3);
        expect(betaObj.sdChildren[0].$sdIndex).toBe(0);
        expect(betaObj.sdChildren[1].$sdIndex).toBe(1);
        expect(betaObj.sdChildren[2].$sdIndex).toBe(2);
        expect(testJson.description.genJI()).toMatchObject(testA.description);
        expect(dataObj.genJI(true)).toMatchObject(testA.data[0]);
        expect(betaObj.genJI(true)).toMatchObject(testA.data[0].sdChildren[0]);
        expect(testJson.genJI(true)).toMatchObject(testA);
        const cleanNew = testJson.genJI();
        SdjHost.setTestingInstance(undefined);
        const outJI = new SdJson(cleanNew);
        expect(outJI.genJI()).toMatchObject(testA);
    });

    test("Test-File B",() => {
        testJson = new SdJson(testB);
        expect(testJson).toBeTruthy();
        expect(testJson.genJI()).toMatchObject(testB);
    });
});
