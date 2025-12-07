import Script from 'next/script'
import { useMemo } from 'react'

interface StructuredDataProps {
  data: object
}

export function StructuredData({ data }: StructuredDataProps) {
  // Generate a unique ID based on the data type
  const scriptId = useMemo(() => {
    const dataObj = data as any
    const type = dataObj['@type'] || 'structured-data'
    return `structured-data-${type.toLowerCase()}`
  }, [data])

  return (
    <Script
      id={scriptId}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
