import * as PIXI from 'pixi.js'
import calculateStageSize from '../utils/calculateStageSize'
import generateImageLinks from '../utils/generateImageLinks'
import throttle from 'lodash.throttle'

export default class GalleryApp {
  constructor({
    // Array of image links
    imageLinks,
    // Individual image height
    imageHeight,
    // Individual image width
    imageWidth,
    // Maximal width of the whole container
    containerMaxWidth,
    // Y-offset from bottom of visible part of window on which lazy-load should be triggered
    offsetToLoad
  }) {
    this.offsetToLoad = offsetToLoad
    this.links = [...imageLinks]

    // Indication that images are loading
    this.imagesAreLoading = false

    // A pool of image objects from which next image for load is drawn
    this.loadingQueue = []

    // Images information (position, visibility, etc.)
    this.images = {}

    // Calculation of canvas size
    const { imagesPerLine, linesPerStage, width, height } = calculateStageSize(
      imageLinks.length,
      imageHeight,
      imageWidth,
      containerMaxWidth
    )
    this.imagesPerLine = imagesPerLine
    this.linesPerStage = linesPerStage
    this.width = width
    this.height = height

    // Initialization of PIXI app
    this.app = new PIXI.Application({
      width, height,
      backgroundColor: 0xFFFFFF
    })
    this.app.renderer.autoResize = true
    document.body.appendChild(this.app.view)

    // Setting up initial state
    this.initializeImages()
    this.updateImagesVisibility()
    this.loadVisibleImages()

    // Listener for lazy load
    window.addEventListener('scroll', throttle(() => {
      this.updateImagesVisibility()
      if (!this.imagesAreLoading) {
        this.loadVisibleImages()
      }
    }, 300))

    // Listener for adaptive grid
    window.addEventListener('resize', throttle(() => {
      // Recalculate canvas size
      const { imagesPerLine, linesPerStage, width, height } = calculateStageSize(
        imageLinks.length,
        imageHeight,
        imageWidth,
        containerMaxWidth
      )
      this.imagesPerLine = imagesPerLine
      this.linesPerStage = linesPerStage
      this.width = width
      this.height = height

      // Set new canvas size
      this.app.view.width = width
      this.app.view.height = height
 
      // Update images positions
      this.updateImagesPositioning()
    }, 1000))
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

  // Calculates position for an individual image
  calculateImagePosition(index) {
    const line = Math.floor(index / this.imagesPerLine)
    const column = index % this.imagesPerLine
  
    const x = column * 45 // + offsetX
    const y = line * 45 // + offsetY
  
    return { line, column, x, y }
  }

  // Detects if image should be visible to user based on scroll position
  calculateImageVisibility(yCoordinate) {
    const windowBottom = window.scrollY + window.innerHeight
    return (yCoordinate - windowBottom) < this.offsetToLoad
  }

  // Calculates which images should be visible to user at the moment
  updateImagesVisibility() {
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

  // Positions images on canvas
  updateImagesPositioning() {
    this.links.map((_, index) => {
      const image = this.images[index]
      const { x, y } = this.calculateImagePosition(index)
      image.x = x
      image.y = y

      if (image.sprite) {
        image.sprite.position.set(x, y)
      }
    })
  }

  // Checks if there're unloaded visible images and loads them
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

  // Load images by specified links
  loadImages(links) {
    return new Promise(resolve => this.app.loader
      .add(links)
      .load(() => resolve()))
  }

  // Creates sprite from an image and positions it on canvas
  createSprite(image) {
    const rectangle = new PIXI.Rectangle(0, 0, 45, 45)
    const texture = this.app.loader.resources[image.link].texture
    try {
      texture.frame = rectangle
    } catch (e) {}

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
