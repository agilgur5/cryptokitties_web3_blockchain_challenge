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
    error: false,
    tokens: []
  }
  componentDidMount = () => {
    this._handleNewAddress() // get kitties for default account on mount
  }
  _handleNewAddress = () => {
    getKitties(this.state.userAddress)
      .catch((err) => {
        console.error('CryptoKitties API call failed!')
        alert('CryptoKitties API call failed!') // leave error handling to user
        this.setState({loading: false, error: true})
      })
      .then((result) => {
        console.log(result)
        this.setState({tokens: result.kitties, loading: false})
      })
  }
  handleChange = (ev) => {
    let value = ev.target.value // save event before it changes
    this.setState(
      {userAddress: value, loading: true, error: false},
      _this._handleNewAddress
    )
  }
  giftKitty = (token) => () => {
    let to
    try {
      to = askForAddress()
    } catch (err) {
      return // if canceled, do nothing
    }
    contractInst.transfer(to, token.id, {from: this.state.userAddress},
      (err, result) => {
        if (err) {
          console.error(err)
          alert(err.message)
        }
        console.log(result) // todo: change state
      }
    )
  }
  render = () => {
    let {userAddress, loading, error, tokens} = this.state
    return <div>
      Search by User Address:
      <br />
      <input type='text' value={userAddress} onChange={this.handleChange} />
      <br />
      {tokens.length > 0
        ? <div>
          Showing tokens for this address:
          <ul>
            {tokens.map((token) =>
              <li key={token.id}>
                {JSON.stringify(token)}
                <br /><br />
                <button onClick={this.giftKitty(token)}>Gift this Kitty</button>
                <br /><br />
              </li>
            )}
          </ul>
        </div>
        : loading
          ? 'Loading...'
          : error
            ? 'CryptoKitties API call failed! Maybe try typing again?'
            : 'No tokens available for this address.'}
    </div>
  }
}

const element = document.createElement('div')
document.body.appendChild(element)
ReactDOM.render(<App />, element)
