// IMPORTS
const express = require('express');
const bodyParser = require('body-parser')
const oauth = require('oauth');
const path = require('path');
const { parseString } = require('xml2js');
const { parse } = require('path');
const { parseNumbers } = require('xml2js/lib/processors');
const app = express();
const port = 3000;

// EXPRESS SETUP
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json())

// ALLY SETUP
var configuration = {
    api_url: "https://devapi.invest.ally.com/v1",
    consumer_key: process.env.CONSUMER_KEY,
    consumer_secret: process.env.CONSUMER_SECRET,
    access_token: process.env.ACCESS_TOKEN,
    access_secret: process.env.ACCESS_SECRET,
    account: process.env.ACCOUNT
}

var tradeking_consumer = new oauth.OAuth(
    "https://devapi.invest.ally.com/oauth/request_token",
    "https://devapi.invest.ally.com/oauth/access_token",
    configuration.consumer_key,
    configuration.consumer_secret,
    "1.0",
    "http://mywebsite.com/tradeking/callback",
    "HMAC-SHA1");

// ENDPOINTS
app.post('/buy', buy);
app.post('/sell', sell);
app.post('/quote', quote);
app.post('/stop', stop);
app.get('/orders', orders);

// START SERVER
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});

// --------------------------------------------------------------------------------------------- //
// --------------------------------------------------------------------------------------------- //
// --------------------------------------------------------------------------------------------- //
function buy(req, res) {
    const { symbol, quantity } = req.body;

    tradeking_consumer.post(
        configuration.api_url + `/accounts/${configuration.account}/orders.json`,
        configuration.access_token,
        configuration.access_secret,
        `
        <FIXML xmlns="http://www.fixprotocol.org/FIXML-5-0-SP2">
            <Order TmInForce="0" Typ="1" Side="1" Acct="${configuration.account}">
                <Instrmt SecTyp="CS" Sym="${symbol}"/>
                <OrdQty Qty="${quantity}"/>
            </Order>
        </FIXML>
        `,
        "text/xml",
        function (error, data, response) {
            const info = JSON.parse(data);
            res.json(info.response);
        }
    );
}
// --------------------------------------------------------------------------------------------- //
// --------------------------------------------------------------------------------------------- //
// --------------------------------------------------------------------------------------------- //
function sell(req, res) {
    const { symbol, quantity } = req.body;

    tradeking_consumer.post(
        configuration.api_url + `/accounts/${configuration.account}/orders.json`,
        configuration.access_token,
        configuration.access_secret,
        `
        <FIXML xmlns="http://www.fixprotocol.org/FIXML-5-0-SP2">
            <Order TmInForce="0" Typ="1" Side="2" Acct="${configuration.account}">
                <Instrmt SecTyp="CS" Sym="${symbol}"/>
                <OrdQty Qty="${quantity}"/>
            </Order>
        </FIXML>
        `,
        "text/xml",
        function (error, data, response) {
            const info = JSON.parse(data);
            res.json(info.response);
        }
    );
}
// --------------------------------------------------------------------------------------------- //
// --------------------------------------------------------------------------------------------- //
// --------------------------------------------------------------------------------------------- //
function stop(req, res) {
    const { symbol, quantity, stoppx, origid } = req.body;

    const order = `
        <FIXML xmlns="http://www.fixprotocol.org/FIXML-5-0-SP2">
            <Order TmInForce="0" Typ="3" Side="2" StopPx="${stoppx}" Acct="${configuration.account}">
                <Instrmt SecTyp="CS" Sym="${symbol}"/>
                <OrdQty Qty="${quantity}"/>
            </Order>
        </FIXML>
        `;

    const change = `
        <FIXML xmlns="http://www.fixprotocol.org/FIXML-5-0-SP2">
            <OrdCxlRplcReq TmInForce="0" Typ="3" Side="2" StopPx="${stoppx}" Acct="${configuration.account}" OrigID="${origid}">
                <Instrmt SecTyp="CS" Sym="${symbol}"/>
                <OrdQty Qty="${quantity}"/>
            </OrdCxlRplcReq>
        </FIXML>
        `;

    const xml = origid ? change : order;

    tradeking_consumer.post(
        configuration.api_url + `/accounts/${configuration.account}/orders.json`,
        configuration.access_token,
        configuration.access_secret,
        xml,
        "text/xml",
        function (error, data, response) {
            const info = JSON.parse(data);
            res.json(info.response);
        }
    );
}
// --------------------------------------------------------------------------------------------- //
// --------------------------------------------------------------------------------------------- //
// --------------------------------------------------------------------------------------------- //
function quote(req, res) {
    const { symbol } = req.body;

    tradeking_consumer.get(
        configuration.api_url + `/market/ext/quotes.json?symbols=${symbol}`,
        configuration.access_token,
        configuration.access_secret,
        function (error, data, response) {
            const info = JSON.parse(data);
            res.json(info.response);
        }
    );
}
// --------------------------------------------------------------------------------------------- //
// --------------------------------------------------------------------------------------------- //
// --------------------------------------------------------------------------------------------- //
function orders(req, res) {
    tradeking_consumer.get(
        configuration.api_url + `/accounts/${configuration.account}/orders.json`,
        configuration.access_token,
        configuration.access_secret,
        async function (error, data, response) {
            const info = JSON.parse(data);

            const orders = info.response.orderstatus.order;

            let temp = [];
            for (let i = 0; i < orders.length; i++) {
                let xml = orders[i].fixmlmessage;

                let result = await parseFromXML(xml);
                temp.push({ result, xml });
            }

            res.json({ orders: temp });
        }
    );
}
// --------------------------------------------------------------------------------------------- //
// --------------------------------------------------------------------------------------------- //
// --------------------------------------------------------------------------------------------- //

const parseFromXML = (xml) => {
    return new Promise((resolve, reject) => {
        parseString(xml, function (err, ok) {
            if (err) return resolve(err);
            return resolve(ok);
        });
    });
};
