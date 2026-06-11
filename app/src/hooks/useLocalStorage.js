import { useCallback, useEffect, useState } from 'react'

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Local storage can be unavailable in restricted browser contexts.
    }
  }, [key, value])

  const setStoredValue = useCallback((nextValue) => {
    setValue((currentValue) =>
      typeof nextValue === 'function' ? nextValue(currentValue) : nextValue,
    )
  }, [])

  return [value, setStoredValue]
}
