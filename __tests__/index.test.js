const { PassThrough } = require('stream')
const { resolve: pathResolve } = require('path')
const projectRoot = pathResolve(__dirname, '..')

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
    const { StreamByLine, preserveEol, noEol } = require(pathResolve(projectRoot, 'index.js'))
    expect(new StreamByLine({ eol: preserveEol }).eol === preserveEol).toBe(true)
    expect(new StreamByLine().eol === noEol).toBe(true)
  })

  it('streams', async () => {
    expect.assertions(3)
    const { StreamByLine } = require(pathResolve(projectRoot, 'index.js'))
    const mockedStream = new PassThrough()
    const stream = new StreamByLine(mockedStream)
    let lines = []
    const streamDonePromise = stream.eachLine(chunk => { lines = lines.concat(chunk.split('\n')) })
    mockedStream.push(Buffer.from('test line 1\n', 'utf8'))
    mockedStream.push(Buffer.from('test line 2\n', 'utf8'))
    mockedStream.end()
    mockedStream.destroy()
    await expect(streamDonePromise).resolves.toBe(undefined)
    expect(lines[0]).toEqual('test line 1')
    expect(lines[1]).toEqual('test line 2')
  })
})
