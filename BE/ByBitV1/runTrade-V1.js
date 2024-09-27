const Big = require('big.js');
const { v4: uuidv4 } = require('uuid');
const { exec } = require('child_process');
require('dotenv').config({
    path: "../.env"
});
const cron = require('node-cron');
const changeColorConsole = require('cli-color');
const TelegramBot = require('node-telegram-bot-api');
const { getAllSymbolMarginBE, getAllStrategiesActiveMarginBE, createStrategiesMultipleMarginBE, deleteStrategiesMultipleMarginBE, offConfigMarginBE } = require('../controllers/margin');
const { getAllSymbolSpotBE, getAllStrategiesActiveSpotBE, createStrategiesMultipleSpotBE, deleteStrategiesMultipleSpotBE, offConfigSpotBE } = require('../controllers/spot');
const { createPositionBE, getPositionBySymbol, deletePositionBE, updatePositionBE } = require('../controllers/positionV1');
const { getAllStrategiesActiveScannerBE, deleteAllForUPcodeV1, deleteAllScannerV1BE } = require('../controllers/scanner');


const { RestClientV5, WebsocketClient } = require('bybit-api');

const wsConfig = {
    market: 'v5',
}

const wsSymbol = new WebsocketClient(wsConfig);

const LIST_ORDER = ["order", "execution"]
const MAX_ORDER_LIMIT = 20
const MAX_AMEND_LIMIT = 10
const MAX_CANCEL_LIMIT = 20
const RE_TP_ADAPTIVE = 5
const TP_ADAPTIVE = 80
const TP_NOT_ADAPTIVE = 60

const SPOT_MODEL_DEFAULT = {
    AmountAutoPercent: 5,
    AmountExpire: 10,
    AmountIncreaseOC: 8,
}

const clientDigit = new RestClientV5({
    testnet: false,
});

// ----------------------------------------------------------------------------------
let missTPDataBySymbol = {}

var closeMarketRepayBySymbol = {}
var listKline = {}
var listKlineObject = {}

var allSymbol = []
var updatingAllMain = false
var connectErrorMain = false
var repayCoinObject = {}


// -------  ------------

var allScannerDataObject = {}
var allStrategiesByCandleAndSymbol = {}
var symbolTradeTypeObject = {}
var trichMauOCListObject = {}
var trichMauTPListObject = {}

var allStrategiesByBotIDAndOrderID = {}
var allStrategiesByBotIDAndStrategiesID = {}
var allStrategiesByBotIDOrderOC = {}
var maxAmendOrderOCData = {}
var maxCancelOrderOCData = {}
var botApiList = {}
var digitAllCoinObject = {}
var botAmountListObject = {}
var botListTelegram = {}

// -------  ------------

var listOCByCandleBot = {}
var listConfigIDByScanner = {}
// ----------------------------------------------------------------------------------

// Scanner
var preTurnover = {}
var trichMauData = {}
var trichMauDataArray = {}
var trichMau = {}
var timeExpire = 0

// ----------------------------------------------------------------------------------
const getWebsocketClientConfig = ({
    ApiKey,
    SecretKey,
}) => {
    return {
        testnet: false,
        key: ApiKey,
        secret: SecretKey,
        market: 'v5',
        recvWindow: 100000,
    }
}

const getRestClientV5Config = ({
    ApiKey,
    SecretKey,
}) => {
    return {
        testnet: false,
        key: ApiKey,
        secret: SecretKey,
        syncTimeBeforePrivateRequests: true,
    }
}

const handleCalcOrderChange = ({ OrderChange, Numbs }) => {
    const result = [];
    const step = OrderChange * 0.05; // 2% của OrderChange
    // const step = 0.1; // 2% của OrderChange

    if (Numbs % 2 === 0) { // Nếu numbs là số chẵn
        for (let i = -(Numbs / 2); i < Numbs / 2; i++) {
            result.push(OrderChange + i * step);
        }
    } else { // Nếu numbs là số lẻ
        for (let i = -Math.floor((Numbs - 1) / 2); i <= Math.floor((Numbs - 1) / 2); i++) {
            result.push(OrderChange + i * step);
        }
    }

    return result;
};

const roundPrice = (
    {
        price,
        tickSize
    }
) => {

    const priceFix = new Big(price)
    const tickSizeFIx = new Big(tickSize)

    return new Big(Math.floor(priceFix.div(tickSizeFIx).toNumber())).times(tickSizeFIx).toString();
}
const roundQty = (
    {
        price,
        tickSize
    }
) => {

    const priceFix = new Big(price)
    const tickSizeFIx = new Big(tickSize)

    return new Big(Math.floor(priceFix.div(tickSizeFIx).toNumber())).times(tickSizeFIx).toString();

}



// ----------------------------------------------------------------------------------


const cancelAllListOrderOC = async (listOCByCandleBotInput = {}) => {


    const allData = Object.values(listOCByCandleBotInput).reduce((pre, item) => {

        if (Object.values(item.listOC || {}).length > 0) {

            pre[item.ApiKey] = {
                listOC: {
                    ...(pre[item.ApiKey]?.listOC || {}),
                    ...item.listOC
                },
                ApiKey: item.ApiKey,
                SecretKey: item.SecretKey,
            }
        }
        return pre
    }, {});

    await handleCancelAllOrderOC(Object.values(allData || {}))

}
const Digit = async () => {// proScale
    let PScale = []
    await clientDigit.getInstrumentsInfo({
        category: 'spot',
    })
        .then((response) => {
            response.result.list.forEach((e) => {
                if (e.symbol.split("USDT")[1] === "") {
                    PScale.push({
                        symbol: e.symbol,
                        priceScale: e.priceFilter.tickSize,
                        basePrecision: e.lotSizeFilter.basePrecision,
                    })
                }
            })

        })
        .catch((error) => {
            console.log("Error Digit:", error)
        });
    return PScale
}


const handleSubmitOrder = async ({
    strategy,
    strategyID,
    symbol,
    qty,
    side,
    price,
    priceOrderTPTemp,
    ApiKey,
    SecretKey,
    botName,
    botID,
    botData,
    telegramID,
    telegramToken,
    coinOpen,
    isLeverage
}) => {


    !allStrategiesByBotIDAndStrategiesID[botID]?.[strategyID] && cancelAll({ botID, strategyID });

    !allStrategiesByBotIDOrderOC[botID] && (
        allStrategiesByBotIDOrderOC[botID] = {
            totalOC: 0,
            logError: false,
            timeout: ""
        }
    );

    !listOCByCandleBot[botID] && (listOCByCandleBot[botID] = {
        listOC: {},
        ApiKey,
        SecretKey,
    });

    allStrategiesByBotIDAndStrategiesID[botID][strategyID].OC.ordering = true

    const orderLinkId = uuidv4()


    if (allStrategiesByBotIDOrderOC[botID].totalOC < MAX_ORDER_LIMIT) {

        listOCByCandleBot[botID].listOC[strategyID] = {
            strategyID,
            strategy,
            symbol,
            side,
            botName,
            botID,
            ApiKey,
            SecretKey,
            orderLinkId,
            OrderChange: strategy.OrderChange
        }

        allStrategiesByBotIDOrderOC[botID].totalOC += 1

        allStrategiesByBotIDAndOrderID[botID][orderLinkId] = {
            strategy,
            timeOutFunc: "",
            OC: true
        }

        const clientConfig = getRestClientV5Config({ ApiKey, SecretKey })

        const client = new RestClientV5(clientConfig);

        await client
            .submitOrder({
                category: 'spot',
                symbol,
                side,
                positionIdx: 0,
                orderType: 'Limit',
                qty,
                price,
                orderLinkId,
                isLeverage
            })
            .then((response) => {
                if (response.retCode == 0) {

                    const newOrderID = response.result.orderId
                    const newOrderLinkID = response.result.orderLinkId

                    allStrategiesByBotIDAndStrategiesID[botID][strategyID].OC.orderID = newOrderID
                    allStrategiesByBotIDAndStrategiesID[botID][strategyID].OC.orderLinkId = newOrderLinkID
                    allStrategiesByBotIDAndStrategiesID[botID][strategyID].OC.priceOrderTPTemp = priceOrderTPTemp

                    const text = `\n[+OC] Order OC ( ${strategy.OrderChange} ) ( ${botName} - ${side} - ${symbol} ) successful: ${price} - ${qty}`
                    console.log(text)
                    console.log(changeColorConsole.greenBright(`[_OC orderID_] ( ${botName} - ${side} - ${symbol} ): ${newOrderLinkID}`));

                    // sendMessageWithRetry({
                    //     messageText: text,
                    //     telegramID,
                    //     telegramToken
                    // })

                }
                else {
                    console.log(changeColorConsole.yellowBright(`\n[!] Ordered OC ( ${strategy.OrderChange} )  ( ${botName} - ${side} - ${symbol} ) failed: ${price} - ${qty} -`, response.retMsg))
                    delete allStrategiesByBotIDAndOrderID[botID][orderLinkId]
                    delete listOCByCandleBot[botID].listOC[strategyID]

                }
                allStrategiesByBotIDAndStrategiesID[botID][strategyID].OC.ordering = false
            })
            .catch((error) => {
                console.log(`\n[!] Ordered OC ( ${strategy.OrderChange} )  ( ${botName} - ${side} - ${symbol} ) error `, error)
                allStrategiesByBotIDAndStrategiesID[botID][strategyID].OC.ordering = false
                delete allStrategiesByBotIDAndOrderID[botID][orderLinkId]
                delete listOCByCandleBot[botID].listOC[strategyID]
            });

        allStrategiesByBotIDOrderOC[botID].timeout && clearTimeout(allStrategiesByBotIDOrderOC[botID].timeout)
        allStrategiesByBotIDOrderOC[botID].timeout = setTimeout(() => {

            allStrategiesByBotIDOrderOC[botID].logError = false
            allStrategiesByBotIDOrderOC[botID].totalOC = 0
        }, 1000)
    }
    else {
        if (!allStrategiesByBotIDOrderOC[botID]?.logError) {
            console.log(changeColorConsole.redBright(`[!] LIMIT ORDER OC ( ${botName} )`));
            allStrategiesByBotIDOrderOC[botID].logError = true
        }
    }
}

const handleMoveOrderOC = async ({
    strategy,
    strategyID,
    symbol,
    price,
    priceOrderTPTemp,
    orderId,
    side,
    ApiKey,
    SecretKey,
    botName,
    botID
}) => {
    // console.log(changeColorConsole.greenBright(`Price Move TP ( ${botName} - ${side} - ${symbol} - ${candle} ):`, price));
    !maxAmendOrderOCData[botID] && (
        maxAmendOrderOCData[botID] = {
            totalOC: 0,
            logError: false,
            timeout: ""
        }
    );
    if (maxAmendOrderOCData[botID].totalOC < MAX_AMEND_LIMIT) {

        const clientConfig = getRestClientV5Config({ ApiKey, SecretKey })

        const client = new RestClientV5(clientConfig);
        maxAmendOrderOCData[botID].totalOC += 1
        await client
            .amendOrder({
                category: 'spot',
                symbol,
                price,
                orderId
            })
            .then((response) => {
                if (response.retCode == 0) {
                    console.log(`[->] Move Order OC ( ${strategy.OrderChange} ) ( ${botName} - ${side} - ${symbol} ) successful: ${price}`)
                    allStrategiesByBotIDAndStrategiesID[botID][strategyID].OC.priceOrderTPTemp = priceOrderTPTemp
                }
                else {
                    console.log(changeColorConsole.yellowBright(`[!] Move Order OC ( ${strategy.OrderChange} ) ( ${botName} - ${side} - ${symbol} ) failed: ${price} -`, response.retMsg))
                }
            })
            .catch((error) => {
                console.log(`[!] Move Order OC ( ${strategy.OrderChange} ) ( ${botName} - ${side} - ${symbol} ) error `, error)
            });
        maxAmendOrderOCData[botID].timeout && clearTimeout(maxAmendOrderOCData[botID].timeout)
        maxAmendOrderOCData[botID].timeout = setTimeout(() => {
            maxAmendOrderOCData[botID].logError = false
            maxAmendOrderOCData[botID].totalOC = 0
        }, 1000)
    }
    else {
        if (!maxAmendOrderOCData[botID]?.logError) {
            console.log(changeColorConsole.redBright(`[!] LIMIT AMEND OC ( ${botName} )`));
            maxAmendOrderOCData[botID].logError = true
        }
    }
}

