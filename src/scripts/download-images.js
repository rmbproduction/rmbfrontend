const fs = require('fs');
const path = require('path');
const https = require('https');

const manufacturerLogos = {
  'maruti': 'https://gomechanic.in/assets/img/brands/maruti-suzuki.png',
  'hyundai': 'https://gomechanic.in/assets/img/brands/hyundai.png',
  'honda': 'https://gomechanic.in/assets/img/brands/honda.png',
  'tata': 'https://gomechanic.in/assets/img/brands/tata.png',
  'ford': 'https://gomechanic.in/assets/img/brands/ford.png',
  'volkswagen': 'https://gomechanic.in/assets/img/brands/volkswagen.png',
  'mahindra': 'https://gomechanic.in/assets/img/brands/mahindra.png',
  'chevrolet': 'https://gomechanic.in/assets/img/brands/chevrolet.png',
  'renault': 'https://gomechanic.in/assets/img/brands/renault.png'
};

const carModels = {
  'swift': 'https://gomechanic.in/assets/img/cars/swift.png',
  'wagonr': 'https://gomechanic.in/assets/img/cars/wagon-r.png',
  'dzire': 'https://gomechanic.in/assets/img/cars/dzire.png',
  'baleno': 'https://gomechanic.in/assets/img/cars/baleno.png',
  'alto': 'https://gomechanic.in/assets/img/cars/alto.png',
  'ritz': 'https://gomechanic.in/assets/img/cars/ritz.png'
};

const downloadImage = (url, filepath) => {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(fs.createWriteStream(filepath))
                .on('error', reject)
                .once('close', () => resolve(filepath));
      } else {
        response.resume();
        reject(new Error(`Request Failed With a Status Code: ${response.statusCode}`));
      }
    });
  });
};

const downloadAllImages = async () => {
  // Create directories if they don't exist
  const publicDir = path.join(__dirname, '../../public');
  const manufacturersDir = path.join(publicDir, 'manufacturers');
  const modelsDir = path.join(publicDir, 'models');

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
  }
  if (!fs.existsSync(manufacturersDir)) {
    fs.mkdirSync(manufacturersDir);
  }
  if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir);
  }

  // Download manufacturer logos
  for (const [name, url] of Object.entries(manufacturerLogos)) {
    const filepath = path.join(manufacturersDir, `${name}.png`);
    try {
      await downloadImage(url, filepath);
      console.log(`Downloaded ${name} logo`);
    } catch (err) {
      console.error(`Error downloading ${name} logo:`, err);
    }
  }

  // Download car model images
  for (const [name, url] of Object.entries(carModels)) {
    const filepath = path.join(modelsDir, `${name}.png`);
    try {
      await downloadImage(url, filepath);
      console.log(`Downloaded ${name} model image`);
    } catch (err) {
      console.error(`Error downloading ${name} model image:`, err);
    }
  }
};

downloadAllImages().then(() => {
  console.log('All images downloaded successfully');
}).catch(err => {
  console.error('Error downloading images:', err);
}); 