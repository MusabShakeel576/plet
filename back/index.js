require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
const wallet = require('./utils/wallet');
const transaction = require('./utils/transaction');
const app = express();
const port = process.env.PORT || 8000;
app.use(cors({
    'allowedHeaders': ['Content-Type'],
}));
app.use(express.json());

const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
const PLAID_SECRET = process.env.PLAID_SECRET;
const PLAID_ENV = process.env.PLAID_ENV || 'sandbox';
let ACCESS_TOKEN = null;
let ITEM_ID = null;
const configuration = new Configuration({
    basePath: PlaidEnvironments[PLAID_ENV],
    baseOptions: {
        headers: {
            'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
            'PLAID-SECRET': PLAID_SECRET,
            'Plaid-Version': '2020-09-14',
        },
    },
});
const client = new PlaidApi(configuration);

app.get('/api', (req, res) => {
    res.send('Welcome to Plet API');
})

app.post('/api/v1/wallet', (req, res) => {
    let pouch = wallet.pouch();
    res.status(200).json(pouch)
})

app.post('/api/v1/transaction', async function (req, res) {
    let tx = await transaction.tx(req.body.btc, req.body.fromKey, req.body.txAddress, req.body.toAddress, req.body.unspentAddress);
    console.log('Transaction 2:', tx);
    res.send(tx)
})

app.post('/api/v1/create_link_token', async function (req, res) {
    const configs = {
        user: {
            client_user_id: `p-${req.body.uid.toString()}`,
        },
        client_name: 'Plet',
        products: ['auth'],
        language: 'en',
        country_codes: ['US'],
        redirect_uri: process.env.BASE_URI,
    };

    try {
        const createTokenResponse = await client.linkTokenCreate(configs);
        res.json(createTokenResponse.data);
    } catch (error) {
        return res.json(error.response);
    }
});

app.post('/api/v1/set_access_token', async function (req, res, next) {
    PUBLIC_TOKEN = req.body.public_token;
    try {
        const tokenResponse = await client.itemPublicTokenExchange({
            public_token: PUBLIC_TOKEN,
        });
        ACCESS_TOKEN = tokenResponse.data.access_token;
        ITEM_ID = tokenResponse.data.item_id;
        res.json({
            access_token: ACCESS_TOKEN,
            item_id: ITEM_ID,
            error: null,
        });
    } catch (error) {
        return res.json(error.response);
    }
});

app.post('/api/v1/balance', async function (req, res, next) {
    try {
      const balanceResponse = await client.accountsBalanceGet({
        access_token: req.body.access_token,
      });
      res.json(balanceResponse.data);
    } catch (error) {
      return res.json(error.response);
    }
});

app.listen(port, () => {
    console.log(`Plet is listening at port ${port}`);
})