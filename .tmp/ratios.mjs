import { readFileSync } from 'node:fs'
const prim = JSON.parse(readFileSync('D:/IFANSHX/Project/Santaka-UI/packages/tokens/src/color.primitives.json', 'utf8')).color

function flatten(v) {
  const m = String(v).match(/^\{color\.([a-z-]+)\.([a-z0-9]+)\}$/)
  if (m) return prim.color ? prim[m[1]][m[2]].$value : prim[m[1]][m[2]].$value
  return String(v)
}
function lum(hex) {
  const h = hex.replace('#', '')
  const f = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
  const a = f.map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)))
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]
}
function ratio(a, b) {
  const L1 = lum(a), L2 = lum(b)
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1]
  return (hi + 0.05) / (lo + 0.05)
}
const fg = (p) => (p.startsWith('{') ? flatten(p) : p)
console.log('success-fg on success-subtle:', ratio('#166534', '#E9F6ED').toFixed(2))
console.log('warning-fg on warning-subtle:', ratio('#92400E', '#FCF3E4').toFixed(2))
console.log('danger-fg on danger-subtle:', ratio('#B91C1C', '#FDEDED').toFixed(2))
