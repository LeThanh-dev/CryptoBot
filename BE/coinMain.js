require('dotenv').config();
const { Telegraf } = require('telegraf');
const { RestClientV5, WebsocketClient } = require('bybit-api');
const API_KEY = 'foRfrB7L1GgXt1Ly5O';
const PRIVATE_KEY = 'zxbzLknpNW0k1i2Ze8UFtQq2HEK4tgVqFjgp';

const bot = new Telegraf(process.env.BOT_TOKEN);
const CHANNEL_ID = process.env.CHANNEL_ID

// Bắt đầu bot
bot.launch();



let ListCoin1m = []
let ListCoin3m = []
let ListCoin5m = []
let digit = []
let OpenTimem1 = []

let wsConfig = {
    key: API_KEY,
    secret: PRIVATE_KEY,
    market: 'v5'
}
let wsInfo = {
    key: API_KEY,
    secret: PRIVATE_KEY,
    testnet: false,
    enable_time_sync: true,
    timestamp: new Date().toISOString(),
    recvWindow: 200000,
}
let wsSymbol = new WebsocketClient(wsConfig);
let CoinInfo = new RestClientV5(wsInfo);

//Funcition

async function sendMessageWithRetry(messageText, retries = 5) {
    for (let i = 0; i < retries; i++) {
        try {
            messageText && await bot.telegram.sendMessage(CHANNEL_ID, messageText);
            return;
        } catch (error) {
            if (error.code === 429) {
                const retryAfter = error.parameters.retry_after;
                console.log(`Rate limited. Retrying after ${retryAfter} seconds...`);
                await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
            } else {
                throw error;
            }
        }
    }
    throw new Error('Failed to send message after multiple retries');
}

async function ListCoinFT() {
    let data = []
    await CoinInfo.getTickers({ category: 'linear' })
        .then((rescoin) => {
            rescoin.result.list.forEach((e) => {
                if (e.symbol.indexOf("USDT") > 0) {
                    data.push(e.symbol)
                }
            })
            //console.log(data)
        })
        .catch((error) => {
            console.error(error);
        });
    ListCoin1m = data.flatMap((coin) => {
        return `kline.1.${coin}`
    });
    ListCoin3m = data.flatMap((coin) => {
        return `kline.3.${coin}`
    });
    ListCoin5m = data.flatMap((coin) => {
        return `kline.5.${coin}`
    });

    return data
}

async function TimeS0(symbol) { //lấy thời gian mở cửa của cây nến 1m
    let TimeStart = []
    await CoinInfo.getKline({
        category: 'linear',
        symbol: symbol,
        interval: '1',
    })
        .then((response) => {
            TimeStart.push(response.result.list[0][0])
            //console.log(TimeStart)
        })
        .catch((error) => {
            console.error(error);
        });
    return TimeStart
}

async function Digit(symbol) {// proScale
    let PScale = []
    await CoinInfo.getInstrumentsInfo({
        category: 'linear',
        symbol: symbol,
    })
        .then((response) => {
            PScale.push(response.result.list[0].priceScale)
            //console.log(PScale)
        })
        .catch((error) => {
            console.error(error);
        });
    return PScale
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
        return number.toString();
    }
}

async function tinhOC(symbol, data, messageList) {



    const interval = data.interval
    const Close = data.close
    const Open = data.open
    const Highest = data.high
    const Lowest = data.low

    // console.log("Close",Close);
    // console.log("Open",Open);
    // console.log("Lowest",Lowest);
    // console.log("Highest",Highest);

    // const vol = data.volume * data.open
    const vol = data.turnover

    let OC = ((Highest - Open) / Open) || 0
    let TP = ((Highest - Close) / (Highest - Open)) || 0

    let OCLong = (Lowest - Open) / Lowest || 0
    let TPLong = (Close - Lowest) / (Open - Lowest) || 0

    if (OC == "Infinity") {
        OC = 0
    }
    if (TP == "Infinity") {
        TP = 0
    }
    if (OCLong == "Infinity") {
        OCLong = 0
    }
    if (TPLong == "Infinity") {
        TPLong = 0
    }

    //console.log(OC);
    //console.log(TP);

    //if (OC < Math.abs(OC1)) { OC = OC1 }
    //if (Close < Open) { TP = TP1 }

    //console.log(`${symbol} : Price Close ${Close}, Price OC ${OC}`)
    const OCRound = roundNumber(OC)
    const OCLongRound = roundNumber(OCLong)

    if (OCRound > 2) {
        const ht = (`${symbol.replace("USDT", "")} - (${interval} min) - OC: ${OCRound}% - TP: ${roundNumber(TP)}% - VOL: ${formatNumberString(vol)}`)
        messageList.push(ht)

    }
    if (OCLongRound > 2) {
        const htLong = (`${symbol.replace("USDT", "")} - (${interval} min) - OC: ${OCLongRound}% - TP: ${roundNumber(TPLong)}% - VOL: ${formatNumberString(vol)}`)
        messageList.push(htLong)
    }
    return messageList
}

