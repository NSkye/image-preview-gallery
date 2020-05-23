import * as PIXI from 'pixi.js'
import calculateContainerSize from './calculateContainerSize'

class GallerySection {
  constructor({
    // Text for section's header
    headerText,
    // Array of image links
    imageLinks,
    // Individual image height
    imageHeight,
    // Individual image width
    imageWidth,
    // Maximal width of the whole container
    maxWidth,
    // Y-offset from bottom of visible part of window on which lazy-load should be triggered
    offsetToLoad,
    // Container's offset from stage top
    globalOffsetY
  }) {
    // Indicator that some images are currently loading
    this.imagesAreLoading = false

    // Pool of images that are waiting to be loaded
    this.loadingQueue = []

    // Images by id
    this.images = {}

    // Links for each image
    this.links = imageLinks

    this.imageHeight = imageHeight
    this.imageWidth = imageWidth
    this.globalOffsetY = globalOffsetY
    this.offsetToLoad = offsetToLoad

    // Assets loader for image loading
    this.loader = new PIXI.Loader()

    // Container instance that will represent section
    this.container = new PIXI.Container()
    this.container.interactive = true
    this.container.buttonMode = true
    this.container.defaultCursor = 'pointer'

    // Section's header with text
    this.header = new PIXI.Text(headerText, {
      fontFamily: 'Arial',
      fontWeight: '600'
    })
    this.header.y = 10
    this.header.x = 45

    // Space occupied by header
    this.localOffset = this.header.height + 10
    this.container.addChild(this.header)
  
    // Container's virtual size allows to place images correctly
    const { imagesPerLine, linesPerStage, width, height } = calculateContainerSize({
      imageCount: this.links.length,
      imageHeight: this.imageHeight,
      imageWidth: this.imageWidth,
      maxWidth: maxWidth
    })
    this.imagesPerLine = imagesPerLine
    this.linesPerStage = linesPerStage
    this.width = width
    this.height = height + this.localOffset

    // Create image instances and push then to this.images
    this.initializeImages()

    this.setMaxWidth(maxWidth)
  }

  /**
   * Creates wrapper for each image
   * and pushes them to this.images
   */
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

  /**
   * Determine image position in gallery
   * @param {number} index image's index in this.links or it's id
   * @returns {{ x: number, y: number, line: number, column: number }}
   */
  calculateImagePosition(index) {
    const line = Math.floor(index / this.imagesPerLine)
    const column = index % this.imagesPerLine
  
    const x = column * 45
    const y = line * 45 + this.localOffset
  
    return { line, column, x, y }
  }

  /**
   * Detects if image should be visible to user
   * (or at least will sooon be visible) based on his
   * vertical scroll position
   * @param {number} yCoordinate images global Y coordinate
   */
  calculateImageVisibility(yCoordinate) {
    const windowBottom = window.scrollY + window.innerHeight
    return (yCoordinate - windowBottom) < this.offsetToLoad &&
      (window.scrollY - yCoordinate) < this.offsetToLoad
  }

  /**
   * Update .visibility property of all
   * images in container based on user's
   * scroll position
   */
  updateImagesVisibility() {
    this.links.map((_, index) => {
      const image = this.images[index]
      const imageGlobalPosition = this.container.toGlobal({
        x: image.x,
        y: image.y
      })
      image.visibility = this.calculateImageVisibility(imageGlobalPosition.y)

      if (image.loaded || image.startedLoading) {
        return
      }

      if (image.visibility) {
        image.startedLoading = true
        this.loadingQueue.push(image)
      }
    })
  }

  /**
   * Update all images { x, y } positions
   * according to width of container
   * Will be called on initialization
   * and on window resize
   */
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

  /**
   * Start loading all images that are currently
   * visible to user, images are taken from loadingQueue
   * by small chunks, function will be rerunning until
   * images are loaded
   */
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

  /**
   * Load images from provided urls, returns
   * promis that will be resolved when all
   * images are loaded
   * @param {string[]} links image urls
   * @returns {Promise}
   */
  loadImages(links) {
    return new Promise(resolve => this.loader
      .add(links)
      .load(() => resolve()))
  }

  /**
   * Create sprite from already loaded image
   * @param {object} image wrapped image from .images
   */
  createSprite(image) {
    const rectangle = new PIXI.Rectangle(0, 0, 45, 45)
    const texture = this.loader.resources[image.link].texture
    try {
      texture.frame = rectangle
    } catch (e) {}

    const sprite = new PIXI.Sprite(texture)
    sprite.x = image.x
    sprite.y = image.y
    sprite.alpha = 0

    this.container.addChild(sprite)

    const fadeInAnimation = () => {
      if (sprite.alpha >= 1) {
        PIXI.Ticker.shared.remove(fadeInAnimation)
      }
      sprite.alpha += 0.07
    }
    PIXI.Ticker.shared.add(fadeInAnimation)

    return sprite
  }

  /**
   * Change max width of container with
   * recalculation of images positions
   * @param {number} maxWidth
   */
  setMaxWidth(maxWidth) {
    const { imagesPerLine, linesPerStage, width, height } = calculateContainerSize({
      imageCount: this.links.length,
      imageHeight: this.imageHeight,
      imageWidth: this.imageWidth,
      maxWidth: maxWidth
    })

    this.imagesPerLine = imagesPerLine
    this.linesPerStage = linesPerStage
    this.width = width
    this.height = height + this.localOffset

    this.updateImagesPositioning()
  }

  /**
   * Change container's vertical position on stage
   * @param {number} y Y-coordinate
   */
  setGlobalOffsetY(y) {
    this.globalOffsetY = y
    this.container.position.y = y
    this.recalculateVisibleImages()
  }

  /**
   * Recalculate which images should be visible
   * and if image loading is not in progress
   * start it
   */
  recalculateVisibleImages() {
    this.updateImagesVisibility()
    if (!this.imagesAreLoading) {
      this.loadVisibleImages()
    }
  }
}

export default GallerySection
