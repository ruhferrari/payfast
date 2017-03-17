var fs = require('fs');

fs.readFile('MATRIX.jpg', function(error, buffer){
    console.log('arquivo lido');

    fs.writeFile('copia.jpg', buffer, function(err){
    console.log('arquivo escrito');
    });
});
