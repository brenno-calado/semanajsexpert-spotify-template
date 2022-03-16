import { Service } from "../service/service.js";

export class Controller {
  constructor() {
    this.Service = new Service()
  }

  async getFileStream(filename) {
    return this.Service.getFileStream(filename)
  }
}
