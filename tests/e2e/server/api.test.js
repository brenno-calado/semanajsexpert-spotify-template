import { jest, expect, describe, test } from '@jest/globals'
import superTest from 'supertest'
import portFinder from 'portfinder'
import { Transform } from 'stream'
import { setTimeout } from 'timers/promises'

import Server from '../../../server/server.js'
const getAvailablePort = portFinder.getPortPromise
const AWAIT_DATA_INTERVAL = 200
const COMMAND_RESPONSE = JSON.stringify({ result: 'OK' })
const COMMAND = {
  start: 'start',
  stop: 'stop'
}

describe(':: API E2E suite Test ::', () => {
  function pipeAndReadStream(stream, onChunk) {
    const transform = new Transform({
      transform(chunk, enc, cb) {
        onChunk(chunk)
        cb(null, chunk)
      }
    })

    return stream.pipe(transform)
  }

  describe('client workflow', () => {
    async function getTestServer() {
      const getSuperTest = port => superTest(`http://localhost:${port}`)
      const port = await getAvailablePort()
      return new Promise((resolve, reject) => {
        const server = Server.listen(port)
          .once('listening', () => {
            const testServer = getSuperTest(port)
            const response = {
              testServer,
              kill() {
                server.close()
              }
            }

            return resolve(response)
          })
        .once('error', reject)
      })
    }

    function commandSender(testServer) {
      return {
        async send(command) {
          const response = await testServer.post('/controller')
            .send({ command })

          expect(response.text).toStrictEqual(COMMAND_RESPONSE)
        }
      }
    }

    test('should not receive data stream if the process is not playing', async () => {
      const server = await getTestServer()
      const onChunk = jest.fn()

      pipeAndReadStream(
        server.testServer.get('/stream'),
        onChunk
      )
      await setTimeout(AWAIT_DATA_INTERVAL)
      server.kill()

      expect(onChunk).not.toHaveBeenCalled()
    })

    test('should receive data stream if the process is playing', async () => {
      const server = await getTestServer()
      const onChunk = jest.fn()
      const { send } = commandSender(server.testServer)

      pipeAndReadStream(server.testServer.get('/stream'), onChunk)

      await send(COMMAND.start)
      await setTimeout(AWAIT_DATA_INTERVAL)
      await send(COMMAND.stop)

      expect(onChunk.mock.calls[0][0]).toBeInstanceOf(Buffer)

      server.kill()
    })
  })
})
