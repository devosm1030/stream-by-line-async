const { PassThrough } = require('stream')
const { resolve: pathResolve } = require('path')
const srcRoot = pathResolve(__dirname, '../src')

describe('index.js unit tests', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.resetAllMocks()
    jest.clearAllMocks()
  })

  afterAll(() => {
    jest.resetModules()
  })

  it('works', () => {
    expect.assertions(2)
    const { StreamByLine, preserveEol, noEol } = require(pathResolve(srcRoot, 'StreamByLine.js'))
    expect(new StreamByLine({ eol: preserveEol }).eol === preserveEol).toBe(true)
    expect(new StreamByLine().eol === noEol).toBe(true)
  })

  it('streams', async () => {
    expect.assertions(5)
    const { StreamByLine } = require(pathResolve(srcRoot, 'StreamByLine.js'))
    const mockedStream = new PassThrough()
    const stream = new StreamByLine(mockedStream)
    let lines = []
    const streamDonePromise = stream.eachLine(chunk => { lines = lines.concat(chunk.split('\n')) })
    mockedStream.push(Buffer.from('test line 1\nb\nc\nddd', 'utf8'))
    mockedStream.push(Buffer.from('test line 2', 'utf8'))
    mockedStream.end()
    await expect(streamDonePromise).resolves.toBe(undefined)
    expect(lines[0]).toEqual('test line 1')
    expect(lines[1]).toEqual('b')
    expect(lines[2]).toEqual('c')
    expect(lines[3]).toEqual('dddtest line 2')
  })
})
