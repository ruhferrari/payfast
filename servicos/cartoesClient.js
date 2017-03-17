var restify = require('restify');

function CartoesClient(){
    this.client = restify.createJsonClient({
        url: 'http://localhost:3001',
        version:'~1.0'
    });
};

CartoesClient.prototype.autoriza = function(cartao,callback){
    this.client.post('/cartoes/autoriza', cartao,callback);
}

module.exports = function(){
    return CartoesClient;
};