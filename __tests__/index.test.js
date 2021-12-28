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
})
