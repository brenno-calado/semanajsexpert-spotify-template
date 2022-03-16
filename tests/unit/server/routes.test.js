import { jest, expect, describe, test, beforeEach } from '@jest/globals'
import config from '../../../server/config.js'
import { Controller } from '../../../server/controller/controller.js'
import { handler } from '../../../server/routes.js'
import TestUtil from '../_util/testUtil.js'

const { pages, location, constants } = config

describe(':: ROUTES :: ', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })

  test('GET / - should redirect to /home', async () => {
    const params = TestUtil.defaultHandleParams()
    params.request.method = 'GET'
    params.request.url = '/'

    await handler(...params.values())

    expect(params.response.writeHead).toBeCalledWith(302, { 'Location': location.home })
    expect(params.response.end).toHaveBeenCalled()
  })

  test(`GET /home should return with ${pages.home} file stream`, async () => {
    const params = TestUtil.defaultHandleParams()
    params.request.method = 'GET'
    params.request.url = '/home'
    const mockFs = TestUtil.generateReadableStream(['data'])

    jest.spyOn(Controller.prototype, Controller.prototype.getFileStream.name).mockResolvedValue({ stream: mockFs })
    jest.spyOn(mockFs, "pipe").mockReturnValue()

    await handler(...params.values())

    expect(Controller.prototype.getFileStream).toHaveBeenCalledWith(pages.home)
    expect(mockFs.pipe).toHaveBeenCalledWith(params.response)
  })

  test(`GET /controller should return ${pages.controller} file stream`, async () => {
    const params = TestUtil.defaultHandleParams()
    params.request.method = 'GET'
    params.request.url = '/controller'
    const mockFs = TestUtil.generateReadableStream(['data'])

    jest.spyOn(Controller.prototype, Controller.prototype.getFileStream.name).mockResolvedValue({ stream: mockFs })
    jest.spyOn(mockFs, "pipe").mockReturnValue()

    await handler(...params.values())

    expect(Controller.prototype.getFileStream).toHaveBeenCalledWith(pages.controller)
    expect(mockFs.pipe).toHaveBeenCalledWith(params.response)
  })

  test('GET /index.html should return a file stream', async () => {
    const params = TestUtil.defaultHandleParams()
    const filename = '/index.html'
    params.request.method = 'GET'
    params.request.url = filename
    const expectedType = '.html'
    const mockFs = TestUtil.generateReadableStream(['data'])

    jest.spyOn(Controller.prototype, Controller.prototype.getFileStream.name)
      .mockResolvedValue({ stream: mockFs, type: expectedType })
    jest.spyOn(mockFs, "pipe").mockReturnValue()

    await handler(...params.values())

    expect(Controller.prototype.getFileStream).toHaveBeenCalledWith(filename)
    expect(mockFs.pipe).toHaveBeenCalledWith(params.response)
    expect(params.response.writeHead).toHaveBeenCalledWith(
      200,
      { 'Content-Type': constants.CONTENT_TYPE[expectedType] }
    )
  })

  test('GET /file.ext should return a file stream', async () => {
    const params = TestUtil.defaultHandleParams()
    const filename = '/file.ext'
    params.request.method = 'GET'
    params.request.url = filename
    const expectedType = '.ext'
    const mockFs = TestUtil.generateReadableStream(['data'])

    jest.spyOn(Controller.prototype, Controller.prototype.getFileStream.name)
      .mockResolvedValue({ stream: mockFs, type: expectedType })
    jest.spyOn(mockFs, "pipe").mockReturnValue()

    await handler(...params.values())

    expect(Controller.prototype.getFileStream).toHaveBeenCalledWith(filename)
    expect(mockFs.pipe).toHaveBeenCalledWith(params.response)
    expect(params.response.writeHead).not.toHaveBeenCalledWith(
      200,
      { 'Content-Type': constants.CONTENT_TYPE[expectedType] }
    )
  })

  test('GET /unknown-route should return with status code 404', async () => {
    const params = TestUtil.defaultHandleParams()
    params.request.method = 'POST'
    params.request.url = 'unknown-route'

    await handler(...params.values())

    expect(params.response.writeHead).toHaveBeenCalledWith(404)
    expect(params.response.end).toHaveBeenCalled()
  })

  describe('exceptions', () => {
    test('given inexistent file, it should respond with 404', async () => {
      const params = TestUtil.defaultHandleParams()
      params.request.method = 'GET'
      params.request.url = '/index.png'
      jest.spyOn(Controller.prototype, Controller.prototype.getFileStream.name)
        .mockRejectedValue(new Error('Error: ENOENT: no such file or directory'))

      await handler(...params.values())
      expect(params.response.writeHead).toHaveBeenCalledWith(404)
      expect(params.response.end).toHaveBeenCalled()
    })

    test('given an error, it should respond with 500', async () => {
      const params = TestUtil.defaultHandleParams()
      params.request.method = 'GET'
      params.request.url = '/index.png'
      jest.spyOn(Controller.prototype, Controller.prototype.getFileStream.name)
        .mockRejectedValue(new Error('Error'))

      await handler(...params.values())
      expect(params.response.writeHead).toHaveBeenCalledWith(500)
      expect(params.response.end).toHaveBeenCalled()
    })
  })
})
