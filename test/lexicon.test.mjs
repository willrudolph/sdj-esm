import {SdjHost, SdJson} from "../dist/index.js";
import {beforeEach, describe, expect, test} from "@jest/globals";
import angLexStdJson from "./json/sdj/test-min-ang-lex.json";
import angLexEmpJson from "./json/sdj/test-min-ang-lex-empty.json";
import simpleLexJson from "./json/sdj/example-simple-lex.json";
import {cloneDeep} from "lodash-es";
import {SimpleSdjLexicon} from "./lexicons/simple.lex.js";

let lexicon = {
	name: "min-ang"
};

lexicon.items = [{
	sdKey: "routeTitle",
	sdId: 2,
	type: "strd"
}, {
	sdKey: "compClassName",
	sdId: 3,
	type: "strd",
	limiter: "req"
}, {
	sdKey: "arrayStr",
	sdId: 4,
	type: "arystrs"
}, {
	sdKey: "objNums",
	sdId: 5,
	type: "objnum"
}, {
	sdKey: "title",
	sdId: 6,
	type: "strd"
}];

lexicon.entities = [{
		sdKey: "comp",
		sdId: 1,
		sdProps: {
			route: false,
			comp: true
		},
		parentIds: [0, 1, 2],
		childIds: [1, 3],
		sdItems: [3]
	},
	{
		sdKey: "route-comp",
		sdId: 2,
		extendIds: [1],
		sdProps: {
			route: true
		},
		parentIds: [0, 2],
		sdItems: [2],
		childIds: [1, 2, 3]
	},
	{
		sdKey: "data-obj",
		sdId: 3,
		sdProps: {
			route: false,
			comp: false
		},
		parentIds: [0, 1, 2, 3],
		sdItems: [4, 5, 6],
		childIds: [3],
	}];

describe("Lexicon Initial Tests", ()=> {

	beforeEach(() => {
		SdjHost.setTestingInstance(undefined);
	});

	test("create a simple lexicon", () => {
		let lexicon, host;

		lexicon = {
			name: "angsdj",
			items: [],
			entities: []
		};
		host = SdjHost.getISdjHost({lexicons: [lexicon]});
		expect(host).toBeTruthy();
		expect(host.lexiconMgr.names).toMatchObject(["angsdj"]);
		SdjHost.setTestingInstance(undefined);


		lexicon = {
			name: "angsdj",
			items: [],
			graphVerify: () => false
		};
		host = SdjHost.getISdjHost({lexicons: [lexicon]});
		expect(host).toBeTruthy();
		expect(host.lexiconMgr.names).toMatchObject(["angsdj"]);
		SdjHost.setTestingInstance(undefined);

		lexicon = {
			name: "angsdj",
			items: [],
			required: ["valuea","valueb"]
		};
		host = SdjHost.getISdjHost({lexicons: [lexicon]});
		expect(host).toBeTruthy();
		expect(host.lexiconMgr.names).toMatchObject(["angsdj"]);
		expect(host.lexiconMgr.getValidator("aname")).toBeTruthy();
		SdjHost.setTestingInstance(undefined);

		const lexiconB = {
			name: "ang-other",
			items: [],
			entities: [],
			graphVerify: () => false,
			required: ["valuea","valueb"]
		};
		host = SdjHost.getISdjHost({lexicons: [lexiconB]});
		expect(host).toBeTruthy();
		SdjHost.setTestingInstance(undefined);

		const lexiconC = {
			name: "angsdj",
			items: [],
			graphVerify: () => false
		};
		host = SdjHost.getISdjHost({lexicons: [lexiconC]});
		expect(host).toBeTruthy();
		expect(host.lexiconMgr.names).toMatchObject(["angsdj"]);

		expect(() => {
			host = SdjHost.getISdjHost({lexicons: [lexicon]});
		}).toThrowError();

		SdjHost.setTestingInstance(undefined);
		expect(() => {
			host = SdjHost.getISdjHost({lexicons: [lexicon, lexiconC]});
		}).toThrowError();

		SdjHost.setTestingInstance(undefined);
		host = SdjHost.getISdjHost({lexicons: [lexiconB, lexiconC]});
		expect(host).toBeTruthy();
		expect(host.lexiconMgr.names).toMatchObject(["ang-other", "angsdj"]);

	});

	test("test bad lexicons", () => {
		let host, lexicon;

		host = SdjHost.getISdjHost({lexicons: []});
		expect(host).toBeTruthy();
		SdjHost.setTestingInstance(undefined);


		expect(() =>{
			host = SdjHost.getISdjHost({lexicons: [{},{}]});
		}).toThrowError();
		SdjHost.setTestingInstance(undefined);

		expect(() =>{
			host = SdjHost.getISdjHost({lexicons: [{}]});
		}).toThrowError();
		SdjHost.setTestingInstance(undefined);


		lexicon = {
			name: "sOmET-romething"
		};
		expect(() =>{
			host = SdjHost.getISdjHost({lexicons: [lexicon]});
		}).toThrowError();
		SdjHost.setTestingInstance(undefined);

		lexicon = {
			name: "something"
		};
		expect(() =>{
			host = SdjHost.getISdjHost({lexicons: [lexicon]});
		}).toThrowError();
		SdjHost.setTestingInstance(undefined);

		lexicon = {
			name: "234132"
		};
		expect(() =>{
			host = SdjHost.getISdjHost({lexicons: [lexicon]});
		}).toThrowError();
		SdjHost.setTestingInstance(undefined);

		lexicon = {
			name: []
		};
		expect(() =>{
			host = SdjHost.getISdjHost({lexicons: [lexicon]});
		}).toThrowError();
		SdjHost.setTestingInstance(undefined);

		lexicon = {
			name: {}
		};
		expect(() => {
			host = SdjHost.getISdjHost({lexicons: [lexicon]});
		}).toThrowError();
		SdjHost.setTestingInstance(undefined);

		lexicon = {
			name: "bob1",
			items: {}
		};
		expect(() =>{
			host = SdjHost.getISdjHost({lexicons: [lexicon]});
		}).toThrowError();
		SdjHost.setTestingInstance(undefined);

		lexicon = {
			name: "bob1",
			entities: {}
		};
		expect(() =>{
			host = SdjHost.getISdjHost({lexicons: [lexicon]});
		}).toThrowError();
		SdjHost.setTestingInstance(undefined);

		lexicon = {
			name: "bob1",
			someOther: "value"
		};
		expect(() =>{
			host = SdjHost.getISdjHost({lexicons: [lexicon]});
		}).toThrowError();
		SdjHost.setTestingInstance(undefined);


		lexicon = {
			name: "bob1",
			graphVerify: {}
		};
		expect(() =>{
			host = SdjHost.getISdjHost({lexicons: [lexicon]});
		}).toThrowError();
		SdjHost.setTestingInstance(undefined);

		lexicon = {
			name: "bob1",
			validator: { "nbob": {}}
		};
		expect(() =>{
			host = SdjHost.getISdjHost({lexicons: [lexicon]});
		}).toThrowError();
		SdjHost.setTestingInstance(undefined);

		lexicon = {
			name: "bob1",
			validator: { "nbob": { "type": "nbob" }}
		};
		expect(() =>{
			host = SdjHost.getISdjHost({lexicons: [lexicon]});
		}).toThrowError();
		SdjHost.setTestingInstance(undefined);
	});

	test("test more bad lexicons", () => {
		let host, lexicon, clone;

		const lexiconB = {
			name: "ang-other",
			items: [],
			entities: [],
			graphVerify: () => true,
			dataVerify: () => true,
			required: ["valuea","valueb"]
		};

		clone = cloneDeep(lexiconB);
		// good clone:
		host = SdjHost.getISdjHost({lexicons: [clone]});
		expect(host).toBeTruthy();

		SdjHost.setTestingInstance(undefined);

		clone = cloneDeep(lexiconB);
		clone.graphVerify = {};
		expect(() =>{
			host = SdjHost.getISdjHost({lexicons: [clone]});
		}).toThrowError();
		SdjHost.setTestingInstance(undefined);

		clone = cloneDeep(lexiconB);
		clone.dataVerify = [];
		expect(() =>{
			host = SdjHost.getISdjHost({lexicons: [clone]});
		}).toThrowError();
		SdjHost.setTestingInstance(undefined);

		clone = cloneDeep(lexiconB);
		clone.alienValue = "somealien";
		//clone.validators = () => true;
		expect(() =>{
			host = SdjHost.getISdjHost({lexicons: [clone]});
		}).toThrowError();
		SdjHost.setTestingInstance(undefined);

		clone = cloneDeep(lexiconB);
		clone.entities = () => true;
		expect(() =>{
			host = SdjHost.getISdjHost({lexicons: [clone]});
		}).toThrowError();
		SdjHost.setTestingInstance(undefined);

		clone = cloneDeep(lexiconB);
		clone.items = "bob";
		expect(() =>{
			host = SdjHost.getISdjHost({lexicons: [clone]});
		}).toThrowError();
		SdjHost.setTestingInstance(undefined);

		// empty with only name
		clone = {name: "nameonly"};
		expect(() =>{
			host = SdjHost.getISdjHost({lexicons: [clone]});
		}).toThrowError();
		SdjHost.setTestingInstance(undefined);
	})

	test("Test good Lexicon 1",() => {
		let host;

		host = SdjHost.getISdjHost({lexicons: [lexicon]});
		expect(host).toBeTruthy();
		let lexMgr = host.lexiconMgr;
		expect(lexMgr.names.length).toBe(1);
		let returnedLex = lexMgr.getByName("min-ang");
		expect(returnedLex).toBeTruthy();
		expect(returnedLex.items.length).toBe(5);
		expect(returnedLex.entities.length).toBe(3);
	})

	test("Test good Lexicon 2",() => {
		let host;

		host = SdjHost.getISdjHost({lexicons: [lexicon]});
		expect(host).toBeTruthy();

		let sdjJson = new SdJson(angLexEmpJson);
		expect(sdjJson).toBeTruthy();
	})

	test("Test good Lexicon 3",() => {
		let host;

		host = SdjHost.getISdjHost({lexicons: [lexicon]});
		expect(host).toBeTruthy();

		let sdjJson = new SdJson(angLexStdJson);
		expect(sdjJson).toBeTruthy();
	})

	test("Test 4 lexicons same host",() => {
		let host;

		host = SdjHost.getISdjHost({lexicons: [new SimpleSdjLexicon(), lexicon]});
		expect(host).toBeTruthy();

		let sdjJson = new SdJson(angLexEmpJson);
		expect(sdjJson).toBeTruthy();

		let sdjJson2 = new SdJson(simpleLexJson);
		expect(sdjJson2).toBeTruthy();
	})

	test("Test 5 incorrect loaded lex1",() => {
		let host;

		host = SdjHost.getISdjHost({lexicons: [lexicon]});
		expect(host).toBeTruthy();

		expect(() => {
			let sdjJson2 = new SdJson(simpleLexJson);
		}).toThrowError();
	})

	test("Test 6 Other incorrect load",() => {
		let host;

		host = SdjHost.getISdjHost({lexicons: [new SimpleSdjLexicon()]});
		expect(host).toBeTruthy();

		expect(() => {
			let sdjJson2 = new SdJson(angLexEmpJson);
		}).toThrowError();
	})

});
