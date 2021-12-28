const preserveEol = Symbol('preserveEol')
const noEol = Symbol('noEol')
const nxEol = Symbol('nxEol')
const winEol = Symbol('winEol')

class StreamByLine {
  constructor (...args) {
    this.init(...args)
  }

  init (options = {}) {
    const dflts = {
      eol: noEol
    }
    Object.keys(dflts).forEach(key => {
      this[key] = options[key] !== undefined ? options[key] : dflts[key]
    })
    this.streamDonePromise = new Promise((resolve, reject) => {
      this.streamDone = resolve
      this.streamError = reject
    })
  }

  startStream () {
    // foreach line => this.lineCallback(line)
    this.streamDone()
  }

  eachLine (cb) {
    this.lineCallback = cb
    this.startStream()
    return this.streamDonePromise
  }
}

module.exports = { StreamByLine, preserveEol, noEol, nxEol, winEol }
