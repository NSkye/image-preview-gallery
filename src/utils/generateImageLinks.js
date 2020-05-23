export default function* generateImageLinks(domain, extension, count, offset = 0) {
  let i = 0 + offset
  while (i < count + offset) {
    yield `${domain}/${i}.${extension}`
    i++
  }
}
