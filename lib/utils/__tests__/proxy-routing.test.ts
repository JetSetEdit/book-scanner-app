import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { proxy } from '../../../proxy'

function requestFor(path: string, host = 'subtextscanner.com.au') {
  return new NextRequest(`https://${host}${path}`)
}

describe('proxy routing', () => {
  it('redirects /scanner to /scan', () => {
    const response = proxy(requestFor('/scanner'))
    expect(response.status).toBe(301)
    expect(response.headers.get('location')).toBe('https://subtextscanner.com.au/scan')
  })

  it('allows /scan without VIP cookie', () => {
    const response = proxy(requestFor('/scan'))
    expect(response.status).toBe(200)
    expect(response.headers.get('location')).toBeNull()
  })

  it('allows book result routes without VIP cookie', () => {
    const response = proxy(requestFor('/book/9780593804216'))
    expect(response.status).toBe(200)
    expect(response.headers.get('location')).toBeNull()
  })

  it('allows supporting routes without VIP cookie', () => {
    for (const path of ['/bookshelf', '/help', '/privacy', '/policy']) {
      const response = proxy(requestFor(path))
      expect(response.status).toBe(200)
      expect(response.headers.get('location')).toBeNull()
    }
  })
})
