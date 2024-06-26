const config = {
	testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|js?|tsx?|ts?|mjs?)$",
	verbose: true,
	fakeTimers: {
		enableGlobally: true
	},
	transform: {}
};

export default config;