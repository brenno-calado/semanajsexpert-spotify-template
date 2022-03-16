import fs from 'fs'
import { extname, join } from 'path'
import config from '../config.js'
import fsPromises from 'fs/promises'

const {
  dir: {
    publicDir
  }
} = config

export class Service {
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
