require('dotenv').config();
let bitcoin = require('bitcoinjs-lib');
const axios = require('axios');
const { Client } = require('pg');

const network = bitcoin.networks.testnet;
const connectionString = `postgresql://postgres:${process.env.PG_PASS}@db.sndydkkxrfmzioavmdds.supabase.co:5432/postgres`;
const client = new Client({
  connectionString,
})
client.connect();

exports.tx = function(btc, fromKey, txId, toAddress, unspentAddress) {
  const toSatoshi = btc * (10**8);
  let key = bitcoin.ECPair.fromWIF(fromKey, network);
  let tx = new bitcoin.TransactionBuilder(network);
  axios
    .get(`https://blockstream.info/testnet/api/tx/${txId}`)
    .then(resTx => {
      const minerFee = 300;
      const unspentSatoshi = (resTx.data.vout[1].value - toSatoshi) - minerFee;
      tx.addInput(txId, 1);
      tx.addOutput(toAddress, toSatoshi);
      tx.addOutput(unspentAddress, unspentSatoshi);
      tx.sign(0, key);
      const txHex = tx.build().toHex();
      
      axios
        .post('https://blockstream.info/testnet/api/tx', txHex)
        .then(resHex => {
          const text = 'UPDATE "items" SET "tx_id" = $1 WHERE "id" = $2'
          const values = [resHex.data, 1]
          client.query(text, values, (err, res) => {
            if (err) {
              console.log(err.stack)
            } else {
              console.log(res)
            }
          })
          return resHex.data;
        })
        .catch(error => {
          console.error(error);
        })
    })
    .catch(error => {
      console.error(error);
    })
}