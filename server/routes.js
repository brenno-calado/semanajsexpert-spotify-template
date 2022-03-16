import { logger } from "./utils.js"
import config from "./config.js"
import { Controller } from "./controller/controller.js"

const { location, pages: { home, controller: controllerHTML }, constanst: { CONTENT_TYPE } } = config
const controller = new Controller()

async function routes(request, response) {
  const { method, url } = request

  if (method === 'GET' && url === '/') {
    response.writeHead(302, { 'Location': location.home })

    return response.end()
  }

  if (method === 'GET' && url === '/home') {
    const { stream } = await controller.getFileStream(home)

    return stream.pipe(response)
  }

  if (method === 'GET' && url === '/controller') {
    const { stream } = await controller.getFileStream(controllerHTML)

    return stream.pipe(response)
  }

  if (method === 'GET') {
    const { stream, type } = await controller.getFileStream(url)
    
    const contentType = CONTENT_TYPE[type]
    if (contentType) response.writeHead(200, { 'Content-Type': CONTENT_TYPE[type] })

    return stream.pipe(response)
  }

  response.writeHead(404)
  return response.end()
}

function errorHandler(error, response) {
  if (error.message?.includes('ENOENT')) {
    logger.warn(`asset not found ${error.stack}`)
    response.writeHead(404)
    return response.end()
  }

  logger.error(`caught error on API ${error.stack}`)
  response.writeHead(500)
  response.end()
}

export function handler(request, response) {
  return routes(request, response)
    .catch((error) => errorHandler(error, response))
}