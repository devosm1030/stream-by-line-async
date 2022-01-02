class LineQueue {
  constructor (...args) {
    this.init(...args)
  }

  init (lineCb) {
    this.lineCb = lineCb
    this.lineErrs = []
    this.isDraining = false
  }

  done () {
    return Promise.resolve(this.lineErrs)
  }

  addLines (lines) {
    lines.forEach(line => {
      this.lineCb(line)
    })
    return Promise.resolve()
  }
}

module.exports = ({ LineQueue })
