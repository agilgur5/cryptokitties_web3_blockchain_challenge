# Front End

## Installation

```
npm install
```

## Running

To run in development mode with webpack's watcher, run `npm run watch`

To output a production bundle, run `npm run produce`

To view the bundled React app, you'll need to open `index.html`.
MetaMask won't run if you just open it up as a file in your browser (`file://` protocol), so you'll need to have a webserver actually serve it.
One option to run a simple webserver is `python -m SimpleHTTPServer`.
Once you have the webserver running, just navigate to the route serving `index.html`.

## Assumptions Made

- We only show transactions for the current user and not for other users that are searched via the UI
- We only care about gifting Kitties that belong to you (no `transferFrom`)
- We don't care about the fact that I used no CSS or styles what-so-ever (or UI framework)
  - Simplest approach. Also brutalist. Also smaller bundle size (though web3 is kind of large already...)
- You don't change accounts while using the app and without refreshing
  - There doesn't seem to be an account change event in web3 yet, so can't exactly listen to this change without hackishly polling the provider (calling `getAccounts` on `setInterval`)
  - The account is considered a constant global right now, so if it changes will need to add it to the state (not particularly default)
- You're not making transactions with the Kitties outside of the app while using it
  - It won't detect those changes, though if it were listening to all events, it could (lots of edge cases for that)
- No polyfills are necessary because you're running a new enough browser to be able to run MetaMask and as an Ethereum user, you're probably tech-savvy enough to update your browser regularly (if not have it set to auto-update)
  - Otherwise we'd want to polyfill `Promise`, `fetch`, and `Array.prototype.some` to handle all OS-supported browsers (as an example of "OS-supported", I mean only IE11+ because MSFT / Windows no longer supports lower versions)

## Rationale for approach

1. The `tokensOfOwner` method effectively always returns an empty array due to its underlying inefficiencies. It attempts to loop over all KC tokens and therefore always times out when running on a real node
  - Could run it on your own node and not timeout to get around this, but it's still horribly inefficient. Running my own node is a lot of added time / complexity too
  - Could get a cached copy of the chain, store it in a more easily parseable way (e.g. in some DB), and write an API to handle that.
    - This would either have to listen to events and update itself or just be stale :/ -- either way, much added complexity
  - The easiest solution seemed to be to just call the unofficial KC API to get a list of tokens for an owner, so ended up going with that
2. Once established that this project was more free-form (esp. since task 1 can't be done as written, via `tokensOfOwner`), I decided to eschew the back-end entirely as it's not really needed because it merely acts as a session store and a listener
  - If it's just a session store (based on the first two assumptions above), then we don't care about persisting transactions across devices or about viewing others' transactions
  - If it's just a session store, we don't need a back-end, we can store directly in the browser
    - Since we want _persistent_ sessions as if we had a back-end, we just use `localStorage` (for non-persistent could use `sessionStorage`)
  - If we need a listener, we can just listen _from the front-end_ using the same Web3 API methods
    - Just like with the back-end, if the session restarts (akin to the listener process / thread / server / container restarting), we just:
      - Start listening again after the restart
      - Check if any pending transactions were filled in the offline time (`getTransactionReceipt`)
3. I decided not to listen to events of the chain, i.e. the KC `Transfer` event, to update the status for a few reasons
  - We already need to use `getTransactionReceipt` in case of restarts
  - It's not the most efficient use of resources to hold a socket (or sockets) open to listen and filter each incoming event
    - Especially since we know the network is slow and we know there may be lots of volume
      - Basically we know the socket is going to be open for longer than we need it and we will likely have to filter
        - That's not an efficient use of resources
  - Instead, just long poll each transaction via `getTransactionReceipt` and update when the status eventually changes
    - We only check every 20s (since we know the network is slow, use 20s) instead of having a persistent connection
      - Exponential jitter would be better, but didn't implement it
    - We only poll the transactions we're waiting for and therefore don't need to filter at all
