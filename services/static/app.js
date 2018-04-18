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

class App extends Component {
  state = {
    userAddress: '',
    loading: false,
    tokens: []
  }
  handleChange = (ev) => {
    let value = ev.target.value // save event before it changes
    this.setState({userAddress: value, loading: true})
    contractInst.tokensOfOwner(value, (err, result) => {
      if (err) {
        console.error('tokensOfOwner call failed!')
        throw new Error(err)
      }
      console.log(result)
      this.setState({tokens: result, loading: false})
    })
  }
  render = () => {
    let {userAddress, loading, tokens} = this.state
    return <div>
      Search by User Address:
      <br />
      <input type='text' value={userAddress} onChange={this.handleChange} />
      <br />
      {tokens.length > 0
        ? <div>
          Showing tokens for this address:
          <ul>
            {tokens.map((token) => {
              <li>{token}</li>
            })}
          </ul>
        </div>
        : loading
          ? 'Loading...'
          : 'No tokens available for this address.'}
    </div>
  }
}

const element = document.createElement('div')
document.body.appendChild(element)
ReactDOM.render(<App />, element)