const handleSubmitOrderTP = async ({
    strategy,
    strategyID,
    symbol,
    side,
    qty,
    price,
    ApiKey,
    SecretKey,
    missState = false,
    botName,
    botID
}) => {

    // console.log(changeColorConsole.greenBright(`Price order TP ( ${botName} - ${side} - ${symbol} - ${candle} ):`, price));

    const botSymbolMissID = `${botID}-${symbol}`

    const orderLinkId = uuidv4()

    if (!missState) {
        allStrategiesByBotIDAndOrderID[botID][orderLinkId] = {
            strategy,
            TP: true
        }
    }

    const clientConfig = getRestClientV5Config({ ApiKey, SecretKey })

    const client = new RestClientV5(clientConfig);
    await client
        .submitOrder({
            category: 'spot',
            symbol,
            side,
            positionIdx: 0,
            orderType: 'Limit',
            qty,
            price,
            orderLinkId,
            isLeverage: symbolTradeTypeObject[symbol] === "Spot" ? 0 : 1
        })
        .then((response) => {
            if (response.retCode == 0) {
                const newOrderID = response.result.orderId
                const newOrderLinkID = response.result.orderLinkId

                if (strategyID) {
                    allStrategiesByBotIDAndStrategiesID[botID][strategyID].TP.orderID = newOrderID
                    allStrategiesByBotIDAndStrategiesID[botID][strategyID].TP.orderLinkId = newOrderLinkID
                }


                missTPDataBySymbol[botSymbolMissID]?.timeOutFunc && clearTimeout(missTPDataBySymbol[botSymbolMissID].timeOutFunc)


                missTPDataBySymbol[botSymbolMissID] = {
                    ...missTPDataBySymbol[botSymbolMissID],
                    size: missTPDataBySymbol[botSymbolMissID].size + Math.abs(qty),
                    priceOrderTP: price
                }

                // missTPDataBySymbol[botSymbolMissID].orderIDOfListTP.push({
                //     orderID: newOrderID,
                //     strategyID
                // })

                // if (missState) {

                //     // allStrategiesByBotIDAndStrategiesID[botID][strategyID].OC.orderFilled = true
                //     missTPDataBySymbol[botSymbolMissID].orderID = newOrderID
                //     missTPDataBySymbol[botSymbolMissID].ApiKey = ApiKey
                //     missTPDataBySymbol[botSymbolMissID].SecretKey = SecretKey
                //     missTPDataBySymbol[botSymbolMissID].botID = botID
                //     missTPDataBySymbol[botSymbolMissID].botName = botName
                // }


                console.log(`[+TP] Order TP ( ${strategy?.OrderChange} ) ( ${botName} - ${side} - ${symbol} ) successful: ${price} - ${qty}`)
                console.log(changeColorConsole.greenBright(`[_TP orderID_] ( ${botName} - ${side} - ${symbol} ): ${newOrderLinkID}`));

            }
            else {
                console.log(changeColorConsole.yellowBright(`[!] Order TP ( ${strategy?.OrderChange} ) - ( ${botName} - ${side} - ${symbol} ) failed: ${price} - ${qty} -`, response.retMsg))
                delete allStrategiesByBotIDAndOrderID[botID][orderLinkId]


            }
        })
        .catch((error) => {
            console.log(`[!] Order TP ( ${strategy?.OrderChange} ) - ( ${botName} - ${side} - ${symbol} ) error:`, error)
            delete allStrategiesByBotIDAndOrderID[botID][orderLinkId]

            console.log("ERROR Order TP:", error)
        });
}


const moveOrderTP = async ({
    strategyID,
    strategy,
    symbol,
    price,
    orderId,
    side,
    ApiKey,
    SecretKey,
    botName,
    botID
}) => {
    // console.log(changeColorConsole.greenBright(`Price Move TP ( ${botName} - ${side} - ${symbol} - ${candle} ):`, price));

    const clientConfig = getRestClientV5Config({ ApiKey, SecretKey })

    const client = new RestClientV5(clientConfig);
    await client
        .amendOrder({
            category: 'spot',
            symbol,
            price,
            orderId
        })
        .then((response) => {
            if (response.retCode == 0) {
                allStrategiesByBotIDAndStrategiesID[botID][strategyID].TP.orderID = response.result.orderId
                console.log(`[->] Move Order TP ( ${strategy.OrderChange} ) ( ${botName} - ${side} - ${symbol} ) successful: ${price}`)
            }
            else {

                console.log(changeColorConsole.yellowBright(`[!] Move Order TP ( ${strategy.OrderChange} ) ( ${botName} - ${side} - ${symbol} ) failed `, response.retMsg))
                // allStrategiesByBotIDAndStrategiesID[botID][strategyID].TP.orderID = ""
            }
        })
        .catch((error) => {
            console.log(`[!] Move Order TP ( ${strategy.OrderChange} ) ( ${botName} - ${side} - ${symbol} ) error `, error)
            // allStrategiesByBotIDAndStrategiesID[botID][strategyID].TP.orderID = ""
        });

}

const handleMoveOrderTP = async ({
    strategyID,
    strategy,
    side,
    ApiKey,
    SecretKey,
    botName,
    botID
}) => {

    const sideText = side === "Buy" ? "Sell" : "buy"
    const symbol = strategy.symbol

    if (allStrategiesByBotIDAndStrategiesID[botID][strategyID]?.TP.orderID) {

        const TPOld = Math.abs(allStrategiesByBotIDAndStrategiesID[botID][strategyID]?.TP.price)

        const priceScale = digitAllCoinObject[symbol]?.priceScale
        let TPNew
        if (strategy.PositionSide === "Long") {
            TPNew = TPOld - priceScale
        }
        else {
            TPNew = TPOld + priceScale
        }

        allStrategiesByBotIDAndStrategiesID[botID][strategyID].TP.price = TPNew

        const dataInput = {
            strategyID,
            strategy,
            symbol,
            price: roundPrice({
                price: TPNew,
                tickSize: priceScale
            }),
            orderId: allStrategiesByBotIDAndStrategiesID[botID][strategyID]?.TP.orderID,
            side: sideText,
            ApiKey,
            SecretKey,
            botName,
            botID
        }
        await moveOrderTP(dataInput)

    }
}

const handleRepaySymbol = async ({
    symbol,
    botID,
    side,
    ApiKey,
    SecretKey
}) => {
    console.log(changeColorConsole.magentaBright(`[...] Repay ( ${symbol}  ${side} )`));

    repayCoinObject[symbol] = true

    const clientConfigRepay = getRestClientV5Config({ ApiKey, SecretKey })
    const clientRepay = new RestClientV5(clientConfigRepay);

    await clientRepay.repayLiability({ coin: symbol.replace("USDT", "") }).then((response) => {
        if (response.retCode == 0) {
            console.log(changeColorConsole.greenBright(`[V] Repay ( ${symbol}  ${side} ) successful`));
            closeMarketRepayBySymbol[botID][symbol] = true
        }
        else {
            console.log(changeColorConsole.yellowBright(`[!] Repay ( ${symbol}  ${side} ) failed: ${response.retMsg}`));
        }
    })
        .catch((error) => {
            console.log(`[!] Repay ( ${symbol}  ${side} ) error: ${error}`)
        });
    repayCoinObject[symbol] = false
}
const handleCloseMarket = async ({
    symbol,
    side,
    botID,
    OrderChange,
    ApiKey,
    SecretKey,
    qty,
}) => {

    if (!closeMarketRepayBySymbol[botID]?.[symbol]) {

        closeMarketRepayBySymbol[botID] = closeMarketRepayBySymbol[botID] || {}

        const botSymbolMissID = `${botID}-${symbol}`

        const qtyMain = qty || missTPDataBySymbol[botSymbolMissID]?.size?.toString()

        if (missTPDataBySymbol[botSymbolMissID]?.size) {
            missTPDataBySymbol[botSymbolMissID].size = Math.abs(qtyMain)
        }

        const clientConfig = getRestClientV5Config({ ApiKey, SecretKey })

        const client = new RestClientV5(clientConfig);

        const MarketName = symbolTradeTypeObject[symbol]
        const isLeverage = MarketName === "Spot" ? 0 : 1

        console.log("\n[...] Cancel All OC For Close Market-Repay");

        await handleCancelAllOrderOC(listOCByCandleBot[botID])

        if (side === "Buy") {
            client
                .submitOrder({
                    category: 'spot',
                    symbol,
                    side: side === "Buy" ? "Sell" : "Buy",
                    positionIdx: 0,
                    orderType: 'Market',
                    qty: qtyMain,
                    isLeverage
                })
                .then((response) => {

                    if (response.retCode == 0) {
                        console.log(changeColorConsole.greenBright(`[V] Close market ( ${MarketName} ) ( ${symbol}  ${side} - ${OrderChange} ) successful: ${qtyMain}`));
                        closeMarketRepayBySymbol[botID][symbol] = true
                    }
                    else {
                        console.log(changeColorConsole.yellowBright(`[!] Close market ( ${MarketName} ) ( ${symbol}  ${side} - ${OrderChange} ) failed: ${qtyMain} - ${response.retMsg}`));
                    }
                })
                .catch((error) => {
                    console.log(`[!] Close market ( ${MarketName} ) ( ${symbol}  ${side} - ${OrderChange} ) error: ${error}`)
                });
        }
        else {
            await handleRepaySymbol({
                symbol,
                botID,
                side,
                ApiKey,
                SecretKey
            })
        }
    }
}
const handleCancelOrderOC = async ({
    strategyID,
    strategy,
    symbol,
    side,
    ApiKey,
    SecretKey,
    botName,
    botID,
    OrderChange,
    orderId = allStrategiesByBotIDAndStrategiesID[botID][strategyID].OC.orderID
}) => {

    !maxCancelOrderOCData[botID] && (
        maxCancelOrderOCData[botID] = {
            totalOC: 0,
            logError: false,
            timeout: ""
        }
    );



    if (maxCancelOrderOCData[botID].totalOC < MAX_CANCEL_LIMIT) {

        const clientConfig = getRestClientV5Config({ ApiKey, SecretKey })

        const client = new RestClientV5(clientConfig);


        await client
            .cancelOrder({
                category: 'spot',
                symbol,
                orderId
            })
            .then((response) => {
                if (response.retCode == 0) {
                    console.log(`[V] Cancel order OC ( ${OrderChange} ) ( ${botName} - ${side} -  ${symbol} ) successful `);
                }
                else {
                    console.log(changeColorConsole.yellowBright(`[!] Cancel order OC ( ${OrderChange} ) ( ${botName} - ${side} -  ${symbol} ) failed `, response.retMsg))
                    handleCloseMarket({
                        OrderChange,
                        botID,
                        side,
                        symbol,
                        ApiKey,
                        SecretKey,
                        OrderChange: strategy.OrderChange
                    })
                }
            })
            .catch((error) => {
                console.log(`[!] Cancel order OC ( ${OrderChange} ) ( ${botName} - ${side} -  ${symbol} ) error `, error)
                handleCloseMarket({
                    OrderChange,
                    botID,
                    side,
                    symbol,
                    ApiKey,
                    SecretKey,
                    OrderChange: strategy.OrderChange
                })
            });
        cancelAll({ strategyID, botID })
        delete listOCByCandleBot[botID].listOC[strategyID]

        maxCancelOrderOCData[botID].timeout && clearTimeout(maxCancelOrderOCData[botID].timeout)
        maxCancelOrderOCData[botID].timeout = setTimeout(() => {
            maxCancelOrderOCData[botID].logError = false
            maxCancelOrderOCData[botID].totalOC = 0
        }, 1000)
    }
    else {
        if (!maxCancelOrderOCData[botID]?.logError) {
            console.log(changeColorConsole.redBright(`[!] LIMIT AMEND OC ( ${botName} )`));
            maxCancelOrderOCData[botID].logError = true
        }
    }


}