async function history(symbol, OpenTime, limit = 10, dg, percentDefault = 1, coinListWin50 = []) {
    let TimeStart = OpenTime - limit * 60000
    let TimeSop = OpenTime - 60000
    let data = []
    //console.log(`BTCUSDT Open m1 : ${TimeStart}`)

    CoinInfo.getMarkPriceKline({
        category: 'linear',
        symbol,
        interval: "1",
        start: TimeStart,
        end: TimeSop,
        limit,
    })
        .then((response) => {
            const candles = [];

            //console.log(response.result.list)
            for (let i = 0; i < limit; i++) {
                //console.log(response.result.list[i][1])
                candles.push({
                    open: response.result.list[i][1],
                    high: response.result.list[i][2],
                    low: response.result.list[i][3],
                    close: response.result.list[i][4]
                });
            }
            // console.log(`open0`, response.result.list[0][1])

            let winCountShort = 0
            let winCountLong = 0
            let totalShort = limit
            let totalLong = limit

            const OCDownPercent = 40 / 100
            const TPDownPercent2 = 45


            for (let i = candles.length - 1; i >= 0; i--) {
                const OCDefault = candles[i].open * (100 + percentDefault) / 100
                const TPTemp = candles[i].open * (100 + 1 - OCDownPercent) / 100
                const closeTemp = candles[i].close
                if (OCDefault <= candles[i].high) {
                    if (closeTemp > TPTemp) {
                        if (candles[i - 1]?.open) {
                            const hieu = Math.abs((candles[i - 1].open - TPTemp) * TPDownPercent2 / 100)
                            const TPNew = TPTemp + hieu
                            if (TPNew <= OCDefault) {
                                if (candles[i - 1].low <= TPNew) {
                                    winCountShort++
                                }
                                else {
                                    if (candles[i - 2]?.open) {
                                        const hieu = Math.abs((candles[i - 2].open - TPTemp) * TPDownPercent2 / 100)
                                        const TPNew = TPTemp + hieu
                                        if (TPNew <= OCDefault) {
                                            if (candles[i - 2].low <= TPNew) {
                                                winCountShort++
                                            }
                                            else {
                                                if (candles[i - 3]?.open) {
                                                    const hieu = Math.abs((candles[i - 3].open - TPTemp) * TPDownPercent2 / 100)
                                                    const TPNew = TPTemp + hieu
                                                    if (TPNew <= OCDefault) {
                                                        if (candles[i - 3].low <= TPNew) {
                                                            winCountShort++
                                                        }
                                                        else {
                                                        }
                                                    }
                                                    else {
                                                    }
                                                }
                                                else {
                                                }
                                            }
                                        }
                                        else {
                                        }
                                    }
                                    else {
                                    }
                                }
                            }
                            else {
                            }
                        }
                        else {
                        }
                    }
                    else {
                        winCountShort++
                    }
                }
                else {
                    totalShort--
                }

            }

            for (let i = candles.length - 1; i >= 0; i--) {
                const OCDefault = candles[i].open * (100 - percentDefault) / 100
                const TPTemp = candles[i].open * (100 - (1 - OCDownPercent)) / 100
                const closeTemp = candles[i].close
                if (OCDefault >= candles[i].low) {
                    if (closeTemp < TPTemp) {
                        if (candles[i - 1]?.open) {
                            const hieu = Math.abs((candles[i - 1].open - TPTemp) * TPDownPercent2 / 100)
                            const TPNew = TPTemp - hieu
                            if (TPNew >= OCDefault) {
                                if (candles[i - 1].high >= TPNew) {
                                    winCountLong++
                                }
                                else {
                                    if (candles[i - 2]?.open) {
                                        const hieu = Math.abs((candles[i - 2].open - TPTemp) * TPDownPercent2 / 100)
                                        const TPNew = TPTemp - hieu
                                        if (TPNew >= OCDefault) {
                                            if (candles[i - 2].high >= TPNew) {

                                                winCountLong++
                                            }
                                            else {
                                                if (candles[i - 3].open) {
                                                    const hieu = Math.abs((candles[i - 3].open - TPTemp) * TPDownPercent2 / 100)
                                                    const TPNew = TPTemp - hieu
                                                    if (TPNew >= OCDefault) {
                                                        if (candles[i - 3].high >= TPNew) {

                                                            winCountLong++
                                                        }
                                                        else {
                                                        }
                                                    }
                                                    else {
                                                    }
                                                }
                                                else {
                                                }
                                            }
                                        }
                                        else {
                                        }
                                    }
                                    else {
                                    }
                                }
                            }
                            else {
                            }
                        }
                        else {
                        }
                    }
                    else {
                        winCountLong++
                    }
                }
                else {
                    totalLong--
                }

            }

            const shortPercent = (winCountShort / totalShort * 100).toFixed(3)
            const longPercent = (winCountLong / totalLong * 100).toFixed(3)

            const winShort = winCountShort && totalShort ? `${winCountShort} / ${totalShort}` : 0
            const winLong = winCountLong && totalLong ? `${winCountLong} / ${totalLong}` : 0


            if (shortPercent > 80 && longPercent > 80) {
                let messageText = `${symbol} ( OC: ${percentDefault}% ):\n`
                if (shortPercent > 80) {

                    messageText += `short: ${winShort} - `
                }
                if (shortPercent > 80) {
                    messageText += `long: ${winLong} - `
                }
                console.log(messageText);
                coinListWin50.push(messageText.slice(0, -2))
                // bot.telegram.sendMessage(CHANNEL_ID, messageText.slice(0, -2));
            }

        })
        .catch((error) => {
            console.error(error);
        });
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function processCoin(coinItem, coinListWin50, percentDefault, nenCount) {
    const OpenTimem1 = TimeS0("BTCUSDT");
    const digit = Digit(coinItem);
    await Promise.all([OpenTimem1, digit])
    await history(coinItem, OpenTimem1, nenCount, digit, percentDefault, coinListWin50);
}

async function processCoinsWithDelay(coinList, delayTime, percentDefault, nenCount) {
    const coinListWin50 = []
    for (const index in coinList) {
        await processCoin(coinList[index], coinListWin50, percentDefault, nenCount);
        index % 50 == 0 && await delay(delayTime);
    }
    return coinListWin50
}




let Main = async () => {
    CoinFT = await ListCoinFT()

    //sub allcoin
    wsSymbol.subscribeV5(ListCoin1m, 'linear').catch((err) => { console.log(err) });
    wsSymbol.subscribeV5(ListCoin3m, 'linear').catch((err) => { console.log(err) });
    wsSymbol.subscribeV5(ListCoin5m, 'linear').catch((err) => { console.log(err) });

    //nếu thay đổi thì sẽ update dữ liệu
    wsSymbol.on('update', async (dataCoin) => {
        const messageList = []
        if (dataCoin.wsKey === "v5LinearPublic") {

            if (dataCoin.topic.indexOf("kline.1.BTCUSDT") != -1) {
                if (dataCoin.data[0].confirm == true) {
                    //OpenTimem1 = dataCoin.data[0].start

                    const delayTime = 10;
                    const percentDefault2 = 2
                    const percentDefault25 = 2.5
                    const percentDefault3 = 3
                    const percentDefault35 = 3.5
                    const nenCount = 100;

                    console.log("GETTING...");

                    const get2 = await processCoinsWithDelay(CoinFT, delayTime, percentDefault2, nenCount)
                    sendMessageWithRetry(get2.flatMap(item => item.value).join("\n"))
                    await delay(1000)

                    const get25 = await processCoinsWithDelay(CoinFT, delayTime, percentDefault25, nenCount)
                    sendMessageWithRetry(get25.flatMap(item => item.value).join("\n"))
                    await delay(1000)

                    const get3 = await processCoinsWithDelay(CoinFT, delayTime, percentDefault3, nenCount)
                    sendMessageWithRetry(get3.flatMap(item => item.value).join("\n"))
                    await delay(1000)

                    const get35 = await processCoinsWithDelay(CoinFT, delayTime, percentDefault35, nenCount)
                    sendMessageWithRetry(get35.flatMap(item => item.value).join("\n"))
                    await delay(1000)

                }
            }

            if (dataCoin.topic.indexOf("kline.1.") !== -1) {
                let symbol = dataCoin.topic.replace("kline.1.", "")
                if (dataCoin.data[0].confirm === true) {
                    dataCoin.data.forEach((e) => {
                        tinhOC(symbol, e, messageList)
                    })
                }
            }

            // 3M

            // if (dataCoin.topic.indexOf("kline.3.BTCUSDT") != -1) {
            //     if (dataCoin.data[0].confirm == true) {
            //         //OpenTimem1 = dataCoin.data[0].start

            //         const delayTime = 10;
            //         const percentDefault2 = 2
            //         const percentDefault25 = 2.5
            //         const percentDefault3 = 3
            //         const percentDefault35 = 3.5
            //         const nenCount = 100;

            //         console.log("GETTING...");

            //         const get2 = await processCoinsWithDelay(CoinFT, delayTime, percentDefault2, nenCount)
            //         sendMessageWithRetry(get2.flatMap(item => item.value).join("\n"))
            //         await delay(1000)

            //         const get25 = await processCoinsWithDelay(CoinFT, delayTime, percentDefault25, nenCount)
            //         sendMessageWithRetry(get25.flatMap(item => item.value).join("\n"))
            //         await delay(1000)

            //         const get3 = await processCoinsWithDelay(CoinFT, delayTime, percentDefault3, nenCount)
            //         sendMessageWithRetry(get3.flatMap(item => item.value).join("\n"))
            //         await delay(1000)

            //         const get35 = await processCoinsWithDelay(CoinFT, delayTime, percentDefault35, nenCount)
            //         sendMessageWithRetry(get35.flatMap(item => item.value).join("\n"))
            //         await delay(1000)

            //     }
            // }

            if (dataCoin.topic.indexOf("kline.3.") !== -1) {
                let symbol = dataCoin.topic.replace("kline.3.", "")
                if (dataCoin.data[0].confirm === true) {
                    dataCoin.data.forEach((e) => {
                        tinhOC(symbol, e, messageList)
                    })
                }
            }

            // 5M

            // if (dataCoin.topic.indexOf("kline.5.BTCUSDT") != -1) {
            //     if (dataCoin.data[0].confirm == true) {
            //         //OpenTimem1 = dataCoin.data[0].start

            //         const delayTime = 10;
            //         const percentDefault2 = 2
            //         const percentDefault25 = 2.5
            //         const percentDefault3 = 3
            //         const percentDefault35 = 3.5
            //         const nenCount = 100;

            //         console.log("GETTING...");

            //         const get2 = await processCoinsWithDelay(CoinFT, delayTime, percentDefault2, nenCount)
            //         sendMessageWithRetry(get2.flatMap(item => item.value).join("\n"))
            //         await delay(1000)

            //         const get25 = await processCoinsWithDelay(CoinFT, delayTime, percentDefault25, nenCount)
            //         sendMessageWithRetry(get25.flatMap(item => item.value).join("\n"))
            //         await delay(1000)

            //         const get3 = await processCoinsWithDelay(CoinFT, delayTime, percentDefault3, nenCount)
            //         sendMessageWithRetry(get3.flatMap(item => item.value).join("\n"))
            //         await delay(1000)

            //         const get35 = await processCoinsWithDelay(CoinFT, delayTime, percentDefault35, nenCount)
            //         sendMessageWithRetry(get35.flatMap(item => item.value).join("\n"))
            //         await delay(1000)

            //     }
            // }

            if (dataCoin.topic.indexOf("kline.5.") !== -1) {
                let symbol = dataCoin.topic.replace("kline.5.", "")
                if (dataCoin.data[0].confirm === true) {
                    dataCoin.data.forEach((e) => {
                        tinhOC(symbol, e, messageList)
                    })
                }
            }
        }
        messageList.length && sendMessageWithRetry(messageList.join("\n"))

    });




    //Báo lỗi socket
    wsSymbol.on('error', (err) => {
        console.error('error', err);
    });

};




// const sendMessageToChannel = async (messageText) => {

//     try {
//         await bot.telegram.sendMessage(CHANNEL_ID, messageText);
//         console.log('Send message to channel successful');
//     } catch (error) {
//         await bot.telegram.sendMessage(CHANNEL_ID, `ERROR: ${error}`);
//     }

// }


Main()