class StreamByLineError extends Error {
  constructor (message, lineErrors) {
    super(message)
    this.lineErrors = lineErrors
  }
}

module.exports = ({ StreamByLineError })
