module.exports = {
	"env": {
		"browser": true,
		"es2021": true,
		"node": true
	},
	"ignorePatterns": [
		"jest.config.js",
		"/dist/*",
		"dist/*",
		"/node_modules/*",
		"node_modules/*",
		"./node_modules/**",
		"./node_modules/*",
		"/external_code/**",
		"external_code/**"
	],
	"extends": [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended"
	],
	"overrides": [
		{
			"env": {
				"node": true
			},
			"files": [
				".eslintrc.{js,cjs}"
			],
			"parserOptions": {
				"sourceType": "script"
			}
		}
	],
	"parser": "@typescript-eslint/parser",
	"parserOptions": {
		"ecmaVersion": "latest",
		"sourceType": "module",
		"tsconfigRootDir": __dirname,
		"project": [
			"tsconfig.json"
		]
	},
	"plugins": [
		"@typescript-eslint"
	],
	"rules": {
		"no-var": "error",
		"prefer-rest-params": "off",
		"prefer-spread": "off",
		"prefer-arrow-callback": [ "error", { "allowNamedFunctions": true } ],
		"one-var": ["error", {
			"var": "consecutive",
			"let": "consecutive",
			"const": "consecutive" }],
		"no-loss-of-precision": "error",
		"no-console": "error",
		"accessor-pairs": "error",
		"block-scoped-var": "error",
		"complexity": ["warn", 25],
		"curly": "error",
		"default-case": "error",
		"default-case-last": "error",
		"default-param-last": ["error"],
		"eqeqeq": "error",
		"dot-location": "off",
		"grouped-accessor-pairs": "off",
		"max-classes-per-file": ["error", 6],
		"no-alert": "error",
		"no-caller": "error",
		"no-constructor-return": "error",
		"no-eq-null": "error",
		"no-floating-decimal": "error",
		"no-invalid-this": "error",
		"no-labels": "error",
		"no-lone-blocks": "error",
		"no-multi-spaces": ["error", { "ignoreEOLComments": false }],
		"no-new-wrappers": "error",
		"no-return-assign": "error",
		"no-script-url": "error",
		"no-self-compare": "error",
		"no-throw-literal": "error",
		"no-unmodified-loop-condition": "error",
		"no-useless-concat": "error",
		"no-useless-return": "error",
		"no-use-before-define": ["error", { "functions": false, "classes": false, "variables": true}],
		"array-bracket-spacing": ["error", "never"],
		"block-spacing": "error",
		"comma-style": ["error", "last"],
		"computed-property-spacing": ["error", "never"],
		"consistent-this": ["error", "that"],
		"max-depth": ["error", 5],
		"max-lines": ["warn", {"max": 500, "skipBlankLines": true, "skipComments": true}],
		"max-lines-per-function": ["warn", {"max": 50, "skipBlankLines": true, "skipComments": true}],
		"max-len": ["error", {
			"code": 140,
			"comments": 140,
			"ignoreRegExpLiterals": true }],
		"max-nested-callbacks": ["error", 6],
		"no-lonely-if": "error",
		"no-unneeded-ternary": "error",
		"no-nested-ternary": "error",
		"no-plusplus": "error",
		"no-whitespace-before-property": "error",
		"object-curly-spacing": ["error", "never"],
		"object-property-newline": ["error", { "allowAllPropertiesOnSameLine": true }],
		"no-duplicate-imports": "error",
		"brace-style": [
			"error",
			"1tbs"
		],
		"id-match": "off",
		"no-underscore-dangle": "off",
		"prefer-const": "off",
		"indent": [
			"error",
			2
		],
		"linebreak-style": ["error", process.platform === "win32" ? "windows" : "unix"],
		"quotes": [
			"error",
			"double"
		],
		"semi": "off",
		"no-unused-vars": "off",
		"@typescript-eslint/no-unused-vars": "warn",
		"arrow-parens": ["error", "always"],
		"no-confusing-arrow": "error",
		"arrow-body-style": ["warn", "as-needed", { "requireReturnForObjectLiteral": true }],
		"arrow-spacing": "error",
		"no-empty-function": "off",
		// too many false positives for enum, therefore off
		"no-shadow": "off",
		"no-unused-expressions": ["error"],
		"radix": "error",
		"no-extra-semi": "error",
		"camelcase": "off",
		"dot-notation": "off",
		"@typescript-eslint/no-explicit-any": "error",
		"@typescript-eslint/semi": "error",
		"@typescript-eslint/no-this-alias": "warn",
		"@typescript-eslint/no-shadow": "error",
		"@typescript-eslint/consistent-type-assertions": ["error", {"assertionStyle":  "angle-bracket"}],
		"@typescript-eslint/explicit-module-boundary-types": "off",
		"@typescript-eslint/explicit-function-return-type": "off",
		"@typescript-eslint/consistent-type-definitions": "error",
		"@typescript-eslint/restrict-plus-operands": "off",
		"@typescript-eslint/explicit-member-accessibility": ["off", {"accessibility": "explicit"}],
		"@typescript-eslint/member-ordering": [
			"error",
			{
				"default": [
					"public-static-field",
					"protected-static-field",
					"private-static-field",
					"public-instance-field",
					"protected-instance-field",
					"private-instance-field",
					"constructor",
					"public-instance-method",
					"protected-instance-method",
					"private-instance-method",
					"public-static-method",
					"protected-static-method",
					"private-static-method"
				]
			}
		],
		"@typescript-eslint/no-empty-function": ["warn", {
			"allow": ["private-constructors", "protected-constructors", "decoratedFunctions", "methods", "constructors"]
		}],
		"@typescript-eslint/no-empty-interface": ["error"],
		"no-implied-eval": ["error"],
		"@typescript-eslint/no-inferrable-types": ["error", {
			"ignoreParameters": true,
			"ignoreProperties": true
		}],
		"@typescript-eslint/dot-notation": ["warn", {"allowIndexSignaturePropertyAccess":  true}],
		"@typescript-eslint/quotes": ["off"],
		"@typescript-eslint/no-misused-new": ["error"],
		"@typescript-eslint/no-non-null-assertion": ["error"],
		"@typescript-eslint/naming-convention": [
			"error",
			{
				"selector": "variable",
				"format": ["PascalCase", "camelCase", "UPPER_CASE"],
				"leadingUnderscore": "allow"
			},
			{
				"selector": "interface",
				"format": ["PascalCase"]
			},
			{
				"selector": "parameter",
				"format": ["camelCase", "snake_case"],
				"leadingUnderscore": "allow"
			},
			{
				"selector": "class",
				"format": ["PascalCase"]
			},
			{
				"selector": "memberLike",
				"modifiers": ["private"],
				"format": ["camelCase", "snake_case"],
				"leadingUnderscore": "allow"
			}
		],
		"@typescript-eslint/ban-types": ["error",
			{
				"types": {
					"{}": false,
					"object": false,
					"Function": false
				},
				"extendDefaults": true
			}
		]
	}
};
