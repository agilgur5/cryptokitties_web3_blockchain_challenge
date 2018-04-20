import React, { Component } from 'react'
import ReactDOM from 'react-dom'

import TokensViewer from './components/tokensViewer.js'
import TxnsViewer from './components/txnsViewer.js'

import { init, getWeb3, getContractInst } from './init/web3Interface.js'

// instantiate web3 and the contract
init()
let web3 = getWeb3()
let contractInst = getContractInst()

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

// initialize localStorage if it doesn't exist
if (!window.localStorage.getItem('txns')) {
  window.localStorage.setItem('txns', JSON.stringify({}))
}
class App extends Component {
  state = {
    userAddress: web3.eth.accounts[0], // first account is default
    loading: true,
    invalidError: false,
    apiError: false,
    tokens: [],
    // dict of kittyId -> [txnForKitty, txnForKitty2]
    // txnForKitty = {hash, receipt, status, token, to}
    txns: JSON.parse(window.localStorage.getItem('txns'))
  }
  componentDidMount = () => {
    this._handleNewAddress() // get kitties for default account on mount
    // get status/receipts for any txns that don't have them
    Object.keys(this.state.txns).forEach((tkId) => {
      this.state.txns[tkId].filter((txn) => !txn.status).forEach(this._longPoll)
    })
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
        // transfer was rejected
        if (err) {
          console.error(err)
          alert(err.message)
          return
        }
        console.log(result)
        // set the new transactions
        let txn = {hash: result, token, to}
        // append to array or create a new array in the state
        let txnsForKitty = this.state.txns[token.id]
        if (txnsForKitty) {
          txnsForKitty.push(txn)
        } else {
          this.state.txns[token.id] = [txn]
        }
        window.localStorage.setItem('txns', JSON.stringify(this.state.txns))
        // yea preferably this should be done with immutability-helper, but
        // we're not using sCU and it won't be noticeable anyway
        this.forceUpdate()
        this._longPoll(txn)
      }
    )
  }
  render = () => {
    let {userAddress, loading, invalidError, apiError, tokens,
      txns} = this.state
    let tkViewerProps = {userAddress, tokens, txns, giftKitty: this.giftKitty}
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

  _longPoll = (txn) => {
    web3.eth.getTransactionReceipt(txn.hash, (err, result) => {
      if (err) {
        console.error(err)
        // don't return and just retry
        // ideally should check what kind of error was given
      }
      console.log(result)
      // null result means pending
      if (!result) {
        // ideally should exponential jitter this
        setTimeout((() => this._longPoll(txn)), 20000) // 20s because sloooow
        return
      }

      // transaction has a receipt, so update it!
      let status = result.status === '0x0' ? 'failure' : 'success'
      txn.status = status
      txn.receipt = result
      window.localStorage.setItem('txns', JSON.stringify(this.state.txns))
      // remove from the array if sent to someone else
      if (result === 'success' && txn.to != web3.eth.accounts[0]) {
        this.state.tokens = this.state.tokens.filter((tk) => {
          tk.id != txn.token.id
        })
      }
      this.forceUpdate() // same note about immutability-helper as above
    })
  }
}


const element = document.createElement('div')
document.body.appendChild(element)
ReactDOM.render(<App />, element)