const handleCancelAllOrderOC = async (items = [], batchSize = 10) => {

    if (items.length > 0) {
        await Promise.allSettled(items.map(async item => {

            const clientConfig = getRestClientV5Config({ ApiKey: item.ApiKey, SecretKey: item.SecretKey })

            const client = new RestClientV5(clientConfig);

            const list = Object.values(item.listOC || {})

            if (list.length > 0) {
                console.log(`[...] Total OC Can Be Cancelled: ${list.length}`);
                let index = 0;
                const listCancel = {}
                while (index < list.length) {
                    const batch = list.slice(index, index + batchSize);

                    const newList = batch.reduce((pre, cur) => {
                        const curOrderLinkId = cur.orderLinkId

                        const botIDTemp = cur.botID
                        const strategyIDTemp = cur.strategyID

                        if (!allStrategiesByBotIDAndStrategiesID?.[botIDTemp]?.[strategyIDTemp]?.OC?.orderFilled) {
                            pre.push({
                                symbol: cur.symbol,
                                orderLinkId: curOrderLinkId,
                            })
                            listCancel[curOrderLinkId] = cur
                        }
                        else {
                            const OrderChange = cur.strategy.OrderChange
                            console.log(`[V] Cancel order OC ( ${OrderChange} ) ( ${cur.botName} - ${cur.side} -  ${cur.symbol} ) has been filled `);
                            handleCloseMarket({
                                OrderChange,
                                botID: botIDTemp,
                                side: cur.side,
                                symbol: cur.symbol,
                                ApiKey: cur.ApiKey,
                                SecretKey: cur.SecretKey,
                            })
                            cancelAll({
                                botID: botIDTemp,
                                strategyID: strategyIDTemp,
                            })
                            delete listOCByCandleBot[botIDTemp].listOC[strategyIDTemp]
                        }
                        return pre
                    }, [])

                    console.log(`[...] Canceling ${newList.length} OC`);

                    const res = await client.batchCancelOrders("spot", newList)
                    const listSuccess = res.result.list || []
                    const listSuccessCode = res.retExtInfo.list || []


                    listSuccess.forEach((item, index) => {
                        const data = listCancel[item.orderLinkId]
                        const codeData = listSuccessCode[index]
                        const botIDTemp = data.botID
                        const strategyIDTemp = data.strategyID
                        const OrderChange = data.strategy.OrderChange

                        if (codeData.code == 0) {
                            console.log(`[V] Cancel order OC ( ${OrderChange} )  ( ${data.botName} - ${data.side} -  ${data.symbol} ) successful `);
                        }
                        else {
                            console.log(changeColorConsole.yellowBright(`[!] Cancel order OC ( ${OrderChange} )  ( ${data.botName} - ${data.side} -  ${data.symbol} ) failed `, codeData.msg));
                            handleCloseMarket({
                                OrderChange: OrderChange,
                                botID: botIDTemp,
                                side: data.side,
                                symbol: data.symbol,
                                ApiKey: data.ApiKey,
                                SecretKey: data.SecretKey,
                            })
                        }
                        cancelAll({
                            botID: botIDTemp,
                            strategyID: strategyIDTemp,
                        })
                        delete listOCByCandleBot[botIDTemp].listOC[strategyIDTemp]
                    })

                    await delay(1200)
                    index += batchSize
                }
            }
        }))
        console.log("[V] Cancel All OC Successful");

    }

}
const handleOrderMultipleOC = async ({
    scannerData = {},
    batchSize = 10,
    symbol = "",
    coinCurrent
}) => {


    const clientConfig = getRestClientV5Config({ ApiKey: scannerData.botID.ApiKey, SecretKey: scannerData.botID.SecretKey })

    const client = new RestClientV5(clientConfig);

    const listOC = handleCalcOrderChange({ OrderChange: +scannerData.OrderChange, Numbs: +scannerData.Numbs })

    const orderLinkIdList = {}

    const list = listOC.map(OCData => {
        const price = coinCurrent - coinCurrent * OCData / 100

        const qty = (scannerData.Amount / +price).toFixed(0)
        const orderLinkId = uuidv4()
        orderLinkIdList[orderLinkId] = OCData

        return {
            symbol,
            side: scannerData.PositionSide == "Long" ? "Buy" : "Sell",
            positionIdx: 0,
            orderType: 'Limit',
            qty,
            price: roundPrice({
                price: price,
                tickSize: digitAllCoinObject[symbol]?.priceScale
            }),
            orderLinkId,
            // isLeverage: scannerData.Market === "Spot" ? 0 : 1
        }
    })

    let index = 0;

    while (index < list.length) {
        const batch = list.slice(index, index + batchSize);

        const res = await client.batchSubmitOrders("spot", batch)
        const listSuccess = res.result.list || []
        const listSuccessCode = res.retExtInfo.list || []



        listSuccess.forEach((item, index) => {
            const codeData = listSuccessCode[index]
            const OCSuccess = orderLinkIdList[item.orderLinkId]

            if (codeData.code == 0) {
                console.log(`[V] Order OC ( ${OCSuccess} ) successful `);

            }
            else {
                console.log(changeColorConsole.yellowBright(`[!] Order OC ( ${OCSuccess} ) failed:`, codeData.msg))
            }
        })


        // listSuccess.forEach((item, index) => {
        //     const data = listCancel[item.orderLinkId]
        //     const codeData = listSuccessCode[index]
        //     const botIDTemp = data.botID
        //     const strategyIDTemp = data.strategyID
        //     const candleTemp = data.candle

        //     if (codeData.code == 0) {
        //         console.log(`[V] Order OC  successful `);
        //         cancelAll({
        //             botID: botIDTemp,
        //             strategyID: strategyIDTemp,
        //         })
        //     }
        //     else {
        //         allStrategiesByBotIDAndStrategiesID[botIDTemp][strategyIDTemp].OC.orderID = ""
        //         console.log(changeColorConsole.yellowBright(`[!] Cancel order ( ${data.botName} - ${data.side} -  ${data.symbol} ) failed `, codeData.msg));
        //     }
        //     delete listOCByCandleBot[botIDTemp].listOC[strategyIDTemp]
        // })

        await delay(1200)
        index += batchSize
        console.log("[V] Order All OC Successful");

    }

}
const handleCreateMultipleConfigSpot = async ({
    scannerData = {},
    symbol = "",
    botName
}) => {
    const scannerID = scannerData._id
    const botData = scannerData.botID

    console.log(`[...] Create ${scannerData.Numbs} Config Spot ( ${symbol} )`);

    const listOC = handleCalcOrderChange({ OrderChange: +scannerData.OrderChange, Numbs: +scannerData.Numbs })

    const dataInput = listOC.map(OCData => {
        return {
            "PositionSide": "Long",
            "OrderChange": OCData.toFixed(3),
            "Amount": scannerData.Amount,
            "IsActive": scannerData.IsActive,
            "Expire": scannerData.Expire,
            "Limit": scannerData.Limit,
            "AmountAutoPercent": SPOT_MODEL_DEFAULT.AmountAutoPercent,
            "AmountIncreaseOC": SPOT_MODEL_DEFAULT.AmountIncreaseOC,
            "AmountExpire": SPOT_MODEL_DEFAULT.AmountExpire,
            "Adaptive": true,
            "Reverse": false,
            "Remember": false
        }
    })

    const res = await createStrategiesMultipleSpotBE({
        dataInput,
        botID: botData._id,
        botName,
        symbol,
        scannerID
    })


    const newData = res.data

    if (newData.length > 0) {
        console.log(changeColorConsole.cyanBright("\n", res.message));

        listConfigIDByScanner[scannerID] = listConfigIDByScanner[scannerID] || {}

        listConfigIDByScanner[scannerID][symbol] = newData

        await handleSocketAddNew(newData)
    }

}
const handleCreateMultipleConfigMargin = async ({
    scannerData = {},
    symbol = "",
    botName
}) => {


    const scannerID = scannerData._id
    const PositionSide = scannerData.PositionSide
    const botData = scannerData.botID

    console.log(`[...] Create ${scannerData.Numbs} Config Margin (${symbol} - ${PositionSide} )`);


    const listOC = handleCalcOrderChange({ OrderChange: +scannerData.OrderChange, Numbs: +scannerData.Numbs })

    const dataInput = listOC.map(OCData => {
        return {
            "PositionSide": PositionSide,
            "OrderChange": OCData.toFixed(3),
            "Amount": scannerData.Amount,
            "IsActive": scannerData.IsActive,
            "Expire": scannerData.Expire,
            "Limit": scannerData.Limit,
            "AmountAutoPercent": SPOT_MODEL_DEFAULT.AmountAutoPercent,
            "AmountIncreaseOC": SPOT_MODEL_DEFAULT.AmountIncreaseOC,
            "AmountExpire": SPOT_MODEL_DEFAULT.AmountExpire,
            "Adaptive": true,
            "Reverse": false,
            "Remember": false
        }
    })


    const res = await createStrategiesMultipleMarginBE({
        dataInput,
        botID: botData._id,
        botName,
        symbol,
        scannerID,
        PositionSide
    })

    const newData = res.data

    if (newData.length > 0) {
        console.log(changeColorConsole.cyanBright("\n", res.message));

        listConfigIDByScanner[scannerID] = listConfigIDByScanner[scannerID] || {}

        listConfigIDByScanner[scannerID][symbol] = newData

        await handleSocketAddNew(newData)
    }

}

const handleCancelOrderTP = async ({
    strategyID,
    symbol,
    side,
    candle = "",
    orderId,
    ApiKey,
    SecretKey,
    gongLai = false,
    botName,
    botID
}) => {

    const botSymbolMissID = `${botID}-${symbol}`
    const clientConfig = getRestClientV5Config({ ApiKey, SecretKey })

    const client = new RestClientV5(clientConfig);
    orderId && await client
        .cancelOrder({
            category: 'spot',
            symbol,
            orderId,
        })
        .then((response) => {
            if (response.retCode == 0) {
                console.log(`[V] Cancel TP ( ${botName} - ${side} - ${symbol} - ${candle} ) successful `);

                if (gongLai && !missTPDataBySymbol[botSymbolMissID].gongLai) {
                    missTPDataBySymbol[botSymbolMissID].gongLai = true
                    missTPDataBySymbol[botSymbolMissID]?.orderIDToDB && updatePositionBE({
                        newDataUpdate: {
                            Miss: true,
                            TimeUpdated: new Date()
                        },
                        orderID: missTPDataBySymbol[botSymbolMissID].orderIDToDB
                    }).then(message => {
                        console.log(message);
                    }).catch(err => {
                        console.log(err)
                    })
                    // resetMissData({
                    //     botID,
                    //     symbol
                    // })
                }
            }
            else {
                console.log(changeColorConsole.yellowBright(`[!] Cancel TP ( ${botName} - ${side} - ${symbol} - ${candle} ) failed `, response.retMsg))
            }
            cancelAll({ strategyID, botID })
            // allStrategiesByBotIDOrderOC[botID][symbol].totalOC -= 1

        })
        .catch((error) => {
            console.log(`[!] Cancel TP ( ${botName} - ${side} - ${symbol} - ${candle} ) error `, error)
            cancelAll({ strategyID, botID })
        });

}

async function handleCancelAllOrderTP({
    items,
    batchSize = 10
}) {
    if (items.length > 0) {
        console.log(`[...] Canceling TP`);

        let index = 0;
        while (index < items.length) {
            const batch = items.slice(index, index + batchSize);
            await Promise.allSettled(batch.map(item => handleCancelOrderTP({
                strategyID: item.strategyID,
                symbol: item.symbol,
                candle: item.candle,
                side: item.side,
                ApiKey: item.ApiKey,
                SecretKey: item.SecretKey,
                botName: item.botName,
                botID: item.botID,
                orderId: item.orderId,
                gongLai: item.gongLai,
            })));
            await delay(1200)
            index += batchSize

        }
    }
}

const resetMissData = ({
    botID,
    symbol
}) => {
    const id = `${botID}-${symbol}`
    missTPDataBySymbol[id] = {
        size: 0,
        side: "",
        Candlestick: "",
        timeOutFunc: "",
        sizeTotal: 0,
        orderIDToDB: "",
        orderID: "",
        gongLai: false,
        orderIDOfListTP: [],
        priceOrderTP: 0,
        prePrice: 0,
        ApiKey: "",
        SecretKey: "",
        botName: "",
        botID: "",
    }

}

const cancelAll = (
    {
        strategyID,
        botID
    }
) => {
    if (botID && strategyID) {
        const data = allStrategiesByBotIDAndStrategiesID[botID]?.[strategyID]
        if (data) {
            const OCOrderID = data?.OC?.orderLinkId
            const TPOrderID = data?.TP?.orderLinkId
            OCOrderID && delete allStrategiesByBotIDAndOrderID[botID]?.[OCOrderID]
            TPOrderID && delete allStrategiesByBotIDAndOrderID[botID]?.[TPOrderID]
        }
        !allStrategiesByBotIDAndOrderID[botID] && (allStrategiesByBotIDAndOrderID[botID] = {});
        !allStrategiesByBotIDAndStrategiesID[botID] && (allStrategiesByBotIDAndStrategiesID[botID] = {});

        allStrategiesByBotIDAndStrategiesID[botID][strategyID] = {
            "OC": {
                orderID: "",
                orderLinkId: "",
                orderFilled: false,
                openTrade: "",
                dataSend: {},
                priceOrder: 0,
                orderFilledButMiss: false,
                moveAfterCompare: false,
                newOC: 0,
                priceOrderTPTemp: 0,
                ordering: false
            },
            "TP": {
                orderID: "",
                orderLinkId: "",
                orderFilled: false,
                price: 0,
                qty: 0,
                side: "",
                priceCompare: 0,
                minMaxTempPrice: 0,
                coinClose: 0,
                moveAfterCompare: false,
                moveSuccess: false,
                orderFilledButMiss: false,
            },
        }
    }

}

// 
const sendMessageWithRetry = async ({
    messageText,
    retries = 5,
    telegramID,
    telegramToken,
}) => {

    let BOT_TOKEN_RUN_TRADE = botListTelegram[telegramToken]

    try {
        if (!BOT_TOKEN_RUN_TRADE) {
            const newBotInit = new TelegramBot(telegramToken, {
                polling: false,
                request: {
                    agentOptions: {
                        family: 4
                    }
                }
            })
            BOT_TOKEN_RUN_TRADE = newBotInit
            botListTelegram[telegramToken] = newBotInit
            // BOT_TOKEN_RUN_TRADE.launch();
        }
        for (let i = 0; i < retries; i++) {
            try {
                if (messageText) {
                    // await BOT_TOKEN_RUN_TRADE.telegram.sendMessage(telegramID, messageText);
                    await BOT_TOKEN_RUN_TRADE.sendMessage(telegramID, messageText, {
                        parse_mode: "HTML"
                    });
                    console.log('[->] Message sent to telegram successfully');
                    return;
                }
            } catch (error) {
                if (error.code === 429) {
                    const retryAfter = error.parameters.retry_after;
                    console.log(changeColorConsole.yellowBright(`[!] Rate limited. Retrying after ${retryAfter} seconds...`));
                    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                } else {
                    throw new Error(error);
                }
            }
        }

        throw new Error('[!] Failed to send message after multiple retries');
    } catch (error) {
        console.log("[!] Bot Telegram Error", error)
    }
};

// const getMoneyFuture = async (botApiListInput) => {

//     const list = Object.values(botApiListInput)
//     if (list.length > 0) {
//         const resultGetFuture = await Promise.allSettled(list.map(async botData => getFutureBE(botData.id)))

//         if (resultGetFuture.length > 0) {
//             resultGetFuture.forEach(({ value: data }) => {
//                 if (data?.botID) {
//                     botAmountListObject[data.botID] = +data?.totalWalletBalance || 0
//                 }
//             })
//         }
//     }
// }

const sendAllBotTelegram = async (text) => {

    await Promise.allSettled(Object.values(botApiList).map(botApiData => {
        const telegramID = botApiData.telegramID
        const telegramToken = botApiData.telegramToken
        return sendMessageWithRetry({
            messageText: text,
            telegramID,
            telegramToken
        })
    }))
}

