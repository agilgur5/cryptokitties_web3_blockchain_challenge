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
