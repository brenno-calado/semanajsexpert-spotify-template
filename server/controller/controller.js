import { Service } from "../service/service.js";
import { logger } from "../utils.js"
export class Controller {
  constructor() {
    this.Service = new Service()
  }

  async getFileStream(filename) {
    return this.Service.getFileStream(filename)
  }

  async handleCommand({ command }) {
    logger.info(`command received: ${command}`)
    const result = { result: 'OK' }
    const cmd = command.toLowerCase()
    if (cmd.includes('start')) {
      this.Service.startStreaming()
      return result
    }
    if (cmd.includes('stop')) {
      this.Service.stopStreaming()
      return result
    }
  }

  createClientStream() {
    const { id, clientStream } = this.Service.createClientStream()
  
    const onClose = () => {
      logger.info(`closing ${id} connection`)
      this.Service.removeClientStream(id)
    }

    return {
      stream: clientStream,
      onClose,
    }
  }
}
