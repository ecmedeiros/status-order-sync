const { Sequelize, DataTypes, Model } = require("sequelize");
require('dotenv').config();

class Order extends Model { }

const connection = new Sequelize({
    username: process.env.USER,
    host: process.env.HOST,
    database: process.env.DATABASE,
    password: process.env.PASSWORD,
    port: process.env.PORT,
    dialect: 'postgres',
    schema: 'ecommerce'
});

Order.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        numero: {
            type: DataTypes.INTEGER,
        },
        situacao: {
            type: DataTypes.STRING,
        },
        situacao_antiga: {
            type: DataTypes.STRING
        },
        url_rastreamento: {
            type: DataTypes.STRING
        },
        numero_ecommerce: {
            type: DataTypes.STRING
        },
        email: {
            type: DataTypes.STRING
        },
        telefone: {
            type: DataTypes.STRING
        }
    },
    {
        sequelize: connection,
        modelName: "situacao_pedido",
    },
);

async function saveOrdersToDatabase(pedidos) {
    try {
        await connection.sync(); // Create the table in the database if it doesn't exist

        await Order.update(
            { situacao_antiga: Sequelize.col('situacao') },
            { where: {} }
        );


        await Order.bulkCreate(pedidos, {
            updateOnDuplicate: ["numero", "situacao"]
        });

        console.log("The orders were saved to the database!");
    } catch (e) {
        console.log(
            `An error occurred while saving the orders to the database: ${e}`
        );
    }
}

module.exports = { saveOrdersToDatabase }