const preserveEol = Symbol('preserveEol')
const noEol = Symbol('noEol')
const nxEol = Symbol('nxEol')
const winEol = Symbol('winEol')

class StreamByLine {
  constructor (...args) {
    this.init(...args)
  }

  init (stream, options = {}) {
    this.stream = stream
    const dflts = {
      eol: noEol
    }
    Object.keys(dflts).forEach(key => {
      this[key] = options[key] !== undefined ? options[key] : dflts[key]
    })
  }

  queueChunk (data) {
    this.lineCallback(data)
    return Promise.resolve()
  }

  async procStream () {
    let endOfStreamResolve = null
    const endOfStream = new Promise(resolve => { endOfStreamResolve = resolve })
    this.stream.on('readable', async () => {
      let chunk = null
      while ((chunk = this.stream.read()) !== null) {
        await this.queueChunk(chunk.toString())
      }
    })
    this.stream.on('end', () => { endOfStreamResolve() })
    await endOfStream
    // TODO - await queue processing
  }

  async eachLine (cb) {
    this.lineCallback = cb
    await this.procStream()
  }
}

module.exports = { StreamByLine, preserveEol, noEol, nxEol, winEol }
