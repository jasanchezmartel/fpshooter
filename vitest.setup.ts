import { vi } from 'vitest'

// Polyfill for AudioContext which is missing in jsdom
if (typeof window !== 'undefined') {
  class MockAudioContext {
    createGain() {
      return {
        connect: () => {},
        gain: {
          value: 0,
          setTargetAtTime: () => {},
          linearRampToValueAtTime: () => {},
          exponentialRampToValueAtTime: () => {},
          setValueAtTime: () => {},
        },
      }
    }
    createPanner() {
      return {
        connect: () => {},
        setPosition: () => {},
        setOrientation: () => {},
        rolloffFactor: 0,
        distanceModel: '',
        refDistance: 0,
      }
    }
    decodeAudioData() {
      return Promise.resolve({})
    }
  }

  ;(window as any).AudioContext = (window as any).AudioContext || MockAudioContext
  ;(window as any).webkitAudioContext = (window as any).webkitAudioContext || MockAudioContext

  // Pointer Lock API polyfill for JSDOM
  if (typeof HTMLElement !== 'undefined') {
    HTMLElement.prototype.requestPointerLock =
      HTMLElement.prototype.requestPointerLock || vi.fn().mockResolvedValue(undefined)
  }
  if (typeof document !== 'undefined') {
    ;(document as any).exitPointerLock = (document as any).exitPointerLock || vi.fn()
  }
}

// Mock WebGLRenderer
import { WebGLRenderer } from 'three'
vi.mock('three', async () => {
  const actual = (await vi.importActual('three')) as any
  return {
    ...actual,
    WebGLRenderer: vi.fn().mockImplementation(function () {
      return {
        setSize: vi.fn(),
        render: vi.fn(),
        setAnimationLoop: vi.fn(),
        domElement: document.createElement('canvas'),
        setPixelRatio: vi.fn(),
        dispose: vi.fn(),
      }
    }),
  }
})

// Minimal polyfill for AudioLoader to avoid network calls and URL errors in tests
// This allows the Enemy class to be instantiated without failing on sound loading.
import { AudioLoader } from 'three'
AudioLoader.prototype.load = function (url: string, onLoad: Function) {
  // Simulate successful load with a dummy buffer
  setTimeout(() => onLoad({}), 0)
}