const handleSocketBotApiList = async (botApiListInput = {}) => {

    try {
        const objectToArray = Object.values(botApiListInput);
        const objectToArrayLength = objectToArray.length;
        console.log(changeColorConsole.greenBright("[New-Bot-API] Length:", objectToArrayLength));

        if (objectToArrayLength > 0) {

            // await getMoneyFuture(botApiListInput)

            await Promise.allSettled(objectToArray.map(botApiData => {

                const ApiKey = botApiData.ApiKey
                const SecretKey = botApiData.SecretKey
                const botID = botApiData.id
                const botName = botApiList[botID].botName


                // allSymbol.forEach(symbol => {
                //     resetMissData({
                //         botID,
                //         symbol: symbol.value
                //     })
                // })


                const wsConfigOrder = getWebsocketClientConfig({ ApiKey, SecretKey })

                const wsOrder = new WebsocketClient(wsConfigOrder);


                wsOrder.subscribeV5(LIST_ORDER, 'spot').then(() => {


                    console.log(`[V] Subscribe order ( ${botName} ) successful\n`);

                    wsOrder.on('update', async (dataCoin) => {

                        const botID = botApiData.id

                        const ApiKey = botApiList[botID].ApiKey
                        const SecretKey = botApiList[botID].SecretKey
                        const botName = botApiList[botID].botName

                        const telegramID = botApiList[botID].telegramID
                        const telegramToken = botApiList[botID].telegramToken

                        const topicMain = dataCoin.topic
                        const dataMainAll = dataCoin.data

                        // const dataMain = dataMainAll[0]
                        ApiKey && SecretKey && await Promise.allSettled(dataMainAll.map(async dataMain => {

                            if (dataMain.category == "spot") {

                                const symbol = dataMain.symbol
                                const orderID = dataMain.orderLinkId
                                const orderStatus = dataMain.orderStatus
                                const qty = +dataMain.cumExecQty


                                const botSymbolMissID = `${botID}-${symbol}`

                                if (orderStatus === "Filled") {
                                    console.log(changeColorConsole.greenBright(`[V] Filled OrderID ( ${botName} - ${dataMain.side} - ${symbol} ): ${orderID} - ${qty}`,));

                                    if (!orderID) {

                                        const listObject = listOCByCandleBot?.[botID]?.listOC
                                        listObject && Object.values(listObject).map(strategyData => {
                                            const strategyID = strategyData.strategyID
                                            const symbolItem = strategyData.symbol
                                            if (symbol == symbolItem && !allStrategiesByBotIDAndStrategiesID?.[botID]?.[strategyID]?.TP?.orderID) {
                                                {
                                                    console.log(`[V] RESET | ${symbol.replace("USDT", "")} - ${strategyData.side} - Bot: ${strategyData.botName}`);
                                                    cancelAll({ botID, strategyID })
                                                    delete listOCByCandleBot[botID].listOC[strategyID]
                                                }
                                            }
                                        })

                                    }
                                }
                                if (orderStatus === "PartiallyFilled") {
                                    console.log(changeColorConsole.blueBright(`[V] PartiallyFilled OrderID( ${botName} - ${dataMain.side} - ${symbol}):`, qty));
                                }

                                if (topicMain === "order") {

                                    const strategyData = allStrategiesByBotIDAndOrderID[botID]?.[orderID]

                                    const strategy = strategyData?.strategy

                                    const OCTrue = strategyData?.OC
                                    const TPTrue = strategyData?.TP


                                    if (strategy) {

                                        const strategyID = strategy.value

                                        const TPMain = strategy.Adaptive ? TP_ADAPTIVE : TP_NOT_ADAPTIVE

                                        let timeOut = 5000

                                        if (orderStatus === "Filled" || orderStatus === "PartiallyFilled") {
                                            strategyData?.timeOutFunc && clearTimeout(strategyData?.timeOutFunc)

                                            if (orderStatus === "Filled") {
                                                timeOut = 0
                                            }

                                            allStrategiesByBotIDAndOrderID[botID][orderID].timeOutFunc = setTimeout(async () => {


                                                if (OCTrue) {

                                                    allStrategiesByBotIDAndStrategiesID[botID][strategyID].OC.orderFilled = true

                                                    const openTrade = +dataMain.avgPrice  //Gia khop lenh

                                                    allStrategiesByBotIDAndStrategiesID[botID][strategyID].OC.openTrade = openTrade

                                                    // const newOC = (Math.abs((openTrade - coinOpenOC)) / coinOpenOC * 100).toFixed(2)

                                                    // allStrategiesByBotIDAndStrategiesID[botID][strategyID].OC.newOC = newOC

                                                    const priceOldOrder = (strategy.Amount / 100).toFixed(2)

                                                    console.log(`\n\n[V] ${orderStatus} OC: \n${symbol.replace("USDT", "")} | Open ${strategy.PositionSide} \nBot: ${botName} | OC: ${strategy.OrderChange}% | TP: ${TPMain}% \nPrice: ${openTrade} | Amount: ${priceOldOrder}\n`);
                                                    const teleText = `<b>${symbol.replace("USDT", "")}</b> | Open ${strategy.PositionSide} \nBot: ${botName} | OC: ${strategy.OrderChange}% | TP: ${TPMain}% \nPrice: ${openTrade} | Amount: ${priceOldOrder}`
                                                    // const teleText = `<b>${symbol.replace("USDT", "")}</b> | Open ${sideText} \nBot: ${botName} | OC: ${strategy.OrderChange}% | TP: ${TPMain}% \nPrice: ${openTrade} | Amount: ${priceOldOrder}`

                                                    if (!missTPDataBySymbol[botSymbolMissID]?.orderIDToDB) {

                                                        const Quantity = dataMain.side === "Buy" ? qty : (qty * -1)

                                                        const newDataToDB = {
                                                            Symbol: symbol,
                                                            Side: dataMain.side,
                                                            Quantity,
                                                            TradeType: symbolTradeTypeObject[symbol]
                                                        }

                                                        console.log(`\n[Saving->Mongo] Position When ${orderStatus} OC ( ${botName} - ${dataMain.side} - ${symbol} )`);

                                                        await createPositionBE({
                                                            ...newDataToDB,
                                                            botID,
                                                        }).then(async data => {
                                                            console.log(data.message);
                                                            !missTPDataBySymbol[botSymbolMissID] && resetMissData({ botID, symbol })

                                                            const newID = data.id
                                                            if (newID) {
                                                                missTPDataBySymbol[botSymbolMissID].orderIDToDB = newID
                                                            }
                                                            else {
                                                                await getPositionBySymbol({ symbol, botID }).then(data => {
                                                                    console.log(data.message);
                                                                    missTPDataBySymbol[botSymbolMissID].orderIDToDB = data.id
                                                                }).catch(error => {
                                                                    console.log("ERROR getPositionBySymbol:", error)

                                                                })
                                                            }

                                                        }).catch(err => {
                                                            console.log("ERROR createPositionBE:", err)
                                                        })
                                                    }

                                                    // Create TP


                                                    const TPNew = allStrategiesByBotIDAndStrategiesID[botID][strategyID].OC.priceOrderTPTemp

                                                    allStrategiesByBotIDAndStrategiesID[botID][strategyID].TP.side = strategy.PositionSide === "Long" ? "Sell" : "Buy"

                                                    allStrategiesByBotIDAndStrategiesID[botID][strategyID].TP.price = TPNew


                                                    allStrategiesByBotIDAndStrategiesID[botID][strategyID].TP.qty = qty

                                                    // const basePrecision = digitAllCoinObject[symbol]?.basePrecision

                                                    const dataInput = {
                                                        strategy,
                                                        strategyID,
                                                        symbol,
                                                        qty: roundQty({
                                                            price: qty - qty * 0.15 / 100,
                                                            // price: qty,
                                                            tickSize: digitAllCoinObject[symbol]?.basePrecision
                                                        }),
                                                        price: roundPrice({
                                                            price: TPNew,
                                                            tickSize: digitAllCoinObject[symbol]?.priceScale
                                                        }),
                                                        side: strategy.PositionSide === "Long" ? "Sell" : "Buy",
                                                        ApiKey,
                                                        SecretKey,
                                                        botName,
                                                        botID
                                                    }


                                                    handleSubmitOrderTP(dataInput)

                                                    sendMessageWithRetry({
                                                        messageText: teleText,
                                                        telegramID,
                                                        telegramToken,
                                                    })
                                                }
                                                // Khớp TP
                                                else if (TPTrue) {

                                                    allStrategiesByBotIDAndStrategiesID[botID][strategyID].TP.orderFilled = true

                                                    const closePrice = +dataMain.avgPrice

                                                    const side = strategy.PositionSide === "Long" ? "Buy" : "Sell"

                                                    const openTradeOCFilled = allStrategiesByBotIDAndStrategiesID[botID]?.[strategyID]?.OC.openTrade

                                                    const qty = +dataMain.qty
                                                    const priceOldOrder = (strategy.Amount / 100).toFixed(2)

                                                    // const newOC = allStrategiesByBotIDAndStrategiesID[botID][strategyID].OC.newOC

                                                    console.log(`\n\n[V] ${orderStatus} TP: \n${symbol.replace("USDT", "")} | Close ${strategy.PositionSide} \nBot: ${botName} | OC: ${strategy.OrderChange}% | TP: ${TPMain}% \nPrice: ${closePrice} | Amount: ${priceOldOrder}\n`);
                                                    // const teleText = `<b>${symbol.replace("USDT", "")}</b> | Close ${side} \nBot: ${botName} | OC: ${strategy.OrderChange}% | TP: ${TPMain}% \nPrice: ${closePrice} | Amount: ${priceOldOrder}`

                                                    const priceWinPercent = (Math.abs(closePrice - openTradeOCFilled) / openTradeOCFilled * 100).toFixed(2) || 0;
                                                    const priceWin = ((closePrice - openTradeOCFilled) * qty).toFixed(2) || 0;

                                                    let textWinLose = ""
                                                    let textWinLoseShort = ""

                                                    if (side === "Buy") {
                                                        if (priceWin > 0) {
                                                            textWinLose = `\n✅ [WIN - LONG]: ${priceWin} | ${priceWinPercent}%\n`
                                                            textWinLoseShort = "✅"
                                                            console.log(changeColorConsole.greenBright(textWinLose));
                                                            allStrategiesByCandleAndSymbol[symbol][strategyID].preIsWin = true
                                                        }
                                                        else {
                                                            textWinLose = `\n❌ [LOSE - LONG]: ${priceWin} | ${priceWinPercent}%\n`
                                                            textWinLoseShort = "❌"
                                                            console.log(changeColorConsole.magentaBright(textWinLose));
                                                            allStrategiesByCandleAndSymbol[symbol][strategyID].preIsLose = true
                                                        }
                                                    }
                                                    else {
                                                        if (priceWin > 0) {
                                                            textWinLose = `\n❌ [LOSE - SHORT]: ${-1 * priceWin} | ${priceWinPercent}%\n`
                                                            textWinLoseShort = "❌"
                                                            console.log(changeColorConsole.magentaBright(textWinLose));
                                                            allStrategiesByCandleAndSymbol[symbol][strategyID].preIsLose = true
                                                        }
                                                        else {
                                                            textWinLose = `\n✅ [WIN - SHORT]: ${Math.abs(priceWin)} | ${priceWinPercent}%\n`
                                                            textWinLoseShort = "✅"
                                                            console.log(changeColorConsole.greenBright(textWinLose));
                                                            allStrategiesByCandleAndSymbol[symbol][strategyID].preIsWin = true
                                                        }
                                                    }

                                                    const teleText = `<b>${textWinLoseShort}  ${symbol.replace("USDT", "")}</b> | Close ${strategy.PositionSide} \nBot: ${botName} | OC: ${strategy.OrderChange}% | TP: ${TPMain}% \nPrice: ${closePrice} | Amount: ${priceOldOrder}`

                                                    missTPDataBySymbol[botSymbolMissID].size -= Math.abs(qty)

                                                    missTPDataBySymbol[botSymbolMissID]?.timeOutFunc && clearTimeout(missTPDataBySymbol[botSymbolMissID].timeOutFunc)

                                                    // Fill toàn bộ
                                                    if (missTPDataBySymbol[botSymbolMissID]?.sizeTotal == qty || missTPDataBySymbol[botSymbolMissID]?.size == 0) {
                                                        console.log(`\n[_FULL Filled_] TP ( ${botName} - ${side} - ${symbol})\n`);

                                                        if (missTPDataBySymbol[botSymbolMissID]?.orderIDToDB) {
                                                            deletePositionBE({
                                                                orderID: missTPDataBySymbol[botSymbolMissID].orderIDToDB
                                                            }).then(message => {
                                                                console.log(`[...] Delete Position ( ${botName} - ${side} - ${symbol})`);
                                                                console.log(message);
                                                            }).catch(err => {
                                                                console.log("ERROR deletePositionBE:", err)
                                                            })
                                                        }

                                                        console.log(`[...] Reset All ( ${botName} - ${side} - ${symbol})`);

                                                        resetMissData({
                                                            botID,
                                                            symbol,
                                                        })

                                                        cancelAll({ strategyID, botID })

                                                        delete listOCByCandleBot[botID].listOC[strategyID]
                                                    }
                                                    else {
                                                        console.log(`\n[_Part Filled_] TP ( ${botName} - ${side} - ${symbol})\n`);
                                                    }


                                                    sendMessageWithRetry({
                                                        messageText: `${teleText} \n${textWinLose}`,
                                                        telegramID,
                                                        telegramToken,
                                                    })


                                                }

                                                if (timeOut !== 0) {
                                                    console.log("[...] Canceling remain quantity");
                                                    handleCancelOrderOC({
                                                        strategyID,
                                                        strategy,
                                                        symbol,
                                                        side: strategy.PositionSide === "Long" ? "Buy" : "Sell",
                                                        ApiKey,
                                                        SecretKey,
                                                        botName,
                                                        botID,
                                                        OrderChange: strategy.OrderChange,
                                                        orderId: dataMain.orderId
                                                    })
                                                }
                                            }, timeOut)

                                        }

                                        else if (orderStatus === "Cancelled") {
                                            // console.log("[X] Cancelled");
                                            // Khớp TP
                                            if (TPTrue) {
                                                console.log(`[-] Cancelled TP ( ${botName} - ${strategy.PositionSide === "Long" ? "Sell" : "Buy"} - ${symbol}  ) - Chốt lời `);

                                                // allStrategiesByBotIDOrderOC[botID][symbol].totalOC -= 1

                                                if (allStrategiesByBotIDAndStrategiesID[botID][strategyID].TP.orderID) {
                                                    allStrategiesByBotIDAndStrategiesID[botID][strategyID].TP.orderID = ""
                                                }

                                                const qty = +dataMain.qty
                                                missTPDataBySymbol[botSymbolMissID].size -= Math.abs(qty)

                                                if (missTPDataBySymbol[botSymbolMissID]?.sizeTotal - missTPDataBySymbol[botSymbolMissID].size > 0) {
                                                    missTPDataBySymbol[botSymbolMissID].gongLai = true
                                                    updatePositionBE({
                                                        newDataUpdate: {
                                                            Miss: true,
                                                            TimeUpdated: new Date()
                                                        },
                                                        orderID: missTPDataBySymbol[botSymbolMissID].orderIDToDB
                                                    }).then(message => {
                                                        console.log(message);
                                                    }).catch(err => {
                                                        console.log("ERROR updatePositionBE:", err)
                                                    })
                                                    // resetMissData({
                                                    //     botID,
                                                    //     symbol,
                                                    // })
                                                }

                                            }
                                            else if (OCTrue) {
                                                // allStrategiesByBotIDOrderOC[botID][symbol].totalOC -= 1

                                                console.log(`[-] Cancelled OC ( ${botName} - ${strategy.PositionSide === "Long" ? "Sell" : "Buy"} - ${symbol} ) `);
                                                cancelAll({ botID, strategyID })
                                                listOCByCandleBot?.[botID]?.list?.[strategyID] && delete listOCByCandleBot[botID].list[strategyID]
                                            }

                                        }
                                    }
                                }

                                else if (topicMain === "execution") {

                                    const size = Math.abs(dataMain.execQty)

                                    !missTPDataBySymbol[botSymbolMissID] && resetMissData({ botID, symbol })

                                    missTPDataBySymbol[botSymbolMissID].sizeTotal = size

                                    try {
                                        if (size > 0) {
                                            missTPDataBySymbol[botSymbolMissID]?.timeOutFunc && clearTimeout(missTPDataBySymbol[botSymbolMissID].timeOutFunc)
                                            missTPDataBySymbol[botSymbolMissID].timeOutFunc = setTimeout(async () => {

                                                const symbol = dataMain.symbol
                                                const side = dataMain.side
                                                const openTrade = +dataMain.execPrice  //Gia khop lenh

                                                const missSize = size - missTPDataBySymbol[botSymbolMissID]?.size || 0

                                                const Quantity = side === "Buy" ? size : (size * -1)

                                                if (!missTPDataBySymbol[botSymbolMissID]?.orderIDToDB) {

                                                    const newDataToDB = {
                                                        Symbol: symbol,
                                                        Side: side,
                                                        Quantity,
                                                        TradeType: symbolTradeTypeObject[symbol]
                                                    }

                                                    console.log(`\n[Saving->Mongo] Position When Check Miss ( ${botName} - ${side} - ${symbol} )`);

                                                    await createPositionBE({
                                                        ...newDataToDB,
                                                        botID,
                                                    }).then(async data => {
                                                        console.log(data.message);

                                                        const newID = data.id

                                                        !missTPDataBySymbol[botSymbolMissID] && resetMissData({ botID, symbol })

                                                        if (newID) {
                                                            missTPDataBySymbol[botSymbolMissID].orderIDToDB = newID
                                                        }
                                                        else {
                                                            await getPositionBySymbol({ symbol, botID }).then(data => {
                                                                console.log(data.message);
                                                                missTPDataBySymbol[botSymbolMissID].orderIDToDB = data.id
                                                            }).catch(error => {
                                                                console.log("ERROR getPositionBySymbol:", error)
                                                            })
                                                        }

                                                    }).catch(err => {
                                                        console.log("ERROR createPositionBE:", err)
                                                    })
                                                }

                                                if (!missTPDataBySymbol[botSymbolMissID]?.gongLai) {
                                                    if (missSize > 0) {

                                                        const teleText = `<b>⚠️ [ MISS ] | ${symbol.replace("USDT", "")}</b> - ${side} - Bot: ${botName}: QTY: ${missSize} \n`
                                                        console.log(changeColorConsole.redBright(`\n${teleText.slice(5)}\n`));

                                                        // const TPNew = missTPDataBySymbol[botSymbolMissID].priceOrderTP
                                                        let TPNew = openTrade

                                                        if (side === "Buy") {
                                                            TPNew = openTrade + (openTrade * 3 / 100) * (50 / 100)
                                                        }
                                                        else {
                                                            TPNew = openTrade - (openTrade * 3 / 100) * (50 / 100)
                                                        }

                                                        missTPDataBySymbol[botSymbolMissID].prePrice = TPNew
                                                        missTPDataBySymbol[botSymbolMissID].side = side


                                                        const dataInput = {
                                                            symbol,
                                                            qty: roundQty({
                                                                price: missSize - missSize * 0.15 / 100,
                                                                tickSize: digitAllCoinObject[symbol]?.basePrecision
                                                            }),
                                                            price: roundPrice({
                                                                price: TPNew,
                                                                tickSize: digitAllCoinObject[symbol]?.priceScale
                                                            }),
                                                            side,
                                                            ApiKey,
                                                            SecretKey,
                                                            botName,
                                                            botID,
                                                            missState: true,
                                                        }

                                                        console.log(changeColorConsole.magentaBright(`[...] Close TP Miss ( ${missSize} ) - QTY: ${dataInput.qty} `));

                                                        handleCloseMarket(dataInput)


                                                        // updatePositionBE({
                                                        //     newDataUpdate: {
                                                        //         Miss: true
                                                        //     },
                                                        //     orderID: missTPDataBySymbol[botSymbolMissID].orderIDToDB
                                                        // }).then(message => {
                                                        //     console.log(message);
                                                        // }).catch(err => {
                                                        //     console.log("ERROR updatePositionBE:", err)
                                                        // })

                                                        // sendMessageWithRetry({
                                                        //     messageText: teleText,
                                                        //     telegramID,
                                                        //     telegramToken
                                                        // })
                                                    }
                                                    else {
                                                        console.log(`[_ Not Miss _] TP ( ${botName} - ${side} - ${symbol}} )`);
                                                        // updatePositionBE({
                                                        //     newDataUpdate: {
                                                        //         Miss: false,
                                                        //         TimeUpdated: new Date()
                                                        //     },
                                                        //     orderID: missTPDataBySymbol[botSymbolMissID].orderIDToDB
                                                        // }).then(message => {
                                                        //     console.log(message);
                                                        // }).catch(err => {
                                                        //     console.log("ERROR updatePositionBE:", err)
                                                        // })
                                                    }
                                                }
                                                else {
                                                    const teleText = `<b>⚠️ [ MISS-GongLai ] | ${symbol.replace("USDT", "")}</b> - ${side} - Bot: ${botName}  \n`
                                                    console.log(changeColorConsole.redBright(`\n${teleText.slice(5)}\n`));
                                                    // updatePositionBE({
                                                    //     newDataUpdate: {
                                                    //         Miss: true,
                                                    //         TimeUpdated: new Date()
                                                    //     },
                                                    //     orderID: missTPDataBySymbol[botSymbolMissID].orderIDToDB
                                                    // }).then(message => {
                                                    //     console.log(message);
                                                    // }).catch(err => {
                                                    //     console.log("ERROR updatePositionBE:", err)
                                                    // })
                                                }

                                            }, 2000)
                                        }
                                        else {
                                            missTPDataBySymbol[botSymbolMissID]?.timeOutFunc && clearTimeout(missTPDataBySymbol[botSymbolMissID].timeOutFunc)
                                        }
                                    } catch (error) {
                                        console.log("error check miss", error);

                                    }
                                }


                                // User cancel vị thế ( Limit )
                                if (!orderID && (orderStatus === "New" || orderStatus === "Filled") && dataMain.orderType !== "Market") {

                                    console.log(`[...] User ( ${botName} ) Clicked Close Vị Thế (Limit) - ( ${symbol} )`)

                                    const botSymbolMissID = `${botID}-${symbol}`

                                    // const listMiss = missTPDataBySymbol[botSymbolMissID]?.orderIDOfListTP

                                    // listMiss?.length > 0 && await handleCancelAllOrderTP({
                                    //     items: listMiss.map((orderIdTPData) => ({
                                    //         ApiKey,
                                    //         SecretKey,
                                    //         strategyID: orderIdTPData?.strategyID,
                                    //         symbol,
                                    //         side: dataMain.side,
                                    //         orderId: orderIdTPData?.orderID,
                                    //         botID,
                                    //         botName
                                    //     }))
                                    // })

                                    missTPDataBySymbol[botSymbolMissID]?.timeOutFunc && clearTimeout(missTPDataBySymbol[botSymbolMissID].timeOutFunc)

                                    resetMissData({ botID, symbol })

                                    // missTPDataBySymbol[botSymbolMissID].orderIDOfListTP.push({
                                    //     orderID: dataMain.orderId,
                                    // })
                                    missTPDataBySymbol[botSymbolMissID].size = Math.abs(dataMain.qty)
                                }
                                // User cancel vị thế ( Market )
                                if (dataMain.orderType === "Market") {

                                    console.log(`[...] User ( ${botName} ) Clicked Close Vị Thế (Market) - ( ${symbol} - ${dataMain.side} )`)

                                    if (missTPDataBySymbol[botSymbolMissID]?.orderIDToDB) {
                                        await deletePositionBE({
                                            orderID: missTPDataBySymbol[botSymbolMissID].orderIDToDB
                                        }).then(message => {
                                            console.log(message);
                                        }).catch(err => {
                                            console.log("ERROR deletePositionBE:", err)
                                        })
                                    }

                                    resetMissData({ botID, symbol })


                                }

                            }
                        }))
                    })

                    wsOrder.on('close', () => {
                        console.log('Connection order closed');
                        wsOrder.connectPrivate(LIST_ORDER, "spot")
                    });

                    wsOrder.on('reconnected', () => {
                        console.log('Reconnected order successful')
                        connectErrorMain = false
                    });

                    wsOrder.on('error', (err) => {
                        if (!connectErrorMain) {
                            const text = "🚫 [ Cảnh báo ] Hệ thống đang bị gián đoạn kết nối"
                            console.log(text);
                            // sendAllBotTelegram(text)
                            console.log('Connection order error');
                            console.log(err);
                            connectErrorMain = true
                            wsOrder.connectAll()
                        }
                    });
                }).catch(err => {
                    console.log(`[V] Subscribe order ( ${botName} ) error:`, err)
                })



            }))
        }
    } catch (error) {
        console.log("[!] Error BotApi Socket:", e)
    }
}

const handleSocketListKline = async (listKlineInput) => {

    await wsSymbol.subscribeV5(listKlineInput, 'spot').then(() => {
        const length = listKlineInput.length

        console.log(`[V] Subscribe ${length} kline successful\n`);

    }).catch(err => {
        console.log(`[!] Subscribe ${length} kline error: ${err}`,)
    })

}


// ----------------------------------------------------------------------------------
async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const checkConditionBot = (botData) => {
    return botData.botID?.Status === "Running" && botData.botID?.ApiKey && botData.botID?.SecretKey
}

// ----------------------------------------------------------------------------------
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

const tinhOC = (symbol, dataAll = []) => {

    // console.log(dataAll, symbol, new Date().toLocaleString());

    if (dataAll.length > 0) {

        let OC = 0
        let TP = 0
        let OCLong = 0
        let TPLong = 0

        let dataOC = ""
        let timestamp = 0

        const vol = dataAll[dataAll.length - 1].turnoverD - preTurnover[symbol]

        dataAll.forEach((data, index) => {

            const Close = +data.close
            const Open = +data.open
            const Highest = +data.high
            const Lowest = +data.low


            if (!dataOC) {
                OC = (Highest - Open) / Open
                OCLong = (Lowest - Open) / Open
                TP = Math.abs((Highest - Close) / (Highest - Open)) || 0
                TPLong = Math.abs(Close - Lowest) / (Open - Lowest) || 0
                dataOC = {
                    close: Close,
                    open: Open,
                    high: Highest,
                    low: Lowest,
                }
                timestamp = data.timestamp
            }
            else {

                let TPTemp = 0
                let TPLongTemp = 0
                if (Lowest < dataOC.close) {
                    TPTemp = Math.abs((Lowest - dataOC.high) / (dataOC.high - dataOC.open)) || 0
                }
                if (Highest > dataOC.close) {
                    TPLongTemp = Math.abs((Highest - dataOC.low) / (dataOC.low - dataOC.open)) || 0
                }

                if (TPTemp > TP) {
                    TP = TPTemp
                }
                if (TPLongTemp > TPLong) {
                    TPLong = TPLongTemp
                }
            }
        })


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

        const timeOC = new Date(timestamp).toLocaleString()


        // if (symbol === "ZROUSDT") {

        //     const htLong = (`LONG:  <b>${symbol.replace("USDT", "")}</b> - OC: ${OCLongRound}% - TP: ${TPLongRound}% - VOL: ${formatNumberString(vol)} - ${timeOC}`)
        //     console.log(htLong);

        //     const ht = (` ${symbol.replace("USDT", "")} - OC: ${OCRound}% - TP: ${TPRound}% - VOL: ${formatNumberString(vol)} - ${timeOC}`)
        //     console.log(changeColorConsole.cyanBright(ht));
        //     console.log(dataAll);
        // }

        const listScannerObject = allScannerDataObject[symbol]

        listScannerObject && Object.values(listScannerObject)?.length > 0 && Promise.allSettled(Object.values(listScannerObject).map(async scannerData => {

            // if (scannerData.OrderConfig) {
            //     console.log("TRUE", symbol);
            // }
            const PositionSide = scannerData.PositionSide
            const OrderChange = Math.abs(scannerData.OrderChange)
            const Elastic = Math.abs(scannerData.Elastic)
            const Turnover = Math.abs(scannerData.Turnover)
            const Market = scannerData.Market
            const scannerID = scannerData._id
            const Expire = Math.abs(scannerData.Expire)
            const botData = scannerData.botID
            const botID = botData._id
            const botName = botApiList[botID]?.botName || botData.botName

            if (scannerData.IsActive && botApiList[botID]?.IsActive) {

                // Check expire 
                if (Expire && (new Date() - scannerData.ExpirePre) >= Expire * 60 * 1000) {

                    // Delete all config
                    const listConfigIDByScannerData = listConfigIDByScanner[scannerID]?.[symbol]
                    if (listConfigIDByScannerData?.length > 0) {
                        let deleteResSuccess = false
                        console.log(changeColorConsole.blueBright(`[V] Scanner Expire ( ${symbol} - ${PositionSide} - ${OrderChange} ) ( ${Expire} min )`));
                        if (Market === "Spot") {
                            deleteResSuccess = await deleteStrategiesMultipleSpotBE({
                                botName,
                                PositionSide,
                                scannerID,
                                symbol
                            })
                        }
                        else {
                            deleteResSuccess = await deleteStrategiesMultipleMarginBE({
                                botName,
                                PositionSide,
                                scannerID,
                                symbol
                            })
                        }

                        if (deleteResSuccess) {
                            delete listConfigIDByScanner[scannerID]?.[symbol]
                            await handleSocketDelete(listConfigIDByScannerData)
                        }
                    }

                    allScannerDataObject[symbol][scannerID].ExpirePre = new Date()

                }

                if (vol >= Turnover) {
                    const listConfigIDByScannerData = listConfigIDByScanner[scannerID]?.[symbol]

                    if (PositionSide === "Long") {

                        if (Math.abs(OCLongRound) >= OrderChange && TPLongRound >= Elastic) {
                            const htLong = (`[RADA-${Market}] | ${symbol.replace("USDT", "")} - OC: ${OCLongRound}% - TP: ${TPLongRound}% - VOL: ${formatNumberString(vol)} - ${timeOC}`)
                            console.log(changeColorConsole.cyanBright(htLong));
                            // console.log(dataAll);
                            if (!listConfigIDByScannerData?.length) {
                                Market == "Spot" ? handleCreateMultipleConfigSpot({
                                    scannerData,
                                    symbol,
                                    botName,
                                }) : handleCreateMultipleConfigMargin({
                                    scannerData,
                                    symbol,
                                    botName
                                });
                            }
                        }

                    }
                    else {
                        if (Math.abs(OCRound) >= OrderChange && TPRound >= Elastic) {
                            const ht = (`[RADA-${Market}] | ${symbol.replace("USDT", "")} - OC: ${OCRound}% - TP: ${TPRound}% - VOL: ${formatNumberString(vol)} - ${timeOC}`)
                            console.log(changeColorConsole.cyanBright(ht));
                            // console.log(dataAll);
                            if (!listConfigIDByScannerData?.length) {
                                handleCreateMultipleConfigMargin({
                                    scannerData,
                                    symbol,
                                    botName
                                })
                            }
                        }
                    }
                }
            }


        }))

    }
}
// ----------------------------------------------------------------------------------


