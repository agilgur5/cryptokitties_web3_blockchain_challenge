import React, { Component } from 'react'
import ReactDOM from 'react-dom'

import Web3 from 'web3'

import { address, abi } from './contract.js'

let web3 = null
if (typeof window.web3 != 'undefined'){
  console.log('Using web3 detected from external source (e.g. MetaMask, Mist)')
  web3 = new Web3(window.web3.currentProvider)
} else {
  // notify user of the error
  alert('No web3 Provider detected... exiting...')
  // early exit
  throw new Error('No web3 Provider detected... exiting...')
}
const contract = web3.eth.contract(abi)
const contractInst = contract.at(address)

/* get Kitties from the API because tokensOfOwner contract method is too slow
   to ever work */
function getKitties (address) {
  // note that this defaults to only displaying the first 12 kitties
  // for this purpose I think that's okay, but one could easily implement
  // pagination or infinite scroll if one so wanted to
  return fetch(
    'https://api.cryptokitties.co/kitties?owner_wallet_address=' + address
  ).then((resp) => resp.json())
}

// just a simple prompt that returns an address if it gets one or throws
const promptText = 'What\'s the address you want to gift this kitten to?'
function askForAddress (addr) {
  let to = window.prompt(promptText, addr) // who needs modals anyway
  // if we were using a modal, we shouldn't allow submission until it's valid
  // since we're not, do some post-submission input validation
  if (to == null) { // cancel was clicked
    throw new Error('prompt cancelled')
  } else if (!web3.isAddress(to)) {
    alert('Invalid address, try again')
    return askForAddress(to)
  }
  return to
}

class App extends Component {
  state = {
    userAddress: web3.eth.accounts[0], // first account is default
    loading: true,
    invalidError: false,
    apiError: false,
    tokens: [],
    txns: []
  }
  componentDidMount = () => {
    this._handleNewAddress() // get kitties for default account on mount
  }
  _handleNewAddress = () => {
    // default
    this.setState({
      loading: true, invalidError: false, apiError: false, tokens: []
    })
    // check if address is even valid, early return if not
    if (!web3.isAddress(this.state.userAddress)) {
      this.setState({loading: false, invalidError: true})
      return
    }

    getKitties(this.state.userAddress)
      .catch((err) => {
        console.error('CryptoKitties API call failed!')
        alert('CryptoKitties API call failed!') // leave error handling to user
        this.setState({loading: false, apiError: true})
      })
      .then((result) => {
        console.log(result)
        this.setState({tokens: result.kitties, loading: false})
      })
  }
  handleChange = (ev) => {
    let value = ev.target.value // save event before it changes
    this.setState({userAddress: value}, this._handleNewAddress)
  }
  giftKitty = (token) => () => {
    let to
    try {
      to = askForAddress()
    } catch (err) {
      return // if canceled, do nothing
    }
    contractInst.transfer(to, token.id, {from: web3.eth.accounts[0]},
      (err, result) => {
        if (err) {
          console.error(err)
          alert(err.message)
        }
        console.log(result)
        // move the gifted kitty to the transaction list
        // the immutability can probably be made more efficient
        this.setState((state) => ({
          txns: state.txns.concat({hash: result, token}),
          tokens: state.tokens.filter((tk) => tk.id !== token.id)
        }))
      }
    )
  }
  render = () => {
    let {userAddress, loading, invalidError, apiError, tokens,
      txns} = this.state
    let tkViewerProps = {userAddress, tokens, giftKitty: this.giftKitty}
    return <div>
      Search by User Address:
      <br />
      <input type='text' value={userAddress} onChange={this.handleChange} />
      <br />
      {loading
        ? 'Loading...'
      : apiError
        ? 'CryptoKitties API call failed! Maybe try typing again?'
      : invalidError
        ? 'Invalid Address'
      : <div>
        <TokensViewer {...tkViewerProps} />
        <br />
        {/* only show transactions for your address (for now?) */}
        {userAddress === web3.eth.accounts[0]
         ? <div>
          <hr />
          <br />
          <TxnsViewer txns={txns} />
        </div>
        : null}
      </div>}
    </div>
  }
}

function TokensViewer ({tokens, userAddress, giftKitty}) {
  return tokens.length > 0
    ? <div> Showing tokens for this address:
      <ul>
        {tokens.map((token) =>
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
}

function TxnsViewer ({txns}) {
  return txns.length > 0
    ? <div> Showing transactions for your address:
      <ul>
        {txns.map(({hash, token, status}) =>
          <li key={hash}>
            {JSON.stringify(token)}
            <br /><br />
            {status === 'failed'
              ? 'This transaction failed'  // maybe add a retry at some point
            : status === 'success'
              ? 'This transaction succeeded!'
            : 'This transaction is pending...'}
            <br /><br />
          </li>
        )}
      </ul>
    </div>
    : <span>No transactions available for your address.</span>
}

const element = document.createElement('div')
document.body.appendChild(element)
ReactDOM.render(<App />, element)
