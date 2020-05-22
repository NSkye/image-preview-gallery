const IMAGE_HEIGHT = 45
const IMAGE_WIDTH = 45
const MAX_STAGE_WIDTH = 414
export default imageCount => {
  const imagesPerLine = Math.floor(Math.min(window.innerWidth, MAX_STAGE_WIDTH) / IMAGE_WIDTH)
  const linesPerStage = Math.ceil(imageCount / imagesPerLine)

  const width = imagesPerLine * IMAGE_WIDTH
  const height = linesPerStage * IMAGE_HEIGHT

  return { width, height, imagesPerLine, linesPerStage }
}
