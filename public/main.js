// inputs
const symbol = document.getElementById("symbol");
const quantity = document.getElementById("quantity");
const stoppx = document.getElementById("stoppx");
const origid = document.getElementById("origid");
// buttons
const buy = document.getElementById("buy");
const sell = document.getElementById("sell");
const quote = document.getElementById("quote");
const stop = document.getElementById("stop");
const orders = document.getElementById("orders");
const clear = document.getElementById("clear");

// --------------------------------------------------------------------------------------------- //
// --------------------------------------------------------------------------------------------- //
// --------------------------------------------------------------------------------------------- //

symbol.focus();

symbol.addEventListener('change', () => {
    symbol.value = symbol.value.toUpperCase();
    getQuote();
});

symbol.addEventListener('focus', () => {
    symbol.value = "";
});

// --------------------------------------------------------------------------------------------- //
// --------------------------------------------------------------------------------------------- //
// --------------------------------------------------------------------------------------------- //

quote.addEventListener('click', getQuote);

// --------------------------------------------------------------------------------------------- //
// --------------------------------------------------------------------------------------------- //
// --------------------------------------------------------------------------------------------- //

clear.addEventListener('click', () => {
    $('#table > tbody').empty();
});

// --------------------------------------------------------------------------------------------- //
// --------------------------------------------------------------------------------------------- //
// --------------------------------------------------------------------------------------------- //

buy.addEventListener('click', async () => {
    const data = getFields();
    const response = await fetch('/buy', getPostConfig(data));
    const payload = await response.json();
    displayStatus(payload);
    console.log(payload);
});

// --------------------------------------------------------------------------------------------- //
// --------------------------------------------------------------------------------------------- //
// --------------------------------------------------------------------------------------------- //

sell.addEventListener('click', async () => {
    const data = getFields();
    const response = await fetch('/sell', getPostConfig(data));
    const payload = await response.json();
    displayStatus(payload);
    console.log(payload);
});

// --------------------------------------------------------------------------------------------- //
// --------------------------------------------------------------------------------------------- //
// --------------------------------------------------------------------------------------------- //

stop.addEventListener('click', async () => {
    const data = getFields();
    const response = await fetch('/stop', getPostConfig(data));
    const payload = await response.json();
    origid.value = payload.clientorderid;
    displayStatus(payload);
    console.log(payload);
});

// --------------------------------------------------------------------------------------------- //
// --------------------------------------------------------------------------------------------- //
// --------------------------------------------------------------------------------------------- //

orders.addEventListener('click', async () => {
    const response = await fetch('/orders');
    const payload = await response.json();
    $('#table > tbody').empty();
    payload.orders.forEach(o => console.log(o.xml));
    payload.orders.forEach(o => {
        const { ID, Txt, Typ, Side, Stat, StopPx, LeavesQty, RejRsn } = o.result.FIXML.ExecRpt[0]["$"];
        const html = `
        <tr>
            <td>${ID}</td>
            <td>${Txt}</td>
            <td>${Typ}</td>
            <td>${Side}</td>
            <td>${Stat}</td>
            <td>${StopPx}</td>
            <td>${LeavesQty}</td>
            <td>${RejRsn}</td>
        </tr>`;
        $('#table > tbody').append(html);
    });
});

// --------------------------------------------------------------------------------------------- //
// --------------------------------------------------------------------------------------------- //
// --------------------------------------------------------------------------------------------- //

async function getQuote() {
    const data = getFields();
    const response = await fetch('/quote', getPostConfig(data));
    const payload = await response.json();
    const { name, last, ask, bid } = payload.quotes.quote;
    document.getElementById("quote-name").innerText = name;
    document.getElementById("quote-last").innerText = last;
    document.getElementById("quote-ask").innerText = ask;
    document.getElementById("quote-bid").innerText = bid;
    stoppx.value = parseFloat(last).toFixed(2);
}

// --------------------------------------------------------------------------------------------- //
// --------------------------------------------------------------------------------------------- //
// --------------------------------------------------------------------------------------------- //

function getFields() {
    return {
        symbol: symbol.value.toUpperCase().trim(),
        quantity: quantity.value,
        stoppx: stoppx.value,
        origid: origid.value.toUpperCase().trim()
    };
}

// --------------------------------------------------------------------------------------------- //
// --------------------------------------------------------------------------------------------- //
// --------------------------------------------------------------------------------------------- //

function getPostConfig(data) {
    return {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    };
}

// --------------------------------------------------------------------------------------------- //
// --------------------------------------------------------------------------------------------- //
// --------------------------------------------------------------------------------------------- //

function displayStatus(payload) {
    let color = payload.error === "Success" ? 'bg-purple-300' : 'bg-yellow-300';
    let id = payload.clientorderid || "Error";

    $('#status').append(`<span class="${color} py-1 px-3 m-1 inline-block border-black">${id}</span>`);
}

// --------------------------------------------------------------------------------------------- //
// --------------------------------------------------------------------------------------------- //
// --------------------------------------------------------------------------------------------- //
