import * as PIXI from 'pixi.js'
import throttle from 'lodash.throttle'
import GallerySection from '../GallerySection'

class Gallery {
  constructor({
    imagesByYear,
    maxWidth = 414
  }) {
    this.maxWidth = maxWidth
    this.sections = imagesByYear.map(([year, imageLinks]) => new GallerySection({
      headerText: year,
      imageLinks,
      imageHeight: 45,
      imageWidth: 45,
      maxWidth: Math.min(window.innerWidth, this.maxWidth),
      offsetToLoad: 45,
      globalOffsetY: 0
    }))
    this.adjustSize()
    this.updateSectionSpacings()

    this.app = new PIXI.Application({
      width: this.width,
      height: this.height,
      backgroundColor: 0xFFFFFF,
      antialias: true,
      resolution: 1,
      autoResize: true
    })

    this.sections.map(section => section.recalculateVisibleImages())
    this.sections.map(section => this.app.stage.addChild(section.container))

    document.body.appendChild(this.app.view)

    window.addEventListener('resize', throttle(() => {
      this.adjustSize()
      this.app.view.width = this.width
      this.app.view.height = this.height
      this.updateSectionWidths()
      this.updateSectionSpacings()
    }, 1000))

    window.addEventListener('scroll', throttle(() => {
      this.sections.map(section => section.recalculateVisibleImages())
    }, 300))
  }

  adjustSize() {
    this.height = this.sections
      .map(({ height }) => height)
      .reduce((height1, height2) => height1 + height2)
    this.width = Math.max(...this.sections.map(section => section.width))
  }

  updateSectionSpacings() {
    let previousHeight = 0

    this.sections.map(section => {
      section.setGlobalOffsetY(previousHeight)
      previousHeight += section.height
    })
  }

  updateSectionWidths() {
    this.sections.map(section => {
      section.setMaxWidth(Math.min(window.innerWidth, this.maxWidth))
    })
  }
}

export default Gallery
