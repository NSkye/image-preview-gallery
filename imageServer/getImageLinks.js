const fs = require('fs-extra')

const imageExtracter = (hash, size) => {
  if (hash && hash.length && hash.length > 20){
      return "https://rixtrema.net/exeimages/exeimages_" + size + '/' + hash.slice(0, 2) + '/' + hash.slice(2, 4) + '/' + hash + '.jpg';
  } else { 
      return '';
  }
}

const extractImagePath = hash => imageExtracter(hash, 45)

module.exports = path => new Promise((resolve, reject) => {
  fs.readFile(path, 'utf8', (error, data) => {
    if (error) {
      reject(error)
    }

    resolve(data.replace(/\n$/, '').split('\n').map(extractImagePath))
  })
})
