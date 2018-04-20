import React, { Component } from 'react'

import Kitty from './kitty.js'

function TxnsViewer ({txns}) {
  let kittyIds = Object.keys(txns)
  return kittyIds.length > 0
    ? <div> Showing transacted tokens for your address:
      <ul>
        {kittyIds.map((kittyId) => {
          let txnsForKitty = txns[kittyId]
          return <li key={kittyId}>
            <Kitty kitty={txnsForKitty[0].token} />
            <br />
            Transactions for this Kitty:
            <ul>{txnsForKitty.map((txn) =>
              <Txn key={txn.hash} {...txn} />
            )}</ul>
          </li>
        })}
      </ul>
    </div>
    : <span>No transactions available for your address.</span>
}

class Txn extends Component {
  state = {
    hideJSON: true
  }
  toggleJSON = () => this.setState((state) => ({hideJSON: !state.hideJSON}))
  render = () => {
    let {hash, token, status, receipt} = this.props
    let {hideJSON} = this.state
    return <li key={hash}>
      Transaction: {hash}
      <br />
      {status === 'failure'
        ? 'This transaction failed'
      : status === 'success'
        ? 'This transaction succeeded!'
      : 'This transaction is pending...'}
      {status
        ? <button onClick={this.toggleJSON}>
          Toggle Receipt JSON
        </button>
        : null}
      <br />
      {hideJSON ? null : <small>{JSON.stringify(receipt)}</small>}
      <br /><br />
    </li>
  }
}

export default TxnsViewer
