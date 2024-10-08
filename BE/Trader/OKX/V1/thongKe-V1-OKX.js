require('dotenv').config({
    path: "../../../.env"
});

const TelegramBot = require('node-telegram-bot-api');

const { WebsocketClient, RestClient } = require('okx-api');
var cron = require('node-cron');

let wsSymbol = new WebsocketClient({
    market: "businessAws"
});

const client = new RestClient()

const bot = new TelegramBot(process.env.OKX_BOT_TOKEN_THONG_KE, {
    polling: false,
    request: {
        agentOptions: {
            family: 4
        }
    }
});

const CHANNEL_ID = process.env.OKX_CHANNEL_ID_THONG_KE

var sendTeleCount = {
    logError: false,
    total: 0
}
let messageList = []

var preTurnover = {}
var trichMauData = {}
var trichMauDataArray = {}
var trichMau = {}
var symbolObject = {}
var trichMauTimeMainSendTele = {
    pre: 0,
}




//Funcition

async function sendMessageWithRetry(messageText, retries = 5) {
    for (let i = 0; i < retries; i++) {
        try {
            messageText && await bot.sendMessage(CHANNEL_ID, messageText, {
                parse_mode: "HTML",
            });
            console.log('[->] Message sent to telegram successfully');
            return;
        } catch (error) {
            if (error.code === 429) {
                const retryAfter = error.parameters.retry_after;
                console.log(`Rate limited. Retrying after ${retryAfter} seconds...`);
                await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
            } else {
                console.log("[!] Send Telegram Error", error)
            }
        }
    }
    throw new Error('Failed to send message after multiple retries');

}
async function getListSymbol() {

    let listSymbol = {}

    const getSpot = client.getInstruments('SPOT')
    const getMargin = client.getInstruments("MARGIN")

    try {
        const resultGetAll = await Promise.allSettled([getSpot, getMargin])

        resultGetAll.forEach((symbolListData) => {
            symbolListData.value?.forEach(symbolData => {
                if (symbolData.quoteCcy == "USDT") {
                    const symbol = symbolData.instId

                    listSymbol[symbol] = {
                        channel: "candle1s",
                        instId: symbolData.instId
                    }

                    symbolObject[symbol] = symbolData.instType == "MARGIN" ? "🍁" : "🍀"

                    trichMauData[symbol] = {
                        open: 0,
                        close: 0,
                        high: 0,
                        low: 0,
                        turnover: 0
                    }

                    preTurnover[symbol] = 0
                    trichMauDataArray[symbol] = []
                    trichMau[symbol] = {
                        cur: 0,
                        pre: 0,
                    }
                }
            })
        })
    } catch (error) {
        console.log(`[!] Error get symbol: ${error.message}`);
    }

    return listSymbol

}



const roundNumber = (number) => {
    return Math.round(number * 10000) / 100
}

const formatNumberString = number => {
    if (number >= 1000000000) {
        return (number / 1000000000).toFixed(2) + 'B';
    } else if (number >= 1000000) {
        return (number / 1000000).toFixed(2) + 'M';
    } else if (number >= 1000) {
        return (number / 1000).toFixed(2) + 'K';
    } else {
        return number.toFixed(2);
    }
}

const sendMessageTinhOC = async (messageList) => {
    console.log(`Send telegram tính OC ( 🍁 ): `, new Date().toLocaleString("vi-vn", { timeZone: 'Asia/Ho_Chi_Minh' }));
    await sendMessageWithRetry(messageList.join("\n\n"))

}


const formatTime = time => new Date(time).toLocaleString()



const tinhOC = (symbol, data = {}) => {

    const Close = +data.close
    const Open = +data.open
    const Highest = +data.high
    const Lowest = +data.low
    const vol = data.turnover
    const timestamp = data.timestamp

    let OC = (Highest - Open) / Open
    let TP = Math.abs((Highest - Close) / (Highest - Open)) || 0
    let OCLong = (Lowest - Open) / Open
    let TPLong = Math.abs(Close - Lowest) / (Open - Lowest) || 0


    if ([Infinity, -Infinity].includes(OC)) {
        OC = 0
    }

    if ([Infinity, -Infinity].includes(OCLong)) {
        OCLong = 0
    }
    if ([Infinity, -Infinity].includes(TP)) {
        TP = 0
    }

    if ([Infinity, -Infinity].includes(TPLong)) {
        TPLong = 0
    }

    const OCRound = roundNumber(OC)
    const TPRound = roundNumber(TP)
    const OCLongRound = roundNumber(OCLong)
    const TPLongRound = roundNumber(TPLong)


    if (vol >= 5000) {
        if (OCRound >= .5 && TPRound > 0) {
            const ht = (`${symbolObject[symbol]} | <b>${symbol.replace("-USDT", "")}</b> - OC: ${OCRound}% - TP: ${TPRound}% - VOL: ${formatNumberString(vol)} | ${formatTime(timestamp)}`)
            messageList.push(ht)
            console.log(ht);
            console.log(data);
        }

        if (OCLongRound <= -.5 && TPLongRound > 0) {
            const htLong = (`${symbolObject[symbol]} | <b>${symbol.replace("-USDT", "")}</b> - OC: ${OCLongRound}% - TP: ${TPLongRound}% - VOL: ${formatNumberString(vol)} | ${formatTime(timestamp)}`)
            messageList.push(htLong)
            console.log(htLong);
            console.log(data);
        }
    }


    if (messageList.length > 0) {
        const time = Date.now()
        if (time - trichMauTimeMainSendTele.pre >= 3000) {
            sendTeleCount.total += 1
            sendMessageTinhOC(messageList)
            messageList = []
            trichMauTimeMainSendTele.pre = time
        }
    }

}
let Main = async () => {


    const listSymbolObject = await getListSymbol()

    const listSymbol = Object.values(listSymbolObject)

    await wsSymbol.subscribe(listSymbol)

    wsSymbol.on('update', (dataCoin) => {

        const dataMain = dataCoin.data[0]
        const symbol = dataCoin.arg.instId

        tinhOC(symbol, {
            timestamp: +dataMain[0],
            open: +dataMain[1],
            high: +dataMain[2],
            low: +dataMain[3],
            close: +dataMain[4],
            turnover: +dataMain[6],
        })
       

    });


    wsSymbol.on('error', (err) => {
        process.exit(1);
    });

};

try {
    Main()

    setTimeout(() => {
        cron.schedule('0 */3 * * *', async () => {
            process.exit(0);
        });
    }, 1000)
}

catch (e) {
    console.log("Error Main:", e)
}