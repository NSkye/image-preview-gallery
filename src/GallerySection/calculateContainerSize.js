export default ({ imageCount, imageHeight, imageWidth, maxWidth }) => {
  const imagesPerLine = Math.floor(maxWidth / imageWidth)
  const linesPerStage = Math.ceil(imageCount / imagesPerLine)

  const width = imagesPerLine * imageWidth
  const height = linesPerStage * imageHeight

  return { width, height, imagesPerLine, linesPerStage }
}
