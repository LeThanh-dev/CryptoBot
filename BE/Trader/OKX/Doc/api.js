const axios = require('axios')
const crypto = require('crypto');

const api = axios.create({
    baseURL: "https://aws.okx.com",
});
const apiPrivate = axios.create({
    baseURL: "https://aws.okx.com",
    headers: {
        "OK-ACCESS-KEY": "20c806d9-db45-4fc8-bd41-5c311f0d7c64",
        "OK-ACCESS-TIMESTAMP": new Date().toISOString(),
        "OK-ACCESS-PASSPHRASE": "Nguyen123@"
    },
});

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
                instId = "",
                mgnMode,
                lever
            }) => {
                try {
                    const body = {
                        instId,
                        mgnMode,
                        lever
                    }
                    const requestPath = "/api/v5/copytrading/batch-set-leverage"
                    
                    const OK_ACCESS_SIGN = createSignature({
                        timestamp: new Date().toISOString(),
                        method: "POST",
                        requestPath,
                        body,
                        secretKey: "5E821F8B11B827A4843BEEA6250C781A"
                    })
                    
                    
                    const res = await apiPrivate.post(requestPath, body, {
                        headers: {
                            "OK-ACCESS-SIGN": OK_ACCESS_SIGN
                        }
                    })

                    console.log("res",res);

                    return res.data?.data || []

                } catch (error) {
                    return []
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