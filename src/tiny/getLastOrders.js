const fs = require('fs');
const { saveOrdersToDatabase } = require('./model/updateModel');
const { getOrdersData, getMaxPages } = require('./orderProcessor')


async function getLastPageObtained() {
    const filePath = './tiny/lastPage.txt';
    try {
        const data = await fs.promises.readFile(filePath, 'utf-8');
        const lastPageObtained = parseInt(data);
        return lastPageObtained;
    } catch (err) {
        console.error('Erro ao ler o arquivo', err);
        throw err;
    }
}

async function getSituacao() {
    try {
        const lastPage = await getLastPageObtained();
        const maxPages = await getMaxPages();
        const startPage = lastPage;
        let finishedPage = 0;
        const allOrders = [];

        for (let i = startPage - 100; i <= maxPages; i++) {
            const orders = await getOrdersData(i);
            // console.log(orders);
            allOrders.push(...orders);
            finishedPage = i;

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
        console.log(ordersAttributes.situacao, '<<<<')

        saveOrdersToDatabase(ordersAttributes);
        // await writeFileAsync('output.txt', JSON.stringify(ordersAttributes, null, 2));
        fs.writeFileSync('./tiny/lastPage.txt', finishedPage.toString(), 'utf-8');
    } catch (err) {
        console.error('Error:', err);
        throw err;
    }
}

module.exports = getSituacao;
