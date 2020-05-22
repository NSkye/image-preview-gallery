const path = require('path')
const https = require('https')
const fs = require('fs-extra')
const stream = require('stream')
const getImageLinks = require('./getImageLinks')

const downloadImage = url => new Promise(resolve => https.request(url, response => {
  const data = new stream.Transform()
  response.on('data', chunk => data.push(chunk))
  response.on('end', () => resolve(data))
}).end())

const writeImage = (path, data) => new Promise(resolve => {
  fs.writeFile(path, data.read(), () => resolve())
})

const getImage = (url, path) => downloadImage(url)
  .then(data => writeImage(path, data))
  .catch(error => console.error(error))

module.exports = () => fs.remove(path.resolve(__dirname, 'images'))
  .then(() => fs.ensureDir(path.resolve(__dirname, 'images')))
  .then(() => getImageLinks(path.resolve(__dirname, 'imgHash')))
  .then(links => Promise.all(links.map((link, i) => getImage(link, path.resolve(__dirname, `images/${i}.jpg`)))))
