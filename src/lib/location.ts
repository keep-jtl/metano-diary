import type { EntryPlace } from '../types'

interface NominatimAddress {
  city?: string
  town?: string
  county?: string
  state?: string
  city_district?: string
  district?: string
  suburb?: string
  neighbourhood?: string
  road?: string
}

interface BigDataCloudResult {
  principalSubdivision?: string
  city?: string
  locality?: string
}

interface NominatimResult {
  display_name?: string
  address?: NominatimAddress
}

function joinParts(parts: (string | undefined)[]): string {
  const picked: string[] = []
  for (const part of parts) {
    const value = part?.trim()
    if (value && !picked.includes(value)) picked.push(value)
    if (picked.length >= 2) break
  }
  const label = picked.join(' · ')
  return label.length > 28 ? `${label.slice(0, 27)}…` : label
}

async function lookupBigDataCloud(lat: number, lng: number): Promise<string> {
  const url = new URL('https://api.bigdatacloud.net/data/reverse-geocode-client')
  url.searchParams.set('latitude', String(lat))
  url.searchParams.set('longitude', String(lng))
  url.searchParams.set('localityLanguage', 'zh-Hans')
  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(6000),
  })
  if (!response.ok) return ''
  const data = (await response.json()) as BigDataCloudResult
  return joinParts([data.principalSubdivision, data.city || data.locality])
}

function shortenPlace(result: NominatimResult): string {
  const address = result.address || {}
  const city = address.city || address.town || address.county || address.state || ''
  const district = address.city_district || address.district || address.suburb || ''
  const road = address.road || address.neighbourhood || ''
  const parts: string[] = []
  for (const part of [city, district, road]) {
    if (part && !parts.includes(part)) parts.push(part)
    if (parts.length >= 2) break
  }
  if (parts.length === 0 && result.display_name) {
    parts.push(result.display_name.split(',')[0])
  }
  const label = parts.join(' · ')
  return label.length > 28 ? `${label.slice(0, 27)}…` : label
}

/**
 * 只取城市/区/街道级别，不把精确门牌写进日记。
 * 反查地名会向 BigDataCloud（优先）或 OpenStreetMap 发送一次坐标；
 * 都失败时退回“当前位置”，用户可以在输入框里手动写“家/学校/公司”。
 */
export async function locateCurrentPlace(): Promise<EntryPlace> {
  if (!navigator.geolocation) throw new Error('这个设备不支持定位')

  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 60000,
    })
  })

  const lat = position.coords.latitude
  const lng = position.coords.longitude
  let label = ''

  try {
    label = await lookupBigDataCloud(lat, lng)
  } catch {
    /* 换一个服务再试 */
  }

  if (!label) {
    try {
      const url = new URL('https://nominatim.openstreetmap.org/reverse')
      url.searchParams.set('format', 'jsonv2')
      url.searchParams.set('lat', String(lat))
      url.searchParams.set('lon', String(lng))
      url.searchParams.set('zoom', '16')
      url.searchParams.set('addressdetails', '1')
      url.searchParams.set('accept-language', 'zh-CN')
      const response = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(8000),
      })
      if (response.ok) {
        label = shortenPlace((await response.json()) as NominatimResult)
      }
    } catch {
      /* 没网或反查失败时，仍然保留坐标，让用户自己写地点 */
    }
  }

  return { lat, lng, label: label || '当前位置' }
}
