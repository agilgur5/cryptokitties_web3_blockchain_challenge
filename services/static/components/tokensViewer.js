import React from 'react'

import { getWeb3 } from '../init/web3Interface.js'

function tokenTxnFilter (txns) {
  return (token) => {
    return !((token.id in txns) && txns[token.id].status != 'failure')
  }
}

function TokensViewer ({userAddress, tokens, txns, giftKitty}) {
  let web3 = getWeb3()
  let filtered = tokens.filter(tokenTxnFilter(txns))
  return filtered.length > 0
    ? <div> Showing tokens for this address:
      <ul>
        {filtered.map((token) =>
          <li key={token.id}>
            {JSON.stringify(token)}
            <br /><br />
            {/* technically, one can transfer on behalf of other entities,
                but that's outside the scope, so not handling that case */}
            {userAddress === web3.eth.accounts[0]
              ? <button onClick={giftKitty(token)}>
                Gift this Kitty
              </button>
              : null}
            <br /><br />
          </li>
        )}
      </ul>
    </div>
    : <span>No tokens available for this address.</span>
    // ^maybe show a different phrase if pending tokens?
    // "available" is still an accurate word in any case
}

export default TokensViewer