const Main = async () => {


    const getAllSymbolSpot = getAllSymbolSpotBE()
    const getAllSymbolMargin = getAllSymbolMarginBE()
    const getAllConfigSpot = getAllStrategiesActiveSpotBE()
    const getAllConfigMargin = getAllStrategiesActiveMarginBE()
    const getAllConfigScanner = getAllStrategiesActiveScannerBE()
    const deleteAll = deleteAllScannerV1BE()


    const allRes = await Promise.allSettled([getAllSymbolSpot, getAllSymbolMargin, getAllConfigSpot, getAllConfigMargin, getAllConfigScanner, deleteAll])

    const allSymbolRes = [
        ...allRes[0].value || [],
        ...allRes[1].value || [],
    ]
    const getAllConfigRes = [
        ...allRes[2].value || [],
        ...allRes[3].value || [],
    ]

    const getAllConfigScannerRes = allRes[4].value || []

    allSymbol = [...new Set(allSymbolRes)]

    allSymbol.forEach(symbolData => {
        const symbol = symbolData.value
        trichMauOCListObject[symbol] = {
            preTime: 0
        }
        symbolTradeTypeObject[symbol] = symbolData.type
        repayCoinObject[symbol] = false

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

        listKline[symbol] = `kline.D.${symbol}`

        getAllConfigScannerRes.forEach(scannerData => {
            const scannerID = scannerData._id
            const setBlacklist = new Set(scannerData.Blacklist)
            const setOnlyPairs = new Set(scannerData.OnlyPairs)
            if (checkConditionBot(scannerData) && setOnlyPairs.has(symbol) && !setBlacklist.has(symbol)) {
                const botID = scannerData.botID._id
                const botName = scannerData.botID.botName

                botApiList[botID] = {
                    id: botID,
                    botName,
                    ApiKey: scannerData.botID.ApiKey,
                    SecretKey: scannerData.botID.SecretKey,
                    telegramID: scannerData.botID.telegramID,
                    telegramToken: scannerData.botID.telegramToken,
                    IsActive: true
                };

                allScannerDataObject[symbol] = allScannerDataObject[symbol] || {}
                const newScannerData = scannerData.toObject()
                newScannerData.ExpirePre = new Date()
                allScannerDataObject[symbol][scannerID] = newScannerData
            }
        })

    })


    getAllConfigRes.forEach(strategyItem => {
        if (checkConditionBot(strategyItem)) {

            const strategyID = strategyItem.value

            const botID = strategyItem.botID._id
            const botName = strategyItem.botID.botName
            const symbol = strategyItem.symbol

            botApiList[botID] = {
                id: botID,
                botName,
                ApiKey: strategyItem.botID.ApiKey,
                SecretKey: strategyItem.botID.SecretKey,
                telegramID: strategyItem.botID.telegramID,
                telegramToken: strategyItem.botID.telegramToken,
            }

            !allStrategiesByCandleAndSymbol[symbol] && (allStrategiesByCandleAndSymbol[symbol] = {});
            allStrategiesByCandleAndSymbol[symbol][strategyID] = strategyItem;

            cancelAll({ strategyID, botID })

        }
    })

    const resultDigitAll = await Digit()
    resultDigitAll?.length > 0 && (
        resultDigitAll.reduce((pre, cur) => {
            if (cur.symbol.includes("USDT")) {
                pre[cur.symbol] = {
                    priceScale: +cur.priceScale,
                    basePrecision: +cur.basePrecision,
                }
            }
            return pre
        }, digitAllCoinObject)
    );

    await handleSocketBotApiList(botApiList)

    await handleSocketListKline(Object.values(listKline))



}

try {
    Main()

    wsSymbol.on('update', (dataCoin) => {

        const [_, candle, symbol] = dataCoin.topic.split(".");

        const dataMain = dataCoin.data[0]

        const coinCurrent = +dataMain.close
        const coinOpen = +dataMain.open

        const listDataObject = allStrategiesByCandleAndSymbol?.[symbol]

        listDataObject && Object.values(listDataObject)?.length > 0 && !repayCoinObject[symbol] && Promise.allSettled(Object.values(listDataObject).map(async strategy => {
            if (checkConditionBot(strategy) && strategy.IsActive && !updatingAllMain) {

                // console.log("strategy.Amount", strategy.Amount);
                // console.log("strategy.OrderChange", strategy.OrderChange);

                const strategyID = strategy.value

                digitAllCoinObject[symbol]?.priceScale

                const botData = strategy.botID
                const botID = strategy.botID._id
                const botName = strategy.botID.botName

                const Expire = Math.abs(strategy.Expire)
                const AmountExpire = Math.abs(strategy.AmountExpire)
                const ApiKey = strategy.botID.ApiKey
                const SecretKey = strategy.botID.SecretKey
                const telegramID = strategy.botID.telegramID
                const telegramToken = strategy.botID.telegramToken
                const side = strategy.PositionSide === "Long" ? "Buy" : "Sell"


                // Gắn time limit config
                !strategy.ExpirePre && (strategy.ExpirePre = new Date());
                !strategy.AmountOld && (strategy.AmountOld = strategy.Amount);
                !strategy.AmountExpirePre && (strategy.AmountExpirePre = new Date());



                //Check expire Increase-Amount - OK
                if (AmountExpire && (new Date() - strategy.AmountExpirePre) >= AmountExpire * 60 * 1000) {
                    console.log(changeColorConsole.blueBright(`[V] Amount Expire ( ${symbol} ) ( ${strategy.AmountExpire} min )`));
                    strategy.Amount = strategy.AmountOld
                    strategy.AmountExpirePre = new Date()
                }

                //Check expire config - OK
                if (Expire && (new Date() - strategy.ExpirePre) >= Expire * 60 * 1000) {

                    console.log(changeColorConsole.blueBright(`[V] Config ( ${symbolTradeTypeObject[symbol]} - ${symbol} ) Expire ( ${strategy.Expire} min )`));

                    strategy.IsActive = false
                    const configID = strategy._id

                    let offSuccess = false
                    if (symbolTradeTypeObject[symbol] == "Spot") {
                        offSuccess = await offConfigSpotBE({
                            configID,
                            symbol,
                        })
                        offSuccess && await handleSocketUpdate([strategy])
                    }
                    else {
                        offSuccess = await offConfigMarginBE({
                            configID,
                            symbol,
                            PositionSide: strategy.PositionSide
                        });
                    }
                    offSuccess && await handleSocketUpdate([strategy])

                    strategy.ExpirePre = new Date()
                }


                let priceOrderOC = 0
                let priceOrderTPTemp = 0
                let qty = 0
                const TPMain = strategy.Adaptive ? TP_ADAPTIVE : TP_NOT_ADAPTIVE

                if (side === "Buy") {
                    priceOrderOC = coinCurrent - coinCurrent * strategy.OrderChange / 100
                    priceOrderTPTemp = coinCurrent - coinCurrent * (strategy.OrderChange / 100) * (TPMain / 100)
                }
                else {
                    priceOrderOC = coinCurrent + coinCurrent * strategy.OrderChange / 100
                    priceOrderTPTemp = coinCurrent + coinCurrent * (strategy.OrderChange / 100) * (TPMain / 100)
                }

                qty = (strategy.Amount / +priceOrderOC)

                const dataInput = {
                    strategy,
                    strategyID,
                    ApiKey,
                    SecretKey,
                    symbol,
                    qty: roundQty({
                        price: qty,
                        tickSize: digitAllCoinObject[symbol]?.basePrecision
                    }),
                    side,
                    price: roundPrice({
                        price: priceOrderOC,
                        tickSize: digitAllCoinObject[symbol]?.priceScale
                    }),
                    priceOrderTPTemp: roundPrice({
                        price: priceOrderTPTemp,
                        tickSize: digitAllCoinObject[symbol]?.priceScale
                    }),
                    botName,
                    botID,
                    botData,
                    telegramID,
                    telegramToken,
                    coinOpen,
                    isLeverage: symbolTradeTypeObject[symbol] === "Spot" ? 0 : 1
                }


                if (allStrategiesByBotIDAndStrategiesID?.[botID]?.[strategyID]?.OC?.orderID &&
                    !allStrategiesByBotIDAndStrategiesID?.[botID]?.[strategyID]?.OC?.orderFilled
                ) {

                    if (strategy.IsActive && new Date() - trichMauOCListObject[symbol].preTime >= 1000) {
                        handleMoveOrderOC({
                            ...dataInput,
                            orderId: allStrategiesByBotIDAndStrategiesID?.[botID]?.[strategyID]?.OC?.orderID
                        })
                    }

                }
                else if (strategy.IsActive && allStrategiesByBotIDAndStrategiesID?.[botID]?.[strategyID]?.TP?.orderID &&
                    strategy.Adaptive &&
                    new Date() - trichMauOCListObject[symbol].preTime >= 1000) {
                    handleMoveOrderTP({
                        ...dataInput,
                        orderId: allStrategiesByBotIDAndStrategiesID?.[botID]?.[strategyID]?.TP?.orderID
                    })
                }
                else if (!allStrategiesByBotIDAndStrategiesID?.[botID]?.[strategyID]?.OC?.orderID && !allStrategiesByBotIDAndStrategiesID?.[botID]?.[strategyID]?.OC?.ordering) {

                    if (strategy.preIsWin) {
                        const newAmount = strategy.Amount + strategy.Amount * strategy.AmountAutoPercent / 100
                        newAmount <= strategy.Limit && (strategy.Amount = newAmount);
                    }
                    else if (strategy.preIsLose) {
                        strategy.OrderChange = strategy.OrderChange + strategy.OrderChange * strategy.AmountIncreaseOC / 100
                    }

                    let priceOrderOCNew = 0
                    if (side === "Buy") {
                        priceOrderOCNew = coinCurrent - coinCurrent * strategy.OrderChange / 100
                        priceOrderTPTemp = coinCurrent - coinCurrent * (strategy.OrderChange / 100) * (TPMain / 100)
                    }
                    else {
                        priceOrderOCNew = coinCurrent + coinCurrent * strategy.OrderChange / 100
                        priceOrderTPTemp = coinCurrent + coinCurrent * (strategy.OrderChange / 100) * (TPMain / 100)
                    }


                    const qtyNew = (strategy.Amount / +priceOrderOCNew)

                    dataInput.price = roundPrice({
                        price: priceOrderOCNew,
                        tickSize: digitAllCoinObject[symbol]?.priceScale
                    })

                    dataInput.priceOrderTPTemp = roundPrice({
                        price: priceOrderTPTemp,
                        tickSize: digitAllCoinObject[symbol]?.priceScale
                    })

                    dataInput.qty = roundQty({
                        price: qtyNew,
                        tickSize: digitAllCoinObject[symbol]?.basePrecision
                    })


                    if (dataInput.qty > 0) {
                        strategy.IsActive && handleSubmitOrder(dataInput)
                    }
                    else {
                        console.log(changeColorConsole.yellowBright(`\n[!] Ordered OC ( ${botName} - ${side} - ${symbol} ) failed: ( QTY : ${dataInput.qty} ) `))
                    }
                }

            }
        }))

        trichMauOCListObject[symbol].preTime = new Date()

        //----------------------------------------------------------------
        // SCANNER
        const turnover = +dataMain.turnover

        listKlineObject[symbol] = symbol

        if (!trichMauData[symbol].open) {
            trichMauData[symbol] = {
                open: coinCurrent,
                close: coinCurrent,
                high: coinCurrent,
                low: coinCurrent,
                turnover,
                turnoverD: turnover
            }
            preTurnover[symbol] = turnover
            trichMauDataArray[symbol].push(trichMauData[symbol])
        }

        if (coinCurrent > trichMauData[symbol].high) {
            trichMauData[symbol].high = coinCurrent

        }
        if (coinCurrent < trichMauData[symbol].low) {
            trichMauData[symbol].low = coinCurrent
        }


        // trichMauData[symbol].turnover = turnover - trichMauData[symbol].turnover
        trichMauData[symbol].turnoverD = turnover
        trichMauData[symbol].close = coinCurrent
        trichMauData[symbol].timestamp = dataMain.timestamp


        if (new Date() - trichMau[symbol].pre >= 1000) {
            trichMauDataArray[symbol].push(trichMauData[symbol])
            trichMau[symbol].pre = new Date()
        }

        trichMauData[symbol] = {
            open: coinCurrent,
            close: coinCurrent,
            high: coinCurrent,
            low: coinCurrent,
            turnover
        }



    })

    wsSymbol.on('close', () => {
        console.log('[V] Connection listKline closed');
        wsSymbol.unsubscribeV5(listKline, "spot")
    });

    wsSymbol.on('reconnected', () => {
        console.log('[V] Reconnected listKline successful')
        connectErrorMain = false

    });

    wsSymbol.on('error', (err) => {
        if (!connectErrorMain) {
            const text = "🚫 [ Cảnh báo ] Hệ thống đang bị gián đoạn kết nối"
            console.log(text);
            // sendAllBotTelegram(text)
            console.log('[!] Connection listKline error');
            console.log(err);
            connectErrorMain = true
            wsSymbol.connectAll()
        }
    });

    setInterval(() => {
        Object.values(listKlineObject).forEach(symbol => {
            tinhOC(symbol, trichMauDataArray[symbol])
            const coinCurrent = trichMauData[symbol].close
            const turnover = trichMauData[symbol].turnover

            trichMauData[symbol] = {
                open: coinCurrent,
                close: coinCurrent,
                high: coinCurrent,
                low: coinCurrent,
                turnover,
                turnoverD: turnover
            }
            preTurnover[symbol] = trichMauData[symbol].turnover
            trichMauDataArray[symbol] = []
        })
        listKlineObject = {}
    }, 5000)


    // handleCreateMultipleConfigSpot({
    //     scannerData: getAllConfigScannerRes[0],
    //     symbol: "CRDSUSDT",
    // })


    // handleCreateMultipleConfigMargin({
    //     scannerData: getAllConfigScannerRes[1],
    //     symbol: "AAVEUSDT",
    // })
}

