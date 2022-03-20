import fs from 'fs'
import fsPromises from 'fs/promises'
import { randomUUID } from 'crypto'
import { PassThrough, Writable } from 'stream'
import streamsPromises from 'stream/promises'
import { extname, join } from 'path'
import Throttle from 'throttle'
import ChildProcess from 'child_process'
import config from '../config.js'
import { logger } from '../utils.js'
import { once } from 'events'

const {
  dir: {
    publicDir
  },
  constants: {
    fallbackBitRate,
    computerConversation,
    bitRateDivisor
  }
} = config

export class Service {
  constructor() {
    this.clientStream = new Map()
    this.currentSound = computerConversation
    this.currentBitRate = 0
    this.throttleTransform = {}
    this.currentReadable = {}
  }

  createClientStream() {
    const id = randomUUID()
    const clientStream = new PassThrough()
    this.clientStream.set(id, clientStream)

    return {
      id,
      clientStream
    }
  }

  removeClientStream(id) {
    this.clientStream.delete(id)
  }

  _executeSoxCommand(args) {
    return ChildProcess.spawn('sox', args)
  }

  async getBitRate(sound) {
    try {
      const args = [
        '--i',
        '-B',
        sound
      ]

      const {
        stderr,
        stdout
      } = await this._executeSoxCommand(args)

      await Promise.all([
        once(stderr, 'readable'),
        once(stdout, 'readable')
      ])

      const [success, error] = [stdout, stderr].map(stream => stream.read())
      if (error) return await Promise.reject(error)

      return success
        .toString()
        .trim()
        .replace(/k/, '000')
    } catch (error) {
      logger.error(`Error at getBitRange: ${error}`)
      return fallbackBitRate
    }
  }

  broadCast() {
    return new Writable({
      write: (chunk, enc, cb) => {
        for (const [key, stream] of this.clientStream) {
          if (stream.writableEnded) {
            this.clientStream.delete(key);
            continue
          }
          stream.write(chunk)
        }

        cb()
      }
    })
  }

  async startStreaming() {
    logger.info(`Starting ${this.currentSound}`)
    const bitRate = this.currentBitRate = (await this.getBitRate(this.currentSound)) / bitRateDivisor
    const throttleTransform = new Throttle(bitRate)
    const readableSound = this.currentReadable = this.createFileStream(this.currentSound)
    return streamsPromises.pipeline(readableSound, throttleTransform, this.broadCast())
  }

  stopStreaming() {
    this.throttleTransform?.end?.()
  }

  createFileStream(filename) {
    return fs.createReadStream(filename)
  }

  async getFileInfo(file) {
    const filePath = join(publicDir, file)
    await fsPromises.access(filePath)
    const fileType = extname(filePath)
    return {
      type: fileType,
      name: filePath
    }
  }

  async getFileStream(file) {
    const { name, type } = await this.getFileInfo(file)
    return {
      stream: this.createFileStream(name),
      type
    }
  }
}
