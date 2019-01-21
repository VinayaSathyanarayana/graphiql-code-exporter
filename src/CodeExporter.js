import React, { Component } from 'react'
import { Button, Icon, Tooltip } from 'antd'
import copy from 'copy-to-clipboard'
import { parse, print } from 'graphql/language'

// TODO: can we use plain graphiql nodes or do we need @onegraph?
import GraphiQL from '@onegraph/graphiql'

// TODO: lazy load languages and css on mount
import { highlightAuto } from 'highlight.js'
import 'highlight.js/styles/github.css'

function formatVariableName(name) {
  var uppercasePattern = /[A-Z]/g

  return (
    name.charAt(0).toUpperCase() +
    name
      .slice(1)
      .replace(uppercasePattern, '_$&')
      .toUpperCase()
  )
}

const getInitialOptions = snippet =>
  snippet.options.reduce((newOptions, option) => {
    newOptions[option.id] = {
      label: option.label,
      value: option.initial,
    }

    return newOptions
  }, {})

// TODO: filter subscriptions
const getOperations = query => {
  let operations = []
  try {
    operations = parse(query).definitions
  } catch (e) {}

  return operations
}

const getOperationName = operation =>
  operation.name ? operation.name.value : operation.operation

const getOperationDisplayName = operation =>
  operation.name
    ? operation.name.value
    : '<Unnamed:' + operation.operation + '>'

class CodeExporter extends Component {
  constructor(props, context) {
    super(props, context)

    this.state = {
      showCopiedTooltip: false,
      snippet: props.initialSnippet,
      options: getInitialOptions(props.initialSnippet),
      query: props.query,
      operationIndex: 0,
    }
  }

  static getDerivedStateFromProps(props, state) {
    const operations = getOperations(props.query)
    const operation = operations[state.operationIndex] || operations[0]

    return {
      operations,
      operation,
      operationIndex: state.operationIndex,
      query: props.query,
    }
  }

  setSnippet = name => {
    const snippet = this.props.snippets.find(snippet => snippet.name === name)

    this.setState({
      options: getInitialOptions(snippet),
      snippet,
    })
  }

  setLanguage = language => {
    const snippet = this.props.snippets.find(
      snippet => snippet.language === language
    )

    this.setState({
      options: getInitialOptions(snippet),
      snippet,
    })
  }

  setOption = (id, value) =>
    this.setState({
      options: {
        ...this.state.options,
        [id]: {
          ...this.state.options[id],
          value: value,
        },
      },
    })

  render() {
    const { appId, snippets } = this.props
    const {
      snippet,
      options,
      operations,
      operation,
      operationIndex,
      showCopiedTooltip,
    } = this.state

    const { name, language, getSnippet } = snippet

    if (!operation) {
      return null
    }

    const operationName = getOperationName(operation)
    const operationDisplayName = getOperationDisplayName(operation)
    const query = print(operation)

    let rawSnippet = (codeSnippet = getSnippet({
      appId: appId,
      operation: query,
      operationType: operation.operation,
      variableName: formatVariableName(operationName),
      operationName,
      options: Object.keys(options).reduce((flags, id) => {
        flags[id] = options[id].value
        return flags
      }, {}),
    }))

    // we use a try catch here because otherwise highlight might break the render
    try {
      codeSnippet = highlightAuto(codeSnippet, [language]).value
    } catch (e) {}

    return (
      <div>
        <div
          style={{
            fontFamily:
              'system, -apple-system, San Francisco, Helvetica Neue, arial, sans-serif',
          }}>
          <div
            style={{
              padding: '10px 7px',
              borderBottom: '1px solid rgb(220, 220, 220)',
            }}>
            <GraphiQL.Menu label={operationDisplayName} title="Operation">
              {operations.map((op, index) => (
                <li onClick={() => this.setState({ operationIndex: index })}>
                  {getOperationDisplayName(op)}
                </li>
              ))}
            </GraphiQL.Menu>
          </div>
          <div
            style={{
              padding: '10px 7px 5px 7px',
            }}>
            <GraphiQL.Menu label={language} title="Language">
              {snippets
                .map(snippet => snippet.language)
                .filter((lang, index, arr) => arr.indexOf(lang) === index)
                .sort((a, b) => a > b || -1)
                .map(lang => (
                  <li onClick={() => this.setLanguage(lang)}>{lang}</li>
                ))}
            </GraphiQL.Menu>
            <GraphiQL.Menu label={name} title="Mode">
              {snippets
                .filter(snippet => snippet.language === language)
                .map(snippet => snippet.name)
                .sort((a, b) => a > b || -1)
                .map(snippetName => (
                  <li onClick={() => this.setMode(snippetName)}>
                    {snippetName}
                  </li>
                ))}
            </GraphiQL.Menu>
          </div>
          <div style={{ padding: '0px 11px 10px' }}>
            <div
              style={{
                fontWeight: 700,
                color: 'rgb(177, 26, 4)',
                fontVariant: 'small-caps',
                textTransform: 'lowercase',
              }}>
              Options
            </div>
            {Object.keys(options)
              .sort((a, b) => a > b || -1)
              .map(optionId => (
                <div key={optionId}>
                  <input
                    id={optionId}
                    type="checkbox"
                    style={{ position: 'relative', top: -1 }}
                    value={options[optionId].value}
                    onChange={() =>
                      this.setOption(optionId, !options[optionId].value)
                    }
                  />
                  <label for={optionId} style={{ paddingLeft: 5 }}>
                    {options[optionId].label}
                  </label>
                </div>
              ))}
          </div>
        </div>
        <Tooltip
          title="Copied!"
          visible={showCopiedTooltip}
          overlayStyle={{ fontSize: 10 }}>
          <Button
            style={{
              fontSize: '1.2em',
              padding: 0,
              position: 'absolute',
              left: 350,
              marginTop: -20,
              width: 40,
              height: 40,
              backgroundColor: 'white',
              borderRadius: 40,
              boxShadow: '0 0 1px black',
            }}
            type="link"
            onClick={() => {
              copy(rawSnippet)
              this.setState({ showCopiedTooltip: true }, () =>
                setTimeout(
                  () => this.setState({ showCopiedTooltip: false }),
                  450
                )
              )
            }}>
            <Icon type="copy" />
          </Button>
        </Tooltip>
        <pre
          style={{
            padding: '15px 12px',
            backgroundColor: 'rgb(246, 247, 248)',
          }}>
          <code
            style={{
              fontFamily:
                'Dank Monk, Hack, Fira Code, Consolas, Inconsolata, Droid Sans Mono, Monaco, monospace',
              textRendering: 'optimizeLegibility',
              fontSize: 12,
            }}
            dangerouslySetInnerHTML={{
              __html: codeSnippet,
            }}
          />
        </pre>
      </div>
    )
  }
}

export default function CodeExporterWrapper({
  query,
  appId,
  hideCodeExporter,
  snippets = defaultSnippets,
}) {
  return (
    <div
      className="historyPaneWrap"
      style={{
        width: 440,
        zIndex: 7,
      }}>
      <div className="history-title-bar">
        <div className="history-title">Code Exporter</div>
        <div className="doc-explorer-rhs">
          <div className="docExplorerHide" onClick={hideCodeExporter}>
            {'\u2715'}
          </div>
        </div>
      </div>
      <div
        className="history-contents"
        style={{ borderTop: '1px solid #d6d6d6', paddingBottom: 20 }}>
        <CodeExporter query={query} appId={appId} snippets={snippets} />
      </div>
    </div>
  )
}
