import {SdjHost, ESDJ_LOG} from "../dist/index.js";
import {expect, test, afterEach, beforeEach, describe} from "@jest/globals";

describe("Sdj Host / Global Testing / Dictionary", () => {
  let hostSdj;

  afterEach(() => {
    SdjHost.setTestingInstance(undefined);
  })

  test('SdjHost Initialization', () => {
    hostSdj = SdjHost.getISdjHost()
    expect(hostSdj.settings).toBeTruthy();
    expect(ESDJ_LOG.PROD).toBe(hostSdj.settings.logs.logMode);
  });

  test("Singleton Lockout Tests", () => {
    expect(() => {
      new SdjHost(undefined);
    }).toThrow();
    expect(() => {
      SdjHost(undefined);
    }).toThrow();
    expect(() => {
      SdjHost();
    }).toThrow();
    expect(() => {
      new SdjHost([]);
    }).toThrow();
    expect(() => {
      new SdjHost({});
    }).toThrow();
    expect(() => {
      new SdjHost(new IntSingletonLock());
    }).toThrow();
  });

  test('ISdjHost Errors - clear A', () => {
    expect(() => {
      let initial = SdjHost.getISdjHost();
      let second = SdjHost.getISdjHost({});
    }).toThrow();
  });

  test('Host Error - clear B', () => {
    expect(() => {
      let initial = SdjHost.getHost();
      let second = SdjHost.getISdjHost({});
    }).toThrow();
  });

});
