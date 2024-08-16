import {getRegEx, newInfoJI, UUID} from "../dist/index.js";
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
    expect(getRegEx("fileName").test("somet-some.txt")).toBeTruthy();
    expect(getRegEx("fileName").test("something.json")).toBeTruthy();
    expect(getRegEx("fileName").test("somet.fdo")).toBeTruthy();
    expect(getRegEx("fileName").test("someth.asd")).toBeTruthy();
  })
});
