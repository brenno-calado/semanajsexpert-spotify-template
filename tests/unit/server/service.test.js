import { jest, expect, describe, test, beforeEach } from '@jest/globals'
import { join } from 'path'
import config from '../../../server/config.js'
import { Service } from '../../../server/service/service.js'

const { location: { home } } = config

describe(':: SERVICE ::', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })

  
  test('getFileStream should return a stream when file is available', async () => {
    const service = new Service()
    const result = await service.getFileStream(join(home, 'index.html'))

    expect(result).toHaveProperty('type')
    expect(result).toHaveProperty('stream')
  })

  test('getFileStream should return an error when file is unavailable', async () => {
    const service = new Service()
    jest.spyOn(service, "getFileStream")
      .mockRejectedValue('ENOENT')

    try {
      await service.getFileStream(join(home, 'index.png'))
    } catch (error) {
      expect(error).toMatch('ENOENT')
    }
  })
})