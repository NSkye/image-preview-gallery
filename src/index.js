import 'normalize.css'
import './index.css'
import * as PIXI from 'pixi.js'
import calculateStageSize from './utils/calculateStageSize'
import generateImageLinks from './utils/generateImageLinks'
import throttle from 'lodash.throttle'

const IMAGE_COUNT = 1000
const IMAGE_HOST = 'http://127.0.0.1:3999'

class GalleryApp {
  constructor() {
    this.imagesAreLoading = false
    this.loadingQueue = []

    // Generate links for images
    this.links = Array.from(generateImageLinks(IMAGE_HOST, 'jpg', IMAGE_COUNT))
    // Images information (position, visibility, etc.)
    this.images = {}

    const { imagesPerLine, linesPerStage, width, height } = calculateStageSize(IMAGE_COUNT)
    this.imagesPerLine = imagesPerLine
    this.linesPerStage = linesPerStage
    this.width = width
    this.height = height

    this.app = new PIXI.Application({
      width, height,
      backgroundColor: 0xFFFFFF
    })
    this.app.renderer.autoResize = true
    document.body.appendChild(this.app.view)

    this.initializeImages()
    this.updateImagesVisibility()
    console.log('loading queue', this.loadingQueue)
    this.loadVisibleImages()

    window.addEventListener('scroll', throttle(() => {
      console.log('loading queue', this.loadingQueue)
      this.updateImagesVisibility()
      if (!this.imagesAreLoading) {
        this.loadVisibleImages()
      }
    }, 300))
    window.addEventListener('resize', throttle(() => this.updateImagesPositioning(), 1000))
  }

  initializeImages() {
    this.images = this.links.reduce((images, link, index) => {
      const image = this.calculateImagePosition(index)
      image.visibility = this.calculateImageVisibility(image.y)
      image.startedLoading = false
      image.loaded = false
      image.link = link
      image.id = index
      images[index] = image
      return images
    }, {})
  }

  calculateImagePosition(index) {
    const line = Math.floor(index / this.imagesPerLine)
    const column = index % this.imagesPerLine
  
    const x = column * 45 // + offsetX
    const y = line * 45 // + offsetY
  
    return { line, column, x, y }
  }

  calculateImageVisibility(yCoordinate) {
    const OFFSET_TO_LOAD = 450

    const windowBottom = window.scrollY + window.innerHeight
    return (yCoordinate - windowBottom) < OFFSET_TO_LOAD
  }

  updateImagesVisibility() {
    console.log('updating visibility')
    this.links.map((_, index) => {
      const image = this.images[index]
      image.visibility = this.calculateImageVisibility(image.y)

      if (image.loaded || image.startedLoading || !image.visibility) {
        return
      }

      if (image.visibility) {
        image.startedLoading = true
        this.loadingQueue.push(image)
      }
    })
  }

  updateImagesPositioning() {
    console.log('updating positioning')
    this.links.map((_, index) => {
      const image = this.images[index]
      const { x, y } = this.calculateImagePosition(index)
      image.x = x
      image.y = y

      if (image.sprite) {
        image.sprite.x = x
        image.sprite.y = y
      }
    })
  }

  loadVisibleImages() {
    if (!this.loadingQueue.length) {
      this.imagesAreLoading = false
      return
    }
    this.imagesAreLoading = true

    const imagesToLoad = this.loadingQueue
      .splice(0, this.imagesPerLine)

    const links = imagesToLoad
      .map(({ link }) => link)

    this.loadImages(links)
      .then(() => {
        imagesToLoad.map(image => {
          image.loaded = true
          image.sprite = this.createSprite(image)
        })
      })
      .then(() => this.loadVisibleImages())
  }

  loadImages(links) {
    console.log('loading:', links)
    return new Promise(resolve => this.app.loader
      .add(links)
      .load(() => resolve()))
  }

  createSprite(image) {
    const rectangle = new PIXI.Rectangle(0, 0, 45, 45)
    const texture = this.app.loader.resources[image.link].texture
    try {
      texture.frame = rectangle
    } catch (e) {

    }

    const sprite = new PIXI.Sprite(texture)
    sprite.x = image.x
    sprite.y = image.y
    sprite.alpha = 0

    image.sprite = sprite
    this.app.stage.addChild(sprite)

    const fadeInAnimation = () => {
      if (sprite.alpha >= 1) {
        this.app.ticker.remove(fadeInAnimation)
      }
      sprite.alpha += 0.07
    }
    this.app.ticker.add(fadeInAnimation)

    return sprite
  }
}

new GalleryApp()
