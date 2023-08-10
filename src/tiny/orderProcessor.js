// orderProcessor.js
const axios = require('axios');
const { saveOrdersToDatabase } = require('./model/mainModel');
const fs = require('fs');
const fsP = require('fs').promises;


async function getOrdersData(page) {
    const token_tiny = process.env.TOKEN_TINY;
    const search = "";
    const format = "json";
    const fields = "numero,situacao,numero_ecommerce,valor";
    const url_tiny = "https://api.tiny.com.br/api2/pedidos.pesquisa.php";

    try {
        const response = await axios.get(url_tiny, {
            headers: {
                "Content-Type": "application/json",
            },
            params: {
                token: token_tiny,
                pesquisa: search,
                formato: format,
                campos: fields,
                pagina: page,
            },
        });

        const data = response.data;

        if (data.retorno.status === "OK") {
            const orders = data.retorno.pedidos;
            if (typeof orders !== "undefined") {
                return orders;
            } else {
                console.log("Pedidos vieram indefinidos na pagina", page, typeof orders, orders, "Vou tentar novamente em 30 segundos");
                await delay(30000);
                return getOrdersData(page);
            }
        } else if (data.retorno.erros[0].erro.includes('API Bloqueada')) {
            console.log("Waiting for 30 seconds before retrying...");
            await delay(30000);
            return getOrdersData(page);
        } else if (data.retorno.erros[0].erro.includes('A página que você está tentando obter não existe')) {
            console.log("Error message:", data.retorno.erros[0].erro);
            console.log("All errors:", data.retorno.erros);
            const erro = data.retorno.erros[0].erro;
            return erro;
        }
    } catch (error) {
        console.error("An error occurred while calling the API:", error);
    }
}

async function getMaxPages() {
    const token_tiny = process.env.TOKEN_TINY;
    const search = "";
    const format = "json";
    const fields = "numero,situacao,numero_ecommerce,valor,codigo_rastreamento";
    const url_tiny = "https://api.tiny.com.br/api2/pedidos.pesquisa.php";

    try {
        const response = await axios.get(url_tiny, {
            headers: {
                "Content-Type": "application/json",
            },
            params: {
                token: token_tiny,
                pesquisa: search,
                formato: format,
                campos: fields,
                pagina: '1',
            },
        });

        const data = response.data;
        const maxPages = data.retorno.numero_paginas;

        return maxPages;
    } catch (e) {
        console.error(e);
    }
}

async function getLastPageObtained() {
    const filePath = './tiny/lastPage.txt';
    try {
        const data = await fsP.readFile(filePath, 'utf-8');
        return parseInt(data);
    } catch (err) {
        console.error('Erro ao ler o arquivo', err);
        throw err;
    }
}

async function searchOrderInPages() {
    const maxPages = await getMaxPages()
    const lastPage = await getLastPageObtained();

    const startPage = lastPage - 1;
    const allOrders = [];

    for (let i = startPage; i <= maxPages; i++) {
        console.log(i, '<===')
        const orders = await getOrdersData(i);
        allOrders.push(...orders);

        if (orders.length === 0) {
            break;
        }
    }

    const ordersAttributes = allOrders.map((order) => ({
        id: order.pedido.id,
        numero: order.pedido.numero,
        situacao: order.pedido.situacao,
        codigo_rastreamento: order.pedido.codigo_rastreamento,
        numero_ecommerce: order.pedido.numero_ecommerce
    }));


    fs.writeFileSync('./tiny/lastPage.txt', maxPages.toString(), 'utf-8')
    return ordersAttributes
}

async function getContato(id) {
    const token_tiny = process.env.TOKEN_TINY;
    const format = "json";
    const url_tiny = "https://api.tiny.com.br/api2/pedido.obter.php";


    try {
        const response = await axios.get(url_tiny, {
            headers: {
                "Content-Type": "application/json",
            },
            params: {
                token: token_tiny,
                formato: format,
                id: id
            },
        });
        const data = response.data;

        if (data.retorno.status === "OK") {
            return data
        } else if (data.retorno.erros[0].erro.includes('API Bloqueada')) {
            console.log("Waiting for 30 seconds before retrying...");
            await delay(30000);
            return getContato(id);
        } else {
            console.log("Error message:", data.retorno.erros[0].erro);
            console.log("All errors:", data.retorno.erros);
        }

    } catch (err) {
        console.error(err)
    }

}

async function getPhoneNumber() {
    const orders = await searchOrderInPages();
    const results = [];

    for (const [index, order] of orders.entries()) {
        try {
            const contatoData = await getContato(order.id);
            results.push({ index, data: contatoData });
        } catch (error) {
            console.error("Error fetching contato for order with ID:", order.id);
            console.error(error);
        }
    }

    try {

        const arrayTodos = []
        results.forEach(result => {
            const orderData = result.data.retorno.pedido;
            const { cliente, ...orderWithoutCliente } = orderData; // Destructure cliente from orderData
            arrayTodos.push({ ...orderWithoutCliente, email: cliente.email, telefone: cliente.fone }); // Include the email field from cliente
        })
        console.log(arrayTodos)
        saveOrdersToDatabase(arrayTodos)
    } catch (error) {
        console.error("Error writing to output.txt:", error);
    }
}

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
    getPhoneNumber, getOrdersData, getContato, getMaxPages
};
