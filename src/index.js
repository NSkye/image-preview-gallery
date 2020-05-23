import 'normalize.css'
import './index.css'
import generateImageLinks from './utils/generateImageLinks'
import Gallery from './Gallery'

// Base url for image server
const IMAGE_HOST = 'http://127.0.0.1:3999'

const imagesByYear = [
  ['2018', Array.from(generateImageLinks(IMAGE_HOST, 'jpg', 300, 0))],
  ['2019', Array.from(generateImageLinks(IMAGE_HOST, 'jpg', 300, 300))],
  ['2020', Array.from(generateImageLinks(IMAGE_HOST, 'jpg', 400, 600))],
]

new Gallery({ imagesByYear })