catch (e) {
    console.log("Error Main:", e)
}


// ----------------------------------------------------------------

const handleSocketAddNew = async (newData = []) => {
    console.log("[...] Add New Strategies From Realtime", newData.length);

    const newBotApiList = {}

    await Promise.allSettled(newData.map(async newStrategiesData => {

        if (checkConditionBot(newStrategiesData)) {

            delete newStrategiesData.TimeTemp

            const symbol = newStrategiesData.symbol

            const strategyID = newStrategiesData.value

            const botID = newStrategiesData.botID._id
            const botName = newStrategiesData.botID.botName

            const ApiKey = newStrategiesData.botID.ApiKey
            const SecretKey = newStrategiesData.botID.SecretKey


            if (!botApiList[botID]) {
                botApiList[botID] = {
                    id: botID,
                    botName,
                    ApiKey,
                    SecretKey,
                    telegramID: newStrategiesData.botID.telegramID,
                    telegramToken: newStrategiesData.botID.telegramToken,
                }
                newBotApiList[botID] = {
                    id: botID,
                    botName,
                    ApiKey,
                    SecretKey,
                    telegramID: newStrategiesData.botID.telegramID,
                    telegramToken: newStrategiesData.botID.telegramToken,
                }

                // !allStrategiesByBotIDOrderOC[botID] && (allStrategiesByBotIDOrderOC[botID] = {})
                // !allStrategiesByBotIDOrderOC[botID][symbol] && (
                //     allStrategiesByBotIDOrderOC[botID][symbol] = {
                //         totalOC: 0,
                //         logError: false
                //     }
                // )
            }



            !allStrategiesByCandleAndSymbol[symbol] && (allStrategiesByCandleAndSymbol[symbol] = {});
            allStrategiesByCandleAndSymbol[symbol][strategyID] = newStrategiesData;

            cancelAll({ strategyID, botID })

        }

    }))

    await handleSocketBotApiList(newBotApiList)

}
const handleSocketUpdate = async (newData = []) => {
    console.log("[...] Update Strategies From Realtime", newData.length);


    const newBotApiList = {}

    const listOrderOC = {}
    const listOrderTP = []

    await Promise.allSettled(newData.map((strategiesData) => {

        if (checkConditionBot(strategiesData)) {

            const ApiKey = strategiesData.botID.ApiKey
            const SecretKey = strategiesData.botID.SecretKey
            const botID = strategiesData.botID._id
            const botName = strategiesData.botID.botName

            const symbol = strategiesData.symbol
            const strategyID = strategiesData.value
            const IsActive = strategiesData.IsActive


            const side = strategiesData.PositionSide === "Long" ? "Buy" : "Sell"

            !allStrategiesByCandleAndSymbol[symbol] && (allStrategiesByCandleAndSymbol[symbol] = {});
            allStrategiesByCandleAndSymbol[symbol][strategyID] = strategiesData

            !allStrategiesByBotIDAndOrderID[botID] && (allStrategiesByBotIDAndOrderID[botID] = {});
            !allStrategiesByBotIDAndStrategiesID[botID]?.[strategyID] && cancelAll({ botID, strategyID });


            if (IsActive) {
                if (!botApiList[botID]) {
                    botApiList[botID] = {
                        id: botID,
                        botName,
                        ApiKey,
                        SecretKey,
                        telegramID: strategiesData.botID.telegramID,
                        telegramToken: strategiesData.botID.telegramToken,
                    }

                    newBotApiList[botID] = {
                        id: botID,
                        botName,
                        ApiKey,
                        SecretKey,
                        telegramID: strategiesData.botID.telegramID,
                        telegramToken: strategiesData.botID.telegramToken,
                    }

                    // !allStrategiesByBotIDOrderOC[botID] && (allStrategiesByBotIDOrderOC[botID] = {})
                    // !allStrategiesByBotIDOrderOC[botID][symbol] && (
                    //     allStrategiesByBotIDOrderOC[botID][symbol] = {
                    //         totalOC: 0,
                    //         logError: false
                    //     }
                    // )
                }
            }


            const cancelDataObject = {
                ApiKey,
                SecretKey,
                strategyID,
                symbol: symbol,
                candle: strategiesData.Candlestick,
                side,
                botName,
                botID
            }


            if (!strategiesData.IsActive) {

                allStrategiesByBotIDAndStrategiesID[botID]?.[strategyID]?.TP?.orderID && listOrderTP.push({
                    ...cancelDataObject,
                    orderId: allStrategiesByBotIDAndStrategiesID[botID]?.[strategyID]?.TP?.orderID,
                    gongLai: true
                })

                !listOrderOC[botID] && (listOrderOC[botID] = {});
                !listOrderOC[botID].listOC && (listOrderOC[botID] = {
                    listOC: {},
                    ApiKey,
                    SecretKey,
                });

                allStrategiesByBotIDAndStrategiesID?.[botID]?.[strategyID]?.OC?.orderLinkId && (listOrderOC[botID].listOC[strategyID] = {
                    strategyID,
                    symbol,
                    strategy: strategiesData,
                    side,
                    botName,
                    botID,
                    ApiKey,
                    SecretKey,
                    orderLinkId: allStrategiesByBotIDAndStrategiesID?.[botID]?.[strategyID]?.OC?.orderLinkId
                });

            }

        }

    }))



    await handleCancelAllOrderTP({
        items: listOrderTP
    })
    await cancelAllListOrderOC(listOrderOC)

    await handleSocketBotApiList(newBotApiList)
}

const handleSocketDelete = async (newData = []) => {
    console.log("[...] Deleted Strategies From Realtime", newData.length);

    const listOrderOC = {}
    const listOrderTP = []

    await Promise.allSettled(newData.map((strategiesData, index) => {
        if (checkConditionBot(strategiesData)) {

            const ApiKey = strategiesData.botID.ApiKey
            const SecretKey = strategiesData.botID.SecretKey

            const symbol = strategiesData.symbol
            const strategyID = strategiesData.value
            const botID = strategiesData.botID._id
            const botName = strategiesData.botID.botName
            const scannerID = strategiesData.scannerID

            const side = strategiesData.PositionSide === "Long" ? "Buy" : "Sell"

            const botSymbolMissID = `${botID}-${symbol}`

            const cancelDataObject = {
                ApiKey,
                SecretKey,
                strategyID,
                symbol: symbol,
                candle: strategiesData.Candlestick,
                side,
                botName,
                botID
            }

            allStrategiesByBotIDAndStrategiesID[botID]?.[strategyID]?.TP?.orderID && listOrderTP.push({
                ...cancelDataObject,
                orderId: allStrategiesByBotIDAndStrategiesID[botID]?.[strategyID]?.TP?.orderID,
                gongLai: true
            })

            !listOrderOC[botID] && (listOrderOC[botID] = {});
            !listOrderOC[botID].listOC && (listOrderOC[botID] = {
                listOC: {},
                ApiKey,
                SecretKey,
            });

            allStrategiesByBotIDAndStrategiesID?.[botID]?.[strategyID]?.OC?.orderLinkId && (listOrderOC[botID].listOC[strategyID] = {
                strategyID,
                strategy: strategiesData,
                symbol,
                side,
                botName,
                botID,
                ApiKey,
                SecretKey,
                orderLinkId: allStrategiesByBotIDAndStrategiesID?.[botID]?.[strategyID]?.OC?.orderLinkId
            });

            // handleCancelOrderTP({
            //     ...cancelDataObject,
            //     orderId: missTPDataBySymbol[botSymbolMissID]?.orderID,
            //     gongLai: true
            // })


            delete allStrategiesByBotIDAndStrategiesID[botID]?.[strategyID]
            delete allStrategiesByCandleAndSymbol[symbol]?.[strategyID]
            scannerID && delete listConfigIDByScanner[scannerID]?.[symbol]
        }
    }))

    await handleCancelAllOrderTP({
        items: listOrderTP
    })
    await cancelAllListOrderOC(listOrderOC)

}

// REALTIME
const socket = require('socket.io-client');

const socketRealtime = socket(process.env.SOCKET_IP);

socketRealtime.on('connect', () => {
    console.log('[V] Connected Socket Realtime');
});

socketRealtime.on('add', async (newData = []) => {

    await handleSocketAddNew(newData)

});

socketRealtime.on('update', async (newData = []) => {

    await handleSocketUpdate(newData)

});
socketRealtime.on('delete', async (newData) => {
    await handleSocketDelete(newData)

});
socketRealtime.on('scanner-add', async (newData = []) => {
    console.log("[...] Add Scanner From Realtime", newData.length);
    const newBotApiList = {}

    newData.forEach(scannerData => {
        const scannerID = scannerData._id

        const botID = scannerData.botID?._id
        const botName = scannerData.botID.botName
        const ApiKey = scannerData.botID.ApiKey
        const SecretKey = scannerData.botID.SecretKey
        const telegramID = scannerData.botID.telegramID
        const telegramToken = scannerData.botID.telegramToken

        if (!botApiList[botID]) {
            botApiList[botID] = {
                id: botID,
                botName,
                ApiKey,
                SecretKey,
                telegramID,
                telegramToken,
                IsActive: true
            }
            newBotApiList[botID] = {
                id: botID,
                botName,
                ApiKey,
                SecretKey,
                telegramID,
                telegramToken,
                IsActive: true
            }
        }

        const setBlacklist = new Set(scannerData.Blacklist)
        if (checkConditionBot(scannerData)) {
            scannerData.OnlyPairs.forEach(symbol => {
                if (!setBlacklist.has(symbol)) {
                    !allScannerDataObject[symbol] && (allScannerDataObject[symbol] = {})

                    const newScannerData = { ...scannerData }
                    newScannerData.ExpirePre = new Date()

                    allScannerDataObject[symbol][scannerID] = newScannerData
                }
            })
        }
    })
    await handleSocketBotApiList(newBotApiList)

});

socketRealtime.on('scanner-update', async (newData = []) => {
    console.log("[...] Update Scanner From Realtime", newData.length);
    const newBotApiList = {}

    newData.forEach(scannerData => {
        const scannerID = scannerData._id
        const IsActive = scannerData.IsActive

        const botID = scannerData.botID?._id
        const botName = scannerData.botID.botName
        const ApiKey = scannerData.botID.ApiKey
        const SecretKey = scannerData.botID.SecretKey
        const telegramID = scannerData.botID.telegramID
        const telegramToken = scannerData.botID.telegramToken

        if (!botApiList[botID]) {
            botApiList[botID] = {
                id: botID,
                botName,
                ApiKey,
                SecretKey,
                telegramID,
                telegramToken,
                IsActive: true
            }
            newBotApiList[botID] = {
                id: botID,
                botName,
                ApiKey,
                SecretKey,
                telegramID,
                telegramToken,
                IsActive: true
            }
        }
        const setOnlyPairs = new Set(scannerData.OnlyPairs)
        const setBlacklist = new Set(scannerData.Blacklist)
        if (checkConditionBot(scannerData)) {
            allSymbol.forEach(symbolData => {

                const symbol = symbolData.value
                if (IsActive && setOnlyPairs.has(symbol) && !setBlacklist.has(symbol)) {
                    !allScannerDataObject[symbol] && (allScannerDataObject[symbol] = {})

                    const newScannerData = { ...scannerData }
                    newScannerData.ExpirePre = new Date()

                    allScannerDataObject[symbol][scannerID] = newScannerData

                }
                else {
                    delete allScannerDataObject[symbol]?.[scannerID]
                }
            })
        }
    })
});

