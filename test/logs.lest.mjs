import {ESDJ_LOG, SdjHost} from "../dist/index.js";
import {afterEach, describe, expect, test} from "@jest/globals";

// This file is renamed (to log.lest.js) in the repository for its propensity for throwing console log statements
//
// Rename to log.test.js to actually test this; which is on the list of pre-check for publishing to run this test.


describe("Sdj Logging - throws console.logs", () => {
  let hostSdj;

  afterEach(() => {
    SdjHost.setTestingInstance(undefined);
  })

  test("Confirm Mock", () => {
    hostSdj = SdjHost.getISdjHost({options:{logMode: ESDJ_LOG.DEV}});
    expect(hostSdj.logs.logMode).toBe(ESDJ_LOG.DEV);
    SdjHost.setTestingInstance(undefined);
    hostSdj = SdjHost.getISdjHost();
    expect(hostSdj.logs.logMode).toBe(ESDJ_LOG.PROD);
    expect(hostSdj.logs.consoleLvl).toBe(0);
    SdjHost.setTestingInstance(undefined);
    hostSdj = SdjHost.getISdjHost({options:{logMode: ESDJ_LOG.DEV}});
    expect(hostSdj.logs.logMode).toBe(ESDJ_LOG.DEV);
    expect(hostSdj.logs.consoleLvl).toBe(5);
    SdjHost.setTestingInstance(undefined);
    hostSdj = SdjHost.getISdjHost({options:{logMode: ESDJ_LOG.LIB}});
    expect(hostSdj.logs.logMode).toBe(ESDJ_LOG.LIB);
    expect(hostSdj.logs.consoleLvl).toBe(3);
    expect(() => {
      hostSdj = SdjHost.getISdjHost({options:{logMode: ESDJ_LOG.DEV}});
    }).toThrow();
    SdjHost.setTestingInstance(undefined);
  });


  test("Logger init setup/redirect", () => {
    let host;
    const localLoggerStore = [];
    expect(() => {
      host = SdjHost.getISdjHost({options: {loggerStore: [], logManager: {}}})
    }).toThrow();
    SdjHost.setTestingInstance(undefined);
    host = SdjHost.getISdjHost();
    expect(host.logs.loggerStore === []).toBeFalsy();

    SdjHost.setTestingInstance(undefined);
    host = SdjHost.getISdjHost({options: {loggerStore: localLoggerStore}});
    expect(localLoggerStore[0].fileName).toBe("ISdjHost");


    SdjHost.setTestingInstance(undefined);
    const emptyLM = {}
    expect(() => {
      host = SdjHost.getISdjHost({options: {logManager: emptyLM}});
    }).toThrow();

    SdjHost.setTestingInstance(undefined);
    const badLogMan = {
      storeLvl: 99,
      consoleLvl: 99,
      maxLogs: 99,
      getLogFunc: "bob"
    }
    expect(() => {
      host = SdjHost.getISdjHost({options: {logManager: badLogMan}});
    }).toThrow();

    SdjHost.setTestingInstance(undefined);

    // Example of a complete kill/clearing of the logs
    const newLogMan = {
      storeLvl: 99,
      consoleLvl: 99,
      maxLogs: 99,
      getLogFunc: (name) => {
        const logName = name;
        return (msg, num) => {}
      }
    }

    host = SdjHost.getISdjHost({options: {logManager: newLogMan}});
    expect(host.logs.storeLvl).toBe(newLogMan.storeLvl);
    expect(host.logs.consoleLvl).toBe(newLogMan.consoleLvl);
    expect(host.logs.maxLogs).toBe(newLogMan.maxLogs);

  });

});
