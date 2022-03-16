import { jest, expect, describe, test, beforeEach } from '@jest/globals'
import { Controller } from '../../../server/controller/controller.js'
import { Service } from '../../../server/service/service.js'
import TestUtil from '../_util/testUtil.js'

describe(':: CONTROLLER ::', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })

  test('getFileStream should return Service.getFileStream payload', async () => {
    const controller = new Controller()
    const filename = '/index.html'
    const mockFs = TestUtil.generateReadableStream(['data'])

    jest.spyOn(Service.prototype, Service.prototype.getFileStream.name).mockResolvedValue({ stream: mockFs })

    const result = await controller.getFileStream(filename)
    expect(Service.prototype.getFileStream).toHaveBeenCalledWith(filename)
    expect(result).toHaveProperty('stream')
  })
})
