import 'normalize.css'
import './index.css'
import generateImageLinks from './utils/generateImageLinks'
import GalleryApp from './GalleryApp'

// Base url for image server
const IMAGE_HOST = 'http://127.0.0.1:3999'

// Total number of images
const IMAGE_COUNT = 1000

new GalleryApp({
  imageLinks: Array.from(generateImageLinks(IMAGE_HOST, 'jpg', IMAGE_COUNT)),
  imageHeight: 45,
  imageWidth: 45,
  containerMaxWidth: 414,
  offsetToLoad: 450
})
