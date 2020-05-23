import * as PIXI from 'pixi.js'
import calculateContainerSize from './calculateContainerSize'

class GallerySection {
  constructor({
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
    this.imagesAreLoading = false
    this.loadingQueue = []
    this.images = {}

    this.imageHeight = imageHeight
    this.imageWidth = imageWidth
    this.globalOffsetY = globalOffsetY

    this.loader = new PIXI.Loader()
    this.container = new PIXI.Container()
    this.header = new PIXI.Text(headerText)
    this.localOffset = this.header.height + 10
    this.container.addChild(this.header)
    this.header.y = 10
    this.links = imageLinks
  
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

    this.initializeImages()
    this.setMaxWidth(maxWidth)
    this.offsetToLoad = offsetToLoad
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
  
    const x = column * 45
    const y = line * 45 + this.localOffset
  
    return { line, column, x, y }
  }

  calculateImageVisibility(yCoordinate) {
    const windowBottom = window.scrollY + window.innerHeight
    return (yCoordinate - windowBottom) < this.offsetToLoad &&
      (window.scrollY - yCoordinate) < this.offsetToLoad
  }

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
    return new Promise(resolve => this.loader
      .add(links)
      .load(() => resolve()))
  }

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

  setGlobalOffsetY(y) {
    this.globalOffsetY = y
    this.container.position.y = y
    this.recalculateVisibleImages()
  }

  recalculateVisibleImages() {
    this.updateImagesVisibility()
    if (!this.imagesAreLoading) {
      this.loadVisibleImages()
    }
  }
}

export default GallerySection
