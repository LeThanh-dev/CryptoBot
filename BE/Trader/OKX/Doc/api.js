const axios = require('axios')
const crypto = require('crypto');

const api = axios.create({
    baseURL: "https://aws.okx.com",
});

const getApiPrivate = ({
    timestamp,
    ApiKey,
    Password
}) => axios.create({
    baseURL: "https://aws.okx.com",
    headers: {
        "OK-ACCESS-KEY": ApiKey,
        "OK-ACCESS-TIMESTAMP": timestamp,
        "OK-ACCESS-PASSPHRASE": Password
    },
});

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function createSignature({
    timestamp, method, requestPath, body, secretKey
}) {
    const preSign = timestamp + method + requestPath + (body ? JSON.stringify(body) : '');

    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update(preSign);

    return Buffer.from(hmac.digest()).toString('base64');
}

const OKX_API = {
    orderBookTrading: {
        marketData: {
            getTickers: async ({
                instType
            }) => {
                try {
                    const res = await api.get("/api/v5/market/tickers", {
                        params: {
                            instType
                        }
                    })
                    return res.data?.data || []

                } catch (error) {
                    return []
                }

            },

        },
        copyTrading: {
            setLever: async ({
                listSymbol = [],
                botData = {}
            }) => {
                try {

                    const ApiKey = botData.ApiKey
                    const SecretKey = botData.SecretKey
                    const Password = botData.Password

                    const requestPath = "/api/v5/account/set-leverage"

                    let index = 0;
                    const batchSize = 10

                    let errorText = ""
                    while (index < listSymbol.length) {
                        const batch = listSymbol.slice(index, index + batchSize);
                        await Promise.allSettled(batch.map(async item => (
                            await Promise.allSettled(["isolated", "cross"].map(async mgnMode => {
                                const symbol = item.symbol
                                const lever = item.lever
                                const body = {
                                    instId: symbol,
                                    mgnMode,
                                    lever,
                                }
                                const timestamp = new Date().toISOString()
                                const OK_ACCESS_SIGN = createSignature({
                                    timestamp,
                                    method: "POST",
                                    requestPath,
                                    body,
                                    secretKey: SecretKey
                                })

                                const apiPrivate = getApiPrivate({
                                    timestamp,
                                    ApiKey,
                                    Password
                                })

                                try {
                                    await apiPrivate.post(requestPath, body, {
                                        headers: {
                                            "OK-ACCESS-SIGN": OK_ACCESS_SIGN
                                        }
                                    })

                                } catch (error) {
                                    console.log(`[!] Set lever ( ${symbol} - ${lever} )  error: ${error}`);
                                    errorText = error.response.data.msg
                                }

                            })
                            ))));
                        if (errorText) {
                            break
                        }
                        await delay(2000)
                        index += batchSize;
                    }

                    return {
                        code: !errorText ? 0 : -1,
                        msg: !errorText ? "Set Lever Successful" : errorText,
                        data: listSymbol
                    }

                } catch (error) {
                    return {
                        code: -1,
                        msg: error.message,
                        data: []
                    }
                }
            }
        }
    },
    publicData: {
        restAPI: {
            getInstruments: async ({ instType }) => {
                try {
                    const res = await api.get("/api/v5/public/instruments", {
                        params: {
                            instType
                        }
                    })
                    return res.data?.data || []
                } catch (error) {
                    return []
                }
            }
        }
    }
}

module.exports = OKX_API