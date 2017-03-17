
module.exports = function(app){

app.get('/pagamentos',function(req, res){
    console.log('Request Received.');
    res.send('Ok');
});

app.put('/pagamentos/pagamento/:id', function(req, res){
    var pagamento = {};
    var id = req.params.id;
    
    pagamento.id = id;
    pagamento.status = 'CONFIRMADO';

    var connection = app.persistencia.ConnectionFactory();
    var pagtoDAO = new app.persistencia.PagamentoDAO(connection);

    pagtoDAO.atualiza(pagamento, function(erro){
        if(erro){
            res.status(500).send(erro);
            return;
        }
        console.log('pagamento alterado');
        res.status(200).send(pagamento);
    });
});

app.get('/pagamentos/pagamento/:id', function(req,res){
    var id = req.params.id;
    console.log('consultando pagamento: ' + id);

    var memcachedClient = app.servicos.memcachedClient();
    memcachedClient.get('pagamento-' + id, function(erro, resultado){
        if(erro || !resultado){
            console.log('MISS - chave nao encontrada');

            var connection = app.persistencia.ConnectionFactory();
            var pagtoDAO = new app.persistencia.PagamentoDAO(connection);

            pagtoDAO.buscaPorId(id,function(erro, resultado){
                if (erro){
                    console.log('erro ao consultar bd: '+ erro);
                    res.status(500).send(erro);
                    return;
                }
                console.log('pagamento encontrado: '+ JSON.stringify(resultado));
                res.json(resultado);
                return;
            });

        }else{
            console.log('HIT - valor: '+ JSON.stringify(resultado));
            res.json(resultado);
            return;
        }
    });
})

app.delete('/pagamentos/pagamento/:id', function(req, res){
    var pagamento = {};
    var id = req.params.id;
    
    pagamento.id = id;
    pagamento.status = 'CANCELADO';

    var connection = app.persistencia.ConnectionFactory();
    var pagtoDAO = new app.persistencia.PagamentoDAO(connection);

    pagtoDAO.atualiza(pagamento, function(erro){
        if(erro){
            res.status(500).send(erro);
            return;
        }
        console.log('pagamento cancelado');
        res.status(204).send(pagamento);
    });
});

app.post('/pagamentos/pagamento', function(req,res){
    var body = req.body;
    var pagamento = body['pagamento'];

    req.assert("pagamento.forma_de_pagamento", "Forma de pagamento obrigatória!").notEmpty();
    req.assert("pagamento.valor", "Valor obrigatório e deve ser decimal!").notEmpty().isFloat();
    req.assert("pagamento.moeda", "Moeda é obrigatória e deve ter 3 caracteres!").notEmpty().len(3,3);

    var errosValid = req.validationErrors();

    if(errosValid){
        console.log("Erros de validação encontrados.");
        res.status(400).send(errosValid);

     return;   
    }
console.log('procesando pagamento...');

    var connection = app.persistencia.ConnectionFactory();
    var pagtoDAO = new app.persistencia.PagamentoDAO(connection);

    pagamento.status = "CRIADO";
    pagamento.data = new Date;

    pagtoDAO.salva(pagamento, function(erro, resultado){
        if(!erro){
            pagamento.id = resultado.insertId;
        console.log("pagamento criado");
        }else
        {
            console.log("impossível efetivar pagamento");
            res.status(500).send(errosValid);
        }
    var memcachedClient = app.servicos.memcachedClient();
    memcachedClient.set('pagamento-' + pagamento.id ,pagamento, 60000, function(erro){
    console.log('chave add ao cache: pagamento-'+ pagamento.id);
    });
    
    if (pagamento.forma_de_pagamento == 'cartao'){
        var cartao = req.body["cartao"];
        console.log(cartao);

        var clienteCartoes = new app.servicos.cartoesClient();

        clienteCartoes.autoriza(cartao, function(exception, request, response, retorno){
              if(exception){
                console.log(exception);
                res.status(400).send(exception);
                return;
              }
              console.log(retorno);

              res.location('/pagamentos/pagamento/' + pagamento.id);

              var response = {
                dados_do_pagamanto: pagamento,
                cartao: retorno,
                links: [
                  {
                    href:"http://localhost:3000/pagamentos/pagamento/"
                            + pagamento.id,
                    rel:"confirmar",
                    method:"PUT"
                  },
                  {
                    href:"http://localhost:3000/pagamentos/pagamento/"
                            + pagamento.id,
                    rel:"cancelar",
                    method:"DELETE"
                  }
                ]
              }
              res.status(201).json(response);
              return;
        });

      } else {
    
        res.location('/pagamentos/pagamento/'+ pagamento.id);

        var response = {
            dados_do_pagamento: pagamento,
            Links: [
                {
                    href:"http://localhost:3000/pagamentos/pagamento/" + pagamento.id, 
                    rel: 'confirmar',
                    method:'PUT'
                },
                {
                    href:"http://localhost:3000/pagamentos/pagamento/" + pagamento.id, 
                    rel: 'cancelar',
                    method:'DELETE'
                }
            ]
        }

        res.status(201).json(response);
    
    }
});
})}