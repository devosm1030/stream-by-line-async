const { LineQueue } = require('./LineQueue')
const { StreamByLineError } = require('./StreamByLineError')

class StreamByLine {
  constructor (...args) {
    this.init(...args)
  }

  init (stream, options = {}) {
    this.stream = stream
    const dflts = {
      preserveEol: false, // -- keep eol with each line during processing
      lineDelim: null, // -- optional custom line delimiter
      preserveEmptyLines: false // -- pass empty lines to processing?
    }
    Object.keys(dflts).forEach(key => {
      this[key] = options[key] !== undefined ? options[key] : dflts[key]
    })
  }

  async queueChunk (data, leftOvers) {
    let delim = this.lineDelim || '\r\n' // try win eol first
    let lines = (leftOvers + data).split(delim)
    if ((!this.lineDelim) && lines.length === 1) {
      delim = '\n' // no custom or win eol found - try linux eol
      lines = (leftOvers + data).split(delim)
    }
    leftOvers = lines.pop()
    if (!this.preserveEmptyLines) lines = lines.filter(line => line !== '')
    if (this.preserveEol) lines = lines.map(line => line + delim)
    await this.lineQueue.addLines(lines)
    return leftOvers
  }

  async procStream () {
    let leftOvers = ''
    let endOfStreamResolve = null
    const endOfStream = new Promise(resolve => { endOfStreamResolve = resolve })
    this.stream.on('readable', async () => {
      let chunk = null
      while ((chunk = this.stream.read()) !== null) {
        leftOvers = await this.queueChunk(chunk.toString(), leftOvers)
      }
    })
    this.stream.on('end', () => { endOfStreamResolve() })
    await endOfStream
    if (leftOvers) this.lineQueue.addLines([leftOvers])
    const lineErrs = await this.lineQueue.done()
    if (lineErrs.length > 0) throw new StreamByLineError('One or more lines of stream did not process successfully.', lineErrs)
  }

  async eachLine (cb) {
    this.lineQueue = new LineQueue(cb)
    await this.procStream()
  }
}

module.exports = { StreamByLine }
