# Code Exporter for GraphiQL

A GraphiQL addon that generates ready-to-run code for your queries and mutations.  
It provides a wide range of default snippets, but is also extendable with custom snippets.

![Demo](demo.gif)

> Read the [introduction blog post]() to learn why and how we built it!

## Installation

```sh
# yarn
yarn add graphiql-code-exporter

# npm
npm i --save graphiql-code-exporter
```

## Built-in Snippets

- **JavaScript**
  - fetch
  - react-apollo
  - react-with-hooks
- **Python**
  - graphqlclient
  - sgqlc
- **Reason**
  - reason-apollo
  - bs-fetch
- **Ruby**
  - graphql-client

## Usage

```javascript
import React, { Component, Fragment } from 'react'
import GraphiQL from 'graphiql'
import CodeExporter from 'graphiql-code-exporter'

const serverUrl = /* your server url here */

export default class GraphiQLWithCodeExporter extends Component {
  state = {
    codeExporterIsVisible: false,
    query: ''
  }

  toggleCodeExporter = () => this.setState({
    codeExporterIsVisible: !this.state.codeExporterIsVisible
  })

  updateQuery = query => this.setState({
    query
  })

  render() {
    const { query, codeExporterIsVisible } = this.state

    const codeExporter = codeExporterIsVisible ? (
      <CodeExporter
        hideCodeExporter={this.toggleCodeExporter}
        snippets={snippets}
        serverUrl={serverUrl}
        query={query}
      />
    ) : null

    return (
      <Fragment>
        <GraphiQL
          onEditQuery={this.updateQuery}
          query={query}>
          <GraphiQL.Button
            onClick={this.toggleCodeExporter}
            label="Code Exporter"
            title="Toggle Code Exporter"
          />
        </GraphiQL>
        {codeExporter}
      </Fragment>
    )
  }
}
```

## Props

| Property         | Type          | Description                                                                                                                                                 |
| ---------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| hideCodeExporter | _(Function)_  | A callback function that is called when clicking the close (x) button in the upper right corner of the panel.                                               |
| serverUrl        | _(URI)_       | The server url for your GraphQL endpoint.                                                                                                                   |
| query            | _(string)_    | A string containing the GraphQL query that is synced with the GraphiQL query editor.                                                                        |
| snippets         | _(Snippet[])_ | A list of snippet objects that one can choose from to generate code snippets.                                                                               |
| theme            | _(string)_    | The name of the [prism.js theme](https://prismjs.com/#basic-usage) in lower case and with '-' instead of spaces e.g. `solarized-light`. Defaults to `prism` |

## Snippets

What we call **snippet** here, is actually an object with 4 required keys.

| Key           | Type         | Description                                                                                                                                                  |
| ------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| name          | _(string)_   | A name that is used to identify the snippet.                                                                                                                 |
| language      | _(string)_   | A language string that is used to group the snippets by language.                                                                                            |
| prismLanguage | _(string?)_  | A valid [Prism language](https://prismjs.com/#languages-list) used for syntax highlighting. It defaults to the lower-cased `language` if none is provided.   |
| options       | _(Option[])_ | Options are rendered as checkboxes and can be used to customize snippets. They must have an unique id, a label and an initial value of either true or false. |
| generate      | _(Function)_ | A function that returns the generated code as a single string. It receives below listed arguments as an object.                                              |

#### Arguments

1. `serverUrl` (_string_): The passed GraphQL server url
2. `operationName` (_string_): The selected GraphQL operation name
3. `operationType` (_"query" | "mutation"_): The selected operation's type
4. `variableName` (_string_): The operation name but in UPPER_CASE as that's the common way to declare GraphQL operations in JavaScript
5. `operation` (_string_): The selected operation as a query string
6. `options` (_Object_): A map of option-boolean pairs providing whether an option is selected or not

#### Example

The following example implements a subset of the built-in _Fetch API_ snippet.  
The output will look similar to the demo above.

```javascript
const fetchSnippet = {
  language: 'JavaScript',
  prismLanguage: 'javascript',
  name: 'Fetch API',
  options: [
    {
      id: 'server',
      label: 'server-side usage',
      initial: false,
    },
  ],
  generate: ({serverUrl, operation, options}) => {
    const serverImport = options.server
      ? 'import { fetch } from "node-fetch"'
      : '';

    return `
${serverImport}

const res = await fetch("${serverUrl}", {
  method: 'POST',
  body: JSON.stringify({ query: \`${operation}\` }),
})
const { errors, data } = await res.json()

// Do something with the response
console.log(data, errors)
`;
  },
};
```

#### Extending the built-in snippets

If we want to use both custom and all the built-in snippets, we can import them from npm.

```javascript
import snippets from 'graphiql-code-exporter/lib/snippets'

const customSnippet = /* custom snippet */

const extendedSnippets = [
  ...snippets,
  customSnippet
]
```

This is also useful if you want to filter or modify single snippets.

## License

graphiql-code-exporter is licensed under the [MIT License](http://opensource.org/licenses/MIT).<br>
Documentation is licensed under [Creative Common License](http://creativecommons.org/licenses/by/4.0/).<br>
Created with ♥ by [@rofrischmann](http://rofrischmann.de) and all the great contributors.
