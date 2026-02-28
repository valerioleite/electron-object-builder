import { debounce } from '../debounce'

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not call the function immediately', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced()

    expect(fn).not.toHaveBeenCalled()
  })

  it('calls the function after the delay', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced()
    vi.advanceTimersByTime(100)

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('resets the timer on subsequent calls and only fires the last one', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced()
    vi.advanceTimersByTime(50)

    debounced()
    vi.advanceTimersByTime(50)

    // 100ms total elapsed, but only 50ms since the second call
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(50)

    // Now 100ms since the second call
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('passes the correct arguments to the debounced function', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced('hello', 42)
    vi.advanceTimersByTime(100)

    expect(fn).toHaveBeenCalledWith('hello', 42)
  })

  it('cancel() prevents the pending execution', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced()
    debounced.cancel()
    vi.advanceTimersByTime(200)

    expect(fn).not.toHaveBeenCalled()
  })

  it('cancel() is a no-op when no call is pending', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    // Cancel without any pending call should not throw
    expect(() => debounced.cancel()).not.toThrow()
  })

  it('multiple rapid calls only fire once with the last arguments', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced('first')
    debounced('second')
    debounced('third')
    debounced('fourth')
    debounced('fifth')

    vi.advanceTimersByTime(100)

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('fifth')
  })

  it('can be called again after the delay has passed', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced('first')
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('first')

    debounced('second')
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenCalledWith('second')
  })

  it('can be called again after cancel', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced('canceled')
    debounced.cancel()

    debounced('active')
    vi.advanceTimersByTime(100)

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('active')
  })
})
