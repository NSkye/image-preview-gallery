export default (imageCount, imageHeight, imageWidth, containerMaxWidth) => {
  const imagesPerLine = Math.floor(Math.min(window.innerWidth, containerMaxWidth) / imageWidth)
  const linesPerStage = Math.ceil(imageCount / imagesPerLine)

  const width = imagesPerLine * imageWidth
  const height = linesPerStage * imageHeight

  return { width, height, imagesPerLine, linesPerStage }
}
