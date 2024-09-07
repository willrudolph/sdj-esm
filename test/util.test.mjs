import {getRegEx, newInfoJI, UUID, validIntArray} from "../dist/index.js";
import {describe, expect, test} from "@jest/globals";
import {isString} from "lodash-es";


describe("Util Tests", () => {
  test("generator tests", () => {
    const newInfo = newInfoJI("temp");
    expect(newInfo).toMatchObject({
      name: "temp",
      uniqId: newInfo.uniqId,
      created: newInfo.created,
      modified: newInfo.modified
    })
    expect(newInfoJI("value")).toBeTruthy();
  });


  test('Valid UUIDs', () => {
    const uuidComp = UUID.GetCompress(),
      uuid = UUID.GetNew();

    expect(UUID.ValidData(UUID.GetEmpty(true))).toBe(true);
    expect(UUID.Valid(UUID.GetEmpty())).toBe(true);

    expect(UUID.ValidData(uuidComp)).toBe(true);
    expect(UUID.Valid(uuid)).toBe(true);

  });
  // Recheck isString from Lodash on removal of custom isString
  test('Lodash isString Re-Check', () => {
    expect(isString()).toBe(false);
    expect(isString(null)).toBe(false);
    expect(isString({})).toBe(false);
    expect(isString([])).toBe(false);
    expect(isString(undefined)).toBe(false);
    expect(isString(true)).toBe(false);
    expect(isString(false)).toBe(false);
    expect(isString(0)).toBe(false);
    expect(isString(-1)).toBe(false);
    expect(isString(() => {})).toBe(false);
    expect(isString(new Date())).toBe(false);
    expect(isString(/a/g)).toBe(false);
    expect(isString(new RegExp("a", "g"))).toBe(false);
    expect(isString(Object(5))).toBe(false);
    expect(isString(NaN)).toBe(false);
    expect(isString(Infinity)).toBe(false);

    let fakeString = {
      toString: function () { return "7"},
      valueOf: function () {return "42"}
    }
    fakeString[Symbol.toStringTag] = "String";

    expect(isString(fakeString)).toBe(false);

    expect(isString("foo")).toBe(true);
    expect(isString(Object("bob"))).toBe(true);
    expect(isString("")).toBe(true);

  });

  test("regEx Filename", () => {
    expect(getRegEx("fileName").test(".hidden")).toBeFalsy();
    expect(getRegEx("fileName").test(".*")).toBeFalsy();
    expect(getRegEx("fileName").test("///")).toBeFalsy();
    expect(getRegEx("fileName").test("[{}c.hid")).toBeFalsy();
    expect(getRegEx("fileName").test("*/*")).toBeFalsy();
    expect(getRegEx("fileName").test("543.*")).toBeFalsy();
    expect(getRegEx("fileName").test("fgds./")).toBeFalsy();
    expect(getRegEx("fileName").test("something.?")).toBeFalsy();

    expect(getRegEx("fileName").test("some.name.ts")).toBeTruthy();
    expect(getRegEx("fileName").test("something.a")).toBeTruthy();
    expect(getRegEx("fileName").test("Aomeasdfa3124t-some.txt")).toBeTruthy();
    expect(getRegEx("fileName").test("something.json")).toBeTruthy();
    expect(getRegEx("fileName").test("Comet.fdo")).toBeTruthy();
    expect(getRegEx("fileName").test("1234123sodsfameth.asd")).toBeTruthy();
  })

  test("validIntArray", () => {
    expect(validIntArray([0])).toBeTruthy();
    expect(validIntArray([0,3,1])).toBeTruthy();
    expect(validIntArray([1,2,3,1])).toBeTruthy();
    expect(validIntArray([1,2,3,2,1])).toBeTruthy();

    expect(validIntArray([])).toBeFalsy();
    expect(validIntArray([-2])).toBeFalsy();
    expect(validIntArray([2.312])).toBeFalsy();
    expect(validIntArray(["Dfds"])).toBeFalsy();
    expect(validIntArray([.334])).toBeFalsy();
    expect(validIntArray([undefined])).toBeFalsy();

    expect(validIntArray([true])).toBeFalsy();
    expect(validIntArray([null])).toBeFalsy();
    expect(validIntArray([false])).toBeFalsy();

    expect(validIntArray("")).toBeFalsy();
    expect(validIntArray(false)).toBeFalsy();
    expect(validIntArray(0)).toBeFalsy();
    expect(validIntArray({})).toBeFalsy();
    expect(validIntArray(undefined)).toBeFalsy();
  });
  
  test("regEx Lang", () => {

    expect(getRegEx("lang").test(undefined)).toBeFalsy();
    expect(getRegEx("lang").test([])).toBeFalsy();
    expect(getRegEx("lang").test(32)).toBeFalsy();
    expect(getRegEx("lang").test({})).toBeFalsy();
    expect(getRegEx("lang").test("something.?")).toBeFalsy()
    expect(getRegEx("lang").test("asdfa")).toBeFalsy();
    expect(getRegEx("lang").test("$$")).toBeFalsy()
    expect(getRegEx("lang").test("3_")).toBeFalsy();
    expect(getRegEx("lang").test("3-")).toBeFalsy();
    expect(getRegEx("lang").test("")).toBeFalsy()
    
    expect(getRegEx("lang").test("fr")).toBeTruthy();
    expect(getRegEx("lang").test("es")).toBeTruthy();
    expect(getRegEx("lang").test("RT")).toBeTruthy();
    expect(getRegEx("lang").test("SOM")).toBeTruthy();
    expect(getRegEx("lang").test("ed")).toBeTruthy();
    expect(getRegEx("lang").test("dCs")).toBeTruthy();
    
    
  })
});
