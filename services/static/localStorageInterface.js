import { getWeb3 } from './init/web3Interface.js'

export function getLocalTransactions () {
  let web3 = getWeb3()
  return JSON.parse(window.localStorage.getItem('txns' + web3.eth.accounts[0]))
}

export function setLocalTransactions (jsonObj) {
  let web3 = getWeb3()
  return window.localStorage.setItem(
    'txns' + web3.eth.accounts[0],
    JSON.stringify(jsonObj)
  )
}

export function initLocalStorage () {
  // initialize localStorage if it doesn't exist
  if (!getLocalTransactions) {
    setLocalTransactions({})
  }
}
