# About SDJ

## Why?
Needed an extremely flexible and customizable storage data protocol file that is web accessible, content validated, and easily transmitted/stored.

### Project Goals - 12/5/23

- Maintain the SDJ (.sdj) file format and JSON schema
- Centralize controls/development/code implementation for SDJ TS/JavaScript
- Keep the library small and maintainable with specialized function, while still providing error/log info
- Minimize dependencies constraining to use only 'lo-dash-es' as it's single peer-dependency
- Perform and maintain unit tests

### What it Does NOT (or should not) Do:

- Implement routing, creation, instantiation routines for other libraries/frameworks
  - Separate and discrete code/libraries should be constructed to interact with SDJs
- Provide internal routines for JSONs, import/loading, cryptography, storage, security, compression, or sanitization
    - Test and correspond with as much default JSON/JavaScript functionality as possible
    - Via Lexicon extensions some options can created/provided/shared for variety of custom content
    - sdj-editor* will provide an example of sanitization/html content
    - ISdjLibrary API is provided for optional storage of Descriptions outside SDJ-ESM core
    - Whole/Partial file security/compression/cryptography should always be preferred over internal file optimizations/shortcuts
- Internally store created/loaded SDJs or Descriptions inside SDJ-ESM.
- Natively implement non-JSON/JavaScript objects inside JSON structures
    - Customizations can/could occur via lexicons, but should not be directly part of this library.
- Provide/allow an external Lexicon loading system
    - Enforces strict and simple rules on Description validations; if the active library doesn't know it, it will not create/validate.
    - Developers deliberately have to import, know, confirm, and maintain the Lexicons they use.
    - If desired this type of functionality could be created for initialization, but should not be directly part of this library.

*in-progress

### Creator Caveats and Internal Rules
At its core; JSON is an open human-readable text format that creates structured data from simple rules.
This is both a great gift and liability. SDJ-ESM, on its own, does not provide any [sanitization](https://en.wikipedia.org/wiki/HTML_sanitization) of the JSON
string content that a file contains. These checks must be performed outside the library; which can be done manually
on retrieval/input or via the Lexicon Item Validators. 

It is critically important to remember that JSON string content cannot trusted - so make sure your application is
using an additional sanitization library for any JSON data that is rendered directly to html.

Each individual developer is responsible for what they store/share/create/transmit with this format.
From an initial creator's standpoint - there's a wide range of possible uses for this open source library.

However, there should be concerns about creating Lexicons that:
- Allow storing code / commands
- Allow storing of binary(or non-text) data in text format
- Allow storing framework/html templating
- Allow for cyclical storage of SDJs within an SDJ
- Miss-use the system for unsafe behavior (such as using eval on content)

## MPLv2 License Q&A

Many existing answers can be found on the Mozilla site [MPLv2 Q&A](https://www.mozilla.org/en-US/MPL/2.0/FAQ/).


### Why MPLv2?
MPLv2 provides weak copyleft protection that encourages sharing of content.
There are no licensing restrictions, fees, or viral licensing implications for your own code.
If you never modify the provided library or files, there are no additional requirements.
Benefits and enhancements of the core concepts (the SDJ library) can and should benefit all that use it.

So the MPLv2 license was determined as the best approach for this OSS project. 

- SDJ Library should be limited, structurally sound, yet flexible
- Lexicon system provides dynamic interoperability where breaking changes are easy to introduce
- Users that rely on the core library should expect stability and limited conceptual changes
- Fault intolerance errors/issues should be considered library-wide w/users
- Decisions to expand/contract the dynamics of the library should be considered w/users
- MPLv2 Allows for expansion and compliance of these concepts above; while not being as restrictive as LGPL or permissive as MIT
