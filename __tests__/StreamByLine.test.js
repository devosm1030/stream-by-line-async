const { PassThrough } = require('stream')
const { resolve: pathResolve } = require('path')
const srcRoot = pathResolve(__dirname, '../pkg')
const { inspect } = require('util')

describe('StreamByLine.js unit tests', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.resetAllMocks()
    jest.clearAllMocks()
    jest.useRealTimers()
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

  describe('eachLine', () => {
    it('creates lineQueue and processes stream', async () => {
      expect.assertions(3)
      const { StreamByLine } = require(pathResolve(srcRoot, 'StreamByLine.js'))
      const sbl = new StreamByLine('mockstream')
      const mockCb = 'mockCb'
      const procStreamSpy = jest.spyOn(sbl, 'procStream').mockImplementation(() => Promise.resolve())
      await expect(sbl.eachLine(mockCb)).resolves.toBe(undefined)
      expect(procStreamSpy).toHaveBeenCalled()
      expect(sbl.lineQueue.lineCb).toEqual('mockCb')
    })
  })

  describe('procStream', () => {
    function Resolved () {
      this.resolved = new Promise(resolve => { this.resolve = resolve })
    }

    const sblWithMockedLineQueue = (stream, options = {}) => {
      const { StreamByLine } = require(pathResolve(srcRoot, 'StreamByLine.js'))
      const sbl = new StreamByLine(stream, options)
      const lines = []
      const lineAddPromises = [new Resolved()]
      sbl.lineQueue = {
        addLines: async linesin => {
          lineAddPromises[lineAddPromises.length - 1].resolve() // latest line is added
          lineAddPromises.push(new Resolved()) // prep a promise for the next add
          linesin.forEach(line => lines.push(line))
          await new Promise(resolve => setTimeout(resolve, 2000)) // 2s pause
        },
        done: () => Promise.resolve([])
      }
      return { sbl, lines, lineAddPromises }
    }

    it('throws error if any lines errored', async () => {
      expect.assertions(4)
      const { StreamByLine } = require(pathResolve(srcRoot, 'StreamByLine.js'))
      const mockedStream = new PassThrough()
      const sbl = new StreamByLine(mockedStream)
      const addLinesSpy = jest.fn(() => Promise.resolve())
      sbl.lineQueue = {
        addLines: addLinesSpy,
        done: () => Promise.resolve([new Error('line1 error'), new Error('line2 error')])
      }
      const streamDonePromise = sbl.procStream()
      let streamErr = null
      streamDonePromise.catch(e => { streamErr = e })
      mockedStream.push(Buffer.from('testline1\ntestline2', 'utf8'))
      mockedStream.end()
      await expect(streamDonePromise).rejects.toThrowError('One or more lines of stream did not process successfully.')
      expect(streamErr.lineErrors[0].message).toEqual('line1 error')
      expect(streamErr.lineErrors[1].message).toEqual('line2 error')
      expect(addLinesSpy).toHaveBeenCalledTimes(2)
    })

    it('successfully processes lines in a stream when stream ends in eol', async () => {
      expect.assertions(2)
      const { StreamByLine } = require(pathResolve(srcRoot, 'StreamByLine.js'))
      const mockedStream = new PassThrough()
      const sbl = new StreamByLine(mockedStream)
      let lines = []
      const mockAddLines = linesIn => {
        lines = lines.concat(linesIn)
        return Promise.resolve()
      }
      sbl.lineQueue = {
        addLines: mockAddLines,
        done: () => Promise.resolve([])
      }
      const streamDonePromise = sbl.procStream()
      mockedStream.push(Buffer.from('testline1\ntestline2\n', 'utf8'))
      mockedStream.end()
      await expect(streamDonePromise).resolves.toBe(undefined)
      expect(lines).toEqual(['testline1', 'testline2'])
    })

    it('successfully processes lines in a stream when stream ends without eol', async () => {
      expect.assertions(2)
      const { StreamByLine } = require(pathResolve(srcRoot, 'StreamByLine.js'))
      const mockedStream = new PassThrough()
      const sbl = new StreamByLine(mockedStream)
      let lines = []
      const mockAddLines = linesIn => {
        lines = lines.concat(linesIn)
        return Promise.resolve()
      }
      sbl.lineQueue = {
        addLines: mockAddLines,
        done: () => Promise.resolve([])
      }
      const streamDonePromise = sbl.procStream()
      mockedStream.push(Buffer.from('testline1\ntestline2', 'utf8'))
      mockedStream.end()
      await expect(streamDonePromise).resolves.toBe(undefined)
      expect(lines).toEqual(['testline1', 'testline2'])
    })

    it('stream reads wait for line callback delays', async () => {
      expect.assertions(19)
      jest.useFakeTimers()
      let nextChunks = null
      const streamActions = {}
      const streamReadSpy = jest.fn(() => nextChunks.shift())
      const mockStream = {
        on: (action, cb) => { streamActions[action] = cb },
        read: streamReadSpy
      }
      const { sbl, lines, lineAddPromises } = sblWithMockedLineQueue(mockStream)
      const procSteamPromise = sbl.procStream()
      nextChunks = ['line1\nline2', '\nline3', null]
      let nextLineAddPromise = lineAddPromises[lineAddPromises.length - 1]
      let readablePromise = streamActions.readable()
      let readableDone = new Resolved()
      readablePromise.then(() => {
        expect(nextChunks.length).toBe(0)
        readableDone.resolve()
      })
      await nextLineAddPromise.resolved // -- line added - 2s delay starts
      nextLineAddPromise = lineAddPromises[lineAddPromises.length - 1]
      expect(nextChunks.length).toBe(2)
      expect(streamReadSpy).toHaveBeenCalledTimes(1)
      jest.advanceTimersByTime(1000)

      // -- haven't read next chunk when first lines still pending
      expect(inspect(readableDone.resolved).includes('pending')).toBe(true)
      expect(nextChunks.length).toBe(2)
      expect(streamReadSpy).toHaveBeenCalledTimes(1)
      expect(lines).toEqual(['line1'])
      jest.advanceTimersByTime(1000)

      // -- second chunk read
      await nextLineAddPromise.resolved
      nextLineAddPromise = lineAddPromises[lineAddPromises.length - 1]
      expect(nextChunks.length).toBe(1)
      expect(streamReadSpy).toHaveBeenCalledTimes(2)
      expect(lines).toEqual(['line1', 'line2'])
      jest.advanceTimersByTime(2000)

      // -- no more chunks on first readable
      await readableDone.resolved
      expect(streamReadSpy).toHaveBeenCalledTimes(3)
      expect(lines).toEqual(['line1', 'line2'])

      // -- stream ready to go again - another readable event
      nextChunks = ['\nline4', null]
      readablePromise = streamActions.readable()
      readableDone = new Resolved()
      readablePromise.then(() => {
        expect(nextChunks.length).toBe(0)
        readableDone.resolve()
      })
      await nextLineAddPromise.resolved
      expect(nextChunks.length).toBe(1)
      expect(streamReadSpy).toHaveBeenCalledTimes(4)
      jest.advanceTimersByTime(2000)
      await readableDone.resolved
      expect(streamReadSpy).toHaveBeenCalledTimes(5)
      expect(lines).toEqual(['line1', 'line2', 'line3'])

      // -- stream is over - no more readables
      expect(inspect(procSteamPromise).includes('pending')).toBe(true)
      streamActions.end()
      await procSteamPromise
      expect(lines).toEqual(['line1', 'line2', 'line3', 'line4'])
    })
  })
})
