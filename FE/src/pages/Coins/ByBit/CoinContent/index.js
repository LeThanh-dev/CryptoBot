import { Button, TextField } from '@mui/material';
import styles from './CoinContent.module.scss'
import { useEffect, useRef, useState } from 'react';
import DataGridCustom from '../../../../components/DataGridCustom';
import { useDispatch } from 'react-redux';
import { addMessageToast } from '../../../../store/slices/Toast';
import { formatNumberString } from '../../../../functions';
import { getAllCoin, syncCoin } from '../../../../services/coinService';
import { LoadingButton } from '@mui/lab';

function CoinContent() {
    const tableColumns = [
        {
            field: 'stt',
            headerName: '#',
            maxWidth: 50,
            type: "actions",
            renderCell: (params) => params.api.getAllRowIds().indexOf(params.id) + 1
        },
        {
            field: 'Coin',
            headerName: 'Coin',
            flex: 1,
            minWidth:200,
        },
        {
            field: 'volume24h',
            headerName: 'Vol',
            type: "number",
            flex: 1,
            renderCell: (params) => formatNumberString(params.value)
        },
    ]

    const [tableRows, setTableRows] = useState([]);
    const [loading, setLoading] = useState(false);

    const tableRowsDefault = useRef([])

    const dispatch = useDispatch()

    const handleGetSymbolList = async () => {
        try {
            const res = await getAllCoin()
            const { status, message, data: symbolListDataRes } = res.data

            const newSymbolList = symbolListDataRes.map(item => (
                {
                    id: item._id,
                    Coin: item.symbol.split("USDT")[0],
                    Symbol: item.symbol,
                    volume24h: item.volume24h,
                }))
            tableRowsDefault.current = newSymbolList
            setTableRows(newSymbolList)

        }
        catch (err) {
            dispatch(addMessageToast({
                status: 500,
                message: err.message,
            }))
        }
    }
    const handleSyncCoin = async () => {
        setLoading(true)
        try {
            const res = await syncCoin()
            const { status, message } = res.data

            if (status === 200) {
                handleGetSymbolList()
            }
            dispatch(addMessageToast({
                status,
                message,
            }))
        }
        catch (err) {
            dispatch(addMessageToast({
                status: 500,
                message: err.message,
            }))
        }
        setLoading(false)
    }


    useEffect(() => {
        handleGetSymbolList()
    }, []);
    return (
        <div className={styles.coinContent}>
            <div style={{ display: "flex", "justifyContent": "space-between", alignItems: "center",marginBottom:"16px" }}>
                <TextField
                    placeholder='Coin Name...'
                    size='small'
                    className={styles.coinInput}
                    onChange={(e) => {
                        setTableRows(() => {
                            const key = e.target.value
                            if (key) {
                                const newList = tableRowsDefault.current.filter(item => item.Symbol.toUpperCase().includes(key.toUpperCase()?.trim()))
                                return newList.length > 0 ? newList : []
                            }
                            return tableRowsDefault.current
                        })
                    }}
                />
              
                <LoadingButton
                    variant="contained"
                    size="small"
                    loading={loading}
                    onClick={handleSyncCoin}
                    sx={{
                        ".MuiLoadingButton-label": {

                            fontSize: "14px !important",
                        }
                    }}

                >
                    Sync
                </LoadingButton>
            </div>
            <DataGridCustom
                tableColumns={tableColumns}
                tableRows={tableRows}
                checkboxSelection={false}
            />
        </div>
    );
}

export default CoinContent;