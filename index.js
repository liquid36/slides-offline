const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

function loadTemplate() {
    return new Promise((resolve, reject) => {
        const fileName = path.join(__dirname, 'template.html');
        fs.readFile(fileName, 'utf8', (err, content) => {
            return resolve(content);
        });
    })
}

function cleanUrl(url) {
    const URL = require('url');
    const myURL = URL.parse(url);
    myURL.search = '';
    myURL.hash = '';
    return myURL.protocol + '//' + myURL.host + myURL.pathname;
}

function donwloadPage(url) {
    const rp = require('request-promise');
    return rp(url + '/fullscreen')
}

function downloadImage(fileName, url) {
    return new Promise((resolve, reject) => {
        const request = require('request');
        request(url).on('response', function (res) {
            const fws = fs.createWriteStream(fileName);
            res.pipe(fws);
            res.on('end', resolve);
            res.on('error', console.error);
            fws.on('error', console.error);
        }).on('error', reject);
    })
}

function main(slidesURL, folderName) {
    slidesURL = cleanUrl(slidesURL);
    if (!folderName) {
        const lastIndex = slidesURL.lastIndexOf('/');
        folderName = slidesURL.substr(lastIndex + 1);
    }

    const imgFolder = path.join(folderName, 'img');
    fs.mkdirSync(imgFolder, { recursive: true });

    Promise.all([
        loadTemplate(),
        donwloadPage(slidesURL).then((html) => {
            const $ = cheerio.load(html);
            $('body').find('script').remove();
            return $('body').html();
        })
    ]).then(([template, slides]) => {
        const $ = cheerio.load(template);

        $('.insert').after(slides);

        $('img[data-src]').map((a, b) => {
            const img = $(b).attr('data-src');
            if (img.startsWith('https://s3.amazonaws.com')) {
                const lastIndex = img.lastIndexOf('/');
                const name = img.substr(lastIndex + 1);

                const imgPath = path.join(imgFolder, name);

                downloadImage(imgPath, img)

                $(b).attr('data-src', path.join('img', name));
            }
        });

        fs.writeFileSync(path.join(folderName, 'index.html'), $.html());
    })

}

const slides = 'https://slides.com/andes/sprint-75-instituciones-5bd030';

module.exports = main;