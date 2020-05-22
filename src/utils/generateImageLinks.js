export default function* generateImageLinks(domain, extension, count) {
  let i = 0
  while (i < count) {
    yield `${domain}/${i}.${extension}`
    i++
  }
}
