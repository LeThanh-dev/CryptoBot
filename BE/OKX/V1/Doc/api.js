const axios = require('axios')

const api = axios.create({
    baseURL: "https://www.okx.com",
});

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
                    console.log(result.code);

                    return res.data?.data || []

                } catch (error) {
                    return []
                }

            },

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