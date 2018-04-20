import React from 'react'

import Kitty from './kitty.js'

function TxnsViewer ({txns}) {
  let txnKeys = Object.keys(txns)
  return txnKeys.length > 0
    ? <div> Showing transactions for your address:
      <ul>
        {txnKeys.map((txnKey) => {
          let {hash, token, status} = txns[txnKey]
          return <li key={hash}>
            <Kitty kitty={token} />
            <br /><br />
            {status === 'failure'
              ? 'This transaction failed'  // maybe add a retry at some point
            : status === 'success'
              ? 'This transaction succeeded!'
            : 'This transaction is pending...'}
            <br /><br />
          </li>
        })}
      </ul>
    </div>
    : <span>No transactions available for your address.</span>
}

export default TxnsViewer
