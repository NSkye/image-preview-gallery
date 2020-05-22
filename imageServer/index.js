const path = require('path')
const http = require('http')
const fs = require('fs-extra')
const getImages = require('./getImages')

const createImageServer = () => http.createServer(async (req, res) => {
  const imageName = req.url.slice(1)
  const imagePath = path.resolve(__dirname, `images/${imageName}`)
  const imageExists = imageName && await fs.pathExists(imagePath)
  if (!imageExists) {
    res.statusCode = 404
    res.setHeader('Content-length', 0)
    res.end()
    return
  }

  const imageReadStream = fs.createReadStream(imagePath)
  imageReadStream.on('open', () => {
    res.statusCode = 200
    res.setHeader('Content-Type', 'image/jpeg')
    res.setHeader('Access-Control-Allow-Origin', '*')
    imageReadStream.pipe(res)
  })
})

const start = async (hostname, port) => {
  const imagesExist = await fs.exists(path.resolve(__dirname, 'images'))
  if (!imagesExist) {
    await getImages()
  }

  createImageServer().listen(port, hostname, () => {
    console.log(`Image server is running at http://${hostname}:${port}/`)
  })
}

start('127.0.0.1', '3999')
