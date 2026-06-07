const FALLBACK = 'icon'

export function toKebabSlug(name: string): string {
  const slug = name
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]/gi, '')
    .toLowerCase()
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return slug || FALLBACK
}

export function toPascalComponentName(name: string): string {
  const slug = toKebabSlug(name)

  const pascal = slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')

  if (/^\d/.test(pascal)) return `Icon${pascal}`
  return pascal
}