socketRealtime.on('scanner-delete', async (newData = []) => {
    console.log("[...] Delete Scanner From Realtime", newData.length);


    newData.forEach(scannerData => {
        const scannerID = scannerData._id
        allSymbol.forEach(symbol => {
            delete allScannerDataObject[symbol.value]?.[scannerID]
        })
    })

});




socketRealtime.on('bot-update', async (data = {}) => {
    const { newData, botIDMain, botActive } = data;
    updatingAllMain = true

    const botNameExist = botApiList[botIDMain]?.botName || botIDMain
    console.log(`[...] Bot-Update ( ${botNameExist} ) Strategies From Realtime`, newData.length);

    const newBotApiList = {}

    const botApiData = botApiList[botIDMain]

    // if (botApiData) {

    //     const ApiKeyBot = botApiData.ApiKey
    //     const SecretKeyBot = botApiData.SecretKey

    //     const wsConfigOrder = {
    //         key: ApiKeyBot,
    //         secret: SecretKeyBot,
    //         market: 'v5',
    //         recvWindow: 100000
    //     }

    //     const wsOrder = new WebsocketClient(wsConfigOrder);

    //     if (botActive) {
    //         await wsOrder.subscribeV5(LIST_ORDER, 'spot')
    //     }
    //     else {
    //         console.log(`[V] UnsubscribeV5 ( ${botNameExist} )`);
    //         await wsOrder.unsubscribeV5(LIST_ORDER, 'spot')
    //     }
    // }
    const listOrderOC = {}
    const listOrderTP = []

    await Promise.allSettled(newData.map((strategiesData, index) => {

        const ApiKey = strategiesData.botID.ApiKey
        const SecretKey = strategiesData.botID.SecretKey
        const botID = strategiesData.botID._id
        const botName = strategiesData.botID.botName

        const symbol = strategiesData.symbol
        const strategyID = strategiesData.value
        const IsActive = strategiesData.IsActive
        const side = strategiesData.PositionSide === "Long" ? "Buy" : "Sell"

        const botSymbolMissID = `${botID}-${symbol}`

        !allStrategiesByCandleAndSymbol[symbol] && (allStrategiesByCandleAndSymbol[symbol] = {});
        allStrategiesByCandleAndSymbol[symbol][strategyID] = strategiesData

        !allStrategiesByBotIDAndOrderID[botID] && (allStrategiesByBotIDAndOrderID[botID] = {});
        !allStrategiesByBotIDAndStrategiesID[botID]?.[strategyID] && cancelAll({ botID, strategyID });



        if (IsActive) {
            if (!botApiList[botID]) {

                botApiList[botID] = {
                    id: botID,
                    ApiKey,
                    SecretKey,
                    botName,
                    telegramID: strategiesData.botID.telegramID,
                    telegramToken: strategiesData.botID.telegramToken,
                }

                newBotApiList[botID] = {
                    id: botID,
                    ApiKey,
                    SecretKey,
                    botName,
                    telegramID: strategiesData.botID.telegramID,
                    telegramToken: strategiesData.botID.telegramToken,
                }

                // !allStrategiesByBotIDOrderOC[botID] && (allStrategiesByBotIDOrderOC[botID] = {})
                // !allStrategiesByBotIDOrderOC[botID][symbol] && (
                //     allStrategiesByBotIDOrderOC[botID][symbol] = {
                //         totalOC: 0,
                //         logError: false
                //     }
                // )
            }
        }



        const cancelDataObject = {
            ApiKey,
            SecretKey,
            strategyID,
            symbol: symbol,
            candle: strategiesData.Candlestick,
            side,
            botName,
            botID
        }


        !listOrderOC[botID] && (listOrderOC[botID] = {});
        !listOrderOC[botID].listOC && (listOrderOC[botID] = {
            listOC: {},
            ApiKey,
            SecretKey,
        });

        allStrategiesByBotIDAndStrategiesID?.[botID]?.[strategyID]?.OC?.orderLinkId && (listOrderOC[botID].listOC[strategyID] = {
            strategyID,
            strategy: strategiesData,
            symbol,
            side,
            botName,
            botID,
            ApiKey,
            SecretKey,
            orderLinkId: allStrategiesByBotIDAndStrategiesID?.[botID]?.[strategyID]?.OC?.orderLinkId
        });


        if (!strategiesData.IsActive) {

            allStrategiesByBotIDAndStrategiesID[botID]?.[strategyID]?.TP?.orderID && listOrderTP.push({
                ...cancelDataObject,
                orderId: allStrategiesByBotIDAndStrategiesID[botID]?.[strategyID]?.TP?.orderID,
                gongLai: true
            })
        }

    }))

    await handleCancelAllOrderTP({
        items: listOrderTP
    })
    await cancelAllListOrderOC(listOrderOC)

    !botApiData && await handleSocketBotApiList(newBotApiList);
    updatingAllMain = false

});

socketRealtime.on('bot-api', async (data) => {
    const { newData, botID: botIDMain, newApiData } = data;
    updatingAllMain = true

    const botNameExist = botApiList[botIDMain]?.botName || botIDMain

    console.log(`[...] Bot-Api ( ${botNameExist} ) Update Strategies From Realtime`, newData.length);

    const listOrderOC = []
    const listOrderTP = []

    await Promise.allSettled(newData.map((strategiesData, index) => {

        const strategyID = strategiesData.value
        const symbol = strategiesData.symbol
        const ApiKey = strategiesData.botID.ApiKey
        const SecretKey = strategiesData.botID.SecretKey
        const botID = strategiesData.botID._id
        const botName = strategiesData.botID.botName
        const side = strategiesData.PositionSide === "Long" ? "Buy" : "Sell"


        const botSymbolMissID = `${botID}-${symbol}`

        !allStrategiesByCandleAndSymbol[symbol] && (allStrategiesByCandleAndSymbol[symbol] = {});
        allStrategiesByCandleAndSymbol[symbol][strategyID] = strategiesData

        const cancelDataObject = {
            ApiKey,
            SecretKey,
            strategyID,
            symbol: symbol,
            candle: strategiesData.Candlestick,
            side,
            botName,
            botID
        }

        allStrategiesByBotIDAndStrategiesID[botID]?.[strategyID]?.TP?.orderID && listOrderTP.push({
            ...cancelDataObject,
            orderId: allStrategiesByBotIDAndStrategiesID[botID]?.[strategyID]?.TP?.orderID,
            gongLai: true
        })

        !listOrderOC[botID] && (listOrderOC[botID] = {});
        !listOrderOC[botID].listOC && (listOrderOC[botID] = {
            listOC: {},
            ApiKey,
            SecretKey,
        });

        allStrategiesByBotIDAndStrategiesID?.[botID]?.[strategyID]?.OC?.orderLinkId && (listOrderOC[botID].listOC[strategyID] = {
            strategyID,
            strategy: strategiesData,
            symbol,
            side,
            botName,
            botID,
            ApiKey,
            SecretKey,
            orderLinkId: allStrategiesByBotIDAndStrategiesID?.[botID]?.[strategyID]?.OC?.orderLinkId
        });
        // handleCancelOrderTP({
        //     ...cancelDataObject,
        //     orderId: missTPDataBySymbol[botSymbolMissID]?.orderID
        //     ,
        //     gongLai: true
        // })

    }))

    await handleCancelAllOrderTP({
        items: listOrderTP
    })
    await cancelAllListOrderOC(listOrderOC)

    // 
    try {
        const botApiData = botApiList[botIDMain]
        const ApiKeyBot = botApiData.ApiKey
        const SecretKeyBot = botApiData.SecretKey

        const wsConfigOrder = getWebsocketClientConfig({ ApiKey: ApiKeyBot, SecretKey: SecretKeyBot })

        const wsOrder = new WebsocketClient(wsConfigOrder);

        await wsOrder.unsubscribeV5(LIST_ORDER, 'spot')

        botApiList[botIDMain] = {
            ...botApiList[botIDMain],
            ApiKey: newApiData.ApiKey,
            SecretKey: newApiData.SecretKey,
        }



        const wsConfigOrderNew = getWebsocketClientConfig({ ApiKey: newApiData.ApiKey, SecretKey: newApiData.SecretKey })

        const wsOrderNew = new WebsocketClient(wsConfigOrderNew);

        await wsOrderNew.subscribeV5(LIST_ORDER, 'spot')

    } catch (error) {
        console.log("[!] Error subscribeV5", error)
    }

    updatingAllMain = false


});

socketRealtime.on('bot-delete', async (data) => {
    const { newData, botID: botIDMain } = data;
    updatingAllMain = true

    const botNameExist = botApiList[botIDMain]?.botName || botIDMain

    console.log(`[...] Bot Deleted ( ${botNameExist} ) Strategies From Realtime`);

    const listOrderOC = []
    const listOrderTP = []
    const botApiData = botApiList[botIDMain]

    await Promise.allSettled(newData.map(async (strategiesData, index) => {

        const ApiKey = strategiesData.botID.ApiKey
        const SecretKey = strategiesData.botID.SecretKey

        const symbol = strategiesData.symbol
        const strategyID = strategiesData.value
        const botID = strategiesData.botID._id
        const botName = strategiesData.botID.botName

        const side = strategiesData.PositionSide === "Long" ? "Buy" : "Sell"

        const botSymbolMissID = `${botID}-${symbol}`


        const cancelDataObject = {
            ApiKey,
            SecretKey,
            strategyID,
            symbol: symbol,
            candle: strategiesData.Candlestick,
            side,
            botName,
            botID
        }


        !listOrderOC[botID] && (listOrderOC[botID] = {});
        !listOrderOC[botID].listOC && (listOrderOC[botID] = {
            listOC: {},
            ApiKey,
            SecretKey,
        });

        allStrategiesByBotIDAndStrategiesID?.[botID]?.[strategyID]?.OC?.orderLinkId && (listOrderOC[botID].listOC[strategyID] = {
            strategyID,
            strategy: strategiesData,
            symbol,
            side,
            botName,
            botID,
            ApiKey,
            SecretKey,
            orderLinkId: allStrategiesByBotIDAndStrategiesID?.[botID]?.[strategyID]?.OC?.orderLinkId
        });

        allStrategiesByBotIDAndStrategiesID[botID]?.[strategyID]?.TP?.orderID && listOrderTP.push({
            ...cancelDataObject,
            orderId: allStrategiesByBotIDAndStrategiesID[botID]?.[strategyID]?.TP?.orderID,
            gongLai: true
        })

        delete allStrategiesByBotIDAndStrategiesID[botID]?.[strategyID]
        delete allStrategiesByCandleAndSymbol[symbol]?.[strategyID]
    }))

    await handleCancelAllOrderTP({
        items: listOrderTP
    })
    await cancelAllListOrderOC(listOrderOC)

    const ApiKeyBot = botApiData.ApiKey
    const SecretKeyBot = botApiData.SecretKey


    const wsConfigOrder = getWebsocketClientConfig({ ApiKey: ApiKeyBot, SecretKey: SecretKeyBot })

    const wsOrder = new WebsocketClient(wsConfigOrder);

    await wsOrder.unsubscribeV5(LIST_ORDER, 'spot')

    delete botApiList[botIDMain]
    updatingAllMain = false

});

socketRealtime.on('bot-telegram', async (data) => {

    const { botID: botIDMain, newApiData } = data;

    const botNameExist = botApiList[botIDMain]?.botName || botIDMain

    console.log(`[...] Bot Telegram ( ${botNameExist} ) Update From Realtime`);

    botApiList[botIDMain] = {
        ...botApiList[botIDMain],
        telegramID: newApiData.telegramID,
        telegramToken: newApiData.telegramToken
    }

});

socketRealtime.on('sync-symbol', async (newData) => {

    console.log("[...] Sync Symbol:", newData.length);

    allSymbol = allSymbol.concat(newData)

    let newListKline = {}

    const resultDigitAll = await Digit()
    resultDigitAll?.length > 0 && (
        resultDigitAll.reduce((pre, cur) => {
            if (cur.symbol.includes("USDT")) {
                pre[cur.symbol] = {
                    priceScale: +cur.priceScale,
                    basePrecision: +cur.basePrecision,
                }
            }
            return pre
        }, digitAllCoinObject)
    );

    newData.forEach(symbolData => {
        const symbol = symbolData.value
        trichMauOCListObject[symbol] = {
            preTime: 0
        }
        symbolTradeTypeObject[symbol] = symbolData.type

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

        const klineText = `kline.D.${symbol}`
        listKline[symbol] = klineText
        newListKline[symbol] = klineText

    })

    await handleSocketListKline(Object.values(newListKline))

});


socketRealtime.on('close-upcode', async () => {

    console.log(`[...] Close All Bot For Upcode`);

    updatingAllMain = true

    const cancelOC = cancelAllListOrderOC(listOCByCandleBot)
    const deleteAll = deleteAllForUPcodeV1()

    await Promise.allSettled([cancelOC, deleteAll])

    console.log("PM2 Kill Successful");
    exec("pm2 stop runTrade-V1")

});

socketRealtime.on('disconnect', () => {
    console.log('[V] Disconnected from socket realtime');
});

