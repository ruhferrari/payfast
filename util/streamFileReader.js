var fs = require('fs');

fs.createReadStream('MATRIX.jpg')
    .pipe(fs.createWriteStream('copia-stream.jpg'))
    .on('finish', function(){
        console.log('arquivo escrito com stream');
    });