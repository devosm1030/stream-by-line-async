// const { PassThrough } = require('stream')
const { resolve: pathResolve } = require('path')
const srcRoot = pathResolve(__dirname, '../pkg')

describe('StreamByLine.js unit tests', () => {
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

  describe('constructor', () => {
    it('sets options correctly based on parameters sent', () => {
      expect.assertions(9)
      const { StreamByLine } = require(pathResolve(srcRoot, 'StreamByLine.js'))
      expect(() => new StreamByLine()).toThrowError('Cannot instantiate StreamByLine without a stream.')
      const sbl1 = new StreamByLine('mockstream')
      expect(sbl1.preserveEol).toBe(false)
      expect(sbl1.lineDelim).toBe(null)
      expect(sbl1.preserveEmptyLines).toBe(false)
      const sbl2 = new StreamByLine('mockstream', { preserveEol: true, lineDelim: ';', preserveEmptyLines: true, rando: 'blah' })
      expect(sbl2.preserveEol).toBe(true)
      expect(sbl2.lineDelim).toEqual(';')
      expect(sbl2.preserveEmptyLines).toBe(true)
      expect(sbl2.rando).toBe(undefined)
      const sbl3 = new StreamByLine('mockstream', { preserveEol: false })
      expect(sbl3.preserveEol).toBe(false)
    })
  })

  describe('eachLine', () => {
    it('creates new linequeue and processes the stream', async () => {
      expect.assertions(3)
      const { StreamByLine } = require(pathResolve(srcRoot, 'StreamByLine.js'))
      const mockCb = jest.fn()
      const sbl = new StreamByLine('mockstream')
      const procStreamSpy = jest.spyOn(sbl, 'procStream').mockImplementation(() => Promise.resolve())
      await expect(sbl.eachLine(mockCb)).resolves.toBe(undefined)
      sbl.lineQueue.lineCb('mockline')
      expect(procStreamSpy).toHaveBeenCalled()
      expect(mockCb).toHaveBeenCalledWith('mockline')
    })
  })

  describe('queueChunk', () => {
    const sblWithMockedLineQueue = (options = {}) => {
      const { StreamByLine } = require(pathResolve(srcRoot, 'StreamByLine.js'))
      const sbl = new StreamByLine('mockstream', options)
      const addLinesParams = []
      sbl.lineQueue = {
        addLines: lines => {
          addLinesParams.push(lines)
          return Promise.resolve()
        }
      }
      return { sbl, addLinesParams }
    }

    it('handles chunk with no line break as all leftovers', async () => {
      expect.assertions(2)
      const { sbl, addLinesParams } = sblWithMockedLineQueue()
      await expect(sbl.queueChunk('data with no line break', 'part1 ')).resolves.toEqual('part1 data with no line break')
      expect(addLinesParams).toEqual([[]]) // -- empty line array passed
    })

    it('handles leftovers and blank lines correctly', async () => {
      expect.assertions(8)
      const { sbl, addLinesParams } = sblWithMockedLineQueue()
      let leftover = await sbl.queueChunk('l1p2\nl2\n\nl3p1 ', 'l1p1 ')
      expect(leftover).toEqual('l3p1 ')
      expect(addLinesParams).toEqual([['l1p1 l1p2', 'l2']])
      leftover = await sbl.queueChunk('l3p2\n', leftover)
      expect(addLinesParams[1]).toEqual(['l3p1 l3p2'])
      expect(leftover).toEqual('')
      leftover = await sbl.queueChunk('l4\n', leftover)
      expect(addLinesParams[2]).toEqual(['l4'])
      expect(leftover).toEqual('')
      leftover = await sbl.queueChunk('l5', leftover)
      expect(addLinesParams[3]).toEqual([])
      expect(leftover).toEqual('l5')
    })

    it('keeps blank lines when requested', async () => {
      expect.assertions(2)
      const { sbl, addLinesParams } = sblWithMockedLineQueue({ preserveEmptyLines: true })
      await expect(sbl.queueChunk('l1p2\nl2\n\nl3p1 ', 'l1p1 ')).resolves.toEqual('l3p1 ')
      expect(addLinesParams).toEqual([['l1p1 l1p2', 'l2', '']])
    })

    it('handles win line endings correctly', async () => {
      expect.assertions(8)
      const { sbl, addLinesParams } = sblWithMockedLineQueue({ preserveEol: true })
      let leftover = await sbl.queueChunk('l1p2\r\nl2\r\n\r\nl3p1 ', 'l1p1 ')
      expect(leftover).toEqual('l3p1 ')
      expect(addLinesParams).toEqual([['l1p1 l1p2\r\n', 'l2\r\n']])
      leftover = await sbl.queueChunk('l3p2\r\n', leftover)
      expect(addLinesParams[1]).toEqual(['l3p1 l3p2\r\n'])
      expect(leftover).toEqual('')
      leftover = await sbl.queueChunk('l4\r', leftover)
      expect(addLinesParams[2]).toEqual([])
      expect(leftover).toEqual('l4\r')
      leftover = await sbl.queueChunk('\nl5', leftover)
      expect(addLinesParams[3]).toEqual(['l4\r\n'])
      expect(leftover).toEqual('l5')
    })

    it('handles custom line endings correctly', async () => {
      expect.assertions(8)
      const { sbl, addLinesParams } = sblWithMockedLineQueue({ preserveEol: true, lineDelim: ';' })
      let leftover = await sbl.queueChunk('l1p2;l2;;l3p1 ', 'l1p1 ')
      expect(leftover).toEqual('l3p1 ')
      expect(addLinesParams).toEqual([['l1p1 l1p2;', 'l2;']])
      leftover = await sbl.queueChunk('l3p2;', leftover)
      expect(addLinesParams[1]).toEqual(['l3p1 l3p2;'])
      expect(leftover).toEqual('')
      leftover = await sbl.queueChunk('l4\n', leftover)
      expect(addLinesParams[2]).toEqual([])
      expect(leftover).toEqual('l4\n')
      leftover = await sbl.queueChunk(';l5', leftover)
      expect(addLinesParams[3]).toEqual(['l4\n;'])
      expect(leftover).toEqual('l5')
    })
  })

  /* it('streams', async () => {
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
  */
})
