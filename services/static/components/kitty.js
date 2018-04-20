import React, { Component } from 'react'

class Kitty extends Component {
  state = {
    hideJSON: true
  }
  toggleJSON = () => this.setState((state) => ({hideJSON: !state.hideJSON}))
  render = () => {
    let {kitty} = this.props
    let {hideJSON} = this.state
    return <div>
      {/* same width as CK UI */}
      <img src={kitty.image_url_cdn} width='217' />
      <br />
      {/* same way that CK UI shows names */}
      {kitty.name || 'Kitty #' + kitty.id}
      <br />
      <button onClick={this.toggleJSON}>Toggle JSON</button>
      <br />
      {hideJSON ? null : <small>{JSON.stringify(kitty)}</small>}
    </div>
  }
}

export default Kitty
