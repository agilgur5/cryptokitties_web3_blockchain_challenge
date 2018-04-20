import React from 'react'

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
            <ul>{txnsForKitty.map((txn) => {
              let {hash, token, status} = txn
              return <li key={hash}>
                Transaction: {hash}
                <br />
                {status === 'failure'
                  ? 'This transaction failed'
                : status === 'success'
                  ? 'This transaction succeeded!'
                : 'This transaction is pending...'}
                <br /><br />
              </li>
            })}</ul>
          </li>
        })}
      </ul>
    </div>
    : <span>No transactions available for your address.</span>
}

export default TxnsViewer
