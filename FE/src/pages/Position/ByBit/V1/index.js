import { FormControl, FormLabel, Select, MenuItem, Button } from "@mui/material";
import styles from './Position.module.scss'
import { useEffect, useRef, useState } from "react";
import CheckIcon from '@mui/icons-material/Check';
import { useDispatch, useSelector } from "react-redux";

import AddMarket from "./components/AddMarket";
import { LoadingButton } from "@mui/lab";
import AddBreadcrumbs from "../../../../components/BreadcrumbsCutom";
import DataGridCustom from "../../../../components/DataGridCustom";
import { formatNumber } from "../../../../functions";
import { getAllBotOnlyApiKeyByUserID } from "../../../../services/botService";
import { updatePL } from "../../../../services/positionV1Service";
import { addMessageToast } from "../../../../store/slices/Toast";

function PositionV1() {

    const userData = useSelector(state => state.userDataSlice.userData)


    // const botTypeList = [
    //     {
    //         name: "All",
    //         value: "All"
    //     },
    //     {
    //         name: "BybitV3",
    //         value: "BybitV3"
    //     }
    // ]

    const tableColumns = [
        {
            field: 'stt',
            headerName: '#',
            maxWidth: 50,
            type: "actions",
            renderCell: (params) => params.api.getAllRowIds().indexOf(params.id) + 1
        },
        {
            field: 'Symbol',
            headerName: 'Symbol',
            minWidth: 150,
            flex: window.innerWidth <= 740 ? undefined : 1,

        },
        {
            field: 'BotName',
            headerName: 'Bot',
            minWidth: 150,
            flex: window.innerWidth <= 740 ? undefined : 1,
        },
        {
            field: 'Side',
            headerName: 'Side',
            minWidth: 150,
            maxWidth: 150,
            flex: window.innerWidth <= 740 ? undefined : 1,
            type: "actions",
            renderCell: (params) => {
                return <p style={{
                    color: params.value === "Buy" ? "green" : "red"
                }}>{params.value}</p>
            }

        },

        {
            field: 'TradeType',
            headerName: 'TradeType',
            minWidth: 150,
            maxWidth: 150,
            flex: window.innerWidth <= 740 ? undefined : 1,
            renderCell: (params) => {
                const TradeType = params.value
                return <p> {TradeType == "Margin" ? "🍁" : "🍀"} {TradeType}</p>
            }
        },
        {
            field: 'Quantity',
            headerName: 'Quantity',
            maxWidth: 170,
            minWidth: 170,
            flex: window.innerWidth <= 740 ? undefined : 1,
            renderCell: (params) => {
                return <p style={{
                    color: +params.value >= 0 ? "green" : "red"
                }}>{(params.value)}</p>
            }
        },
        {
            field: 'MaxQty',
            headerName: 'MaxQty',
            maxWidth: 170,
            minWidth: 170,
            flex: window.innerWidth <= 740 ? undefined : 1,
            renderCell: (params) => {
                return <p style={{
                    color: +params.value >= 0 ? "green" : "red"
                }}>{(params.value)}</p>
            }
        },
        {
            field: 'usdValue',
            headerName: 'USDT',
            minWidth: 150,
            maxWidth: 150,
            flex: window.innerWidth <= 740 ? undefined : 1,
            renderCell: (params) => {
                return <p style={{
                    color: params.value >= 0 ? "green" : "red"
                }}>{params.value}</p>
            }
        },
        {
            field: 'borrowAmount',
            headerName: 'Borrow',
            minWidth: 150,
            flex: window.innerWidth <= 740 ? undefined : 1,
            renderCell: (params) => {
                return <p style={{
                    color: params.value >= 0 ? "green" : "red"
                }}>{params.value}</p>
            }
        },
        {
            field: 'Time',
            headerName: 'Time Created',
            minWidth: 200,
            flex: window.innerWidth <= 740 ? undefined : 1,
        },
        {
            field: 'TimeUpdated',
            headerName: 'Time Updated',
            minWidth: 200,
            flex: window.innerWidth <= 740 ? undefined : 1,
        },
        {
            field: 'Miss',
            headerName: 'Miss?',
            type: "actions",
            maxWidth: 100,
            flex: window.innerWidth <= 740 ? undefined : 1,
            renderCell: (params) => {
                const Symbol = params.row["Symbol"]
                return <>
                    {
                        Symbol !== "USDT" && (
                            params.value && (
                                <CheckIcon />
                            )
                        )
                    }
                </>
            }
        },

        {
            field: 'Actions',
            type: "actions",
            minWidth: 180,
            headerName: 'Active',
            renderCell: params => {
                const rowData = params.row; // Dữ liệu của hàng hiện tại
                const Symbol = rowData["Symbol"]
                const Side = rowData["Side"]

                return (
                    <>
                        {Symbol !== "USDT" && (
                            <Button
                                variant="contained"
                                size="small"
                                style={{
                                    margin: "0 6px"
                                }}
                                onClick={() => {
                                    setOpenAddMarket({
                                        isOpen: true,
                                        dataChange: "",
                                        data: rowData
                                    })
                                }}
                            >
                                {Side === "Buy" ? "Market" : "Repay"}
                            </Button>
                        )}
                    </>
                )

            },

        },

    ]

    const [loadingRefresh, setLoadingRefresh] = useState(true);
    const [botTypeSelected, setBotTypeSelected] = useState("All");
    const [botSelected, setBotSelected] = useState("All");
    const [botList, setBotList] = useState([{
        name: "All",
        value: "All"
    },]);
    const [dataTableChange, setDataTableChange] = useState([]);
    const [positionData, setPositionData] = useState([]);
    const [openAddLimit, setOpenAddLimit] = useState({
        isOpen: false,
        dataChange: "",
        data: ""
    });
    const [openAddMarket, setOpenAddMarket] = useState({
        isOpen: false,
        dataChange: "",
        data: ""
    });

    const positionDataDefault = useRef([])

    const dispatch = useDispatch()

    const handleGetAllBotByUserID = () => {

        getAllBotOnlyApiKeyByUserID(userData._id, "ByBitV1")
            .then(res => {
                const data = res.data.data;
                const newData = data?.map(item => (
                    {
                        name: item?.botName,
                        value: item?._id,
                        ApiKey: item?.ApiKey,
                        SecretKey: item?.SecretKey,
                    }
                ))
                const newMain = [
                    {
                        name: "All",
                        value: "All"
                    },
                    ...newData
                ]
                setBotList(newMain)
                handleRefreshData(newMain)

            })
    }


    const handleFilterAll = ({ name, value }) => {

        const filterListDefault = [
            // {
            //     name: "botType",
            //     value: botTypeSelected
            // },
            {
                name: "botID",
                value: botSelected
            },

        ]
        const filterList = filterListDefault.map(filterItem => {
            if (filterItem.name === name) {
                return { name, value }
            }
            return filterItem
        }).filter(item => item.value !== "All")

        const listData = filterList.length > 0 ? positionDataDefault.current.filter(position => {
            return filterList.every(filterItem => position[filterItem.name] === filterItem.value)
        }) : positionDataDefault.current

        setPositionData(listData)
    }

    const handleRefreshData = async (botListInput = botList, alert = true) => {
        setLoadingRefresh(true)
        try {
            const res = await updatePL(botListInput.slice(1))
            const { status, message, data: resData } = res.data


            if (status === 200) {
                const data = resData.length > 0 ? resData?.map(item => (
                    {
                        id: item._id,
                        BotName: item.botName,
                        botID: item.botID,
                        botData: item.botData,
                        Symbol: item.Symbol,
                        Side: (+item.Quantity) > 0 ? "Buy" : "Sell",
                        usdValue: formatNumber(+item.usdValue),
                        Quantity: +item.Quantity,
                        MaxQty: item.MaxQty,
                        borrowAmount: +item.borrowAmount,
                        TradeType: item.TradeType,
                        Time: new Date(item.Time).toLocaleString("vi-vn", { timeZone: 'Asia/Ho_Chi_Minh' }),
                        TimeUpdated: new Date(item.TimeUpdated).toLocaleString("vi-vn", { timeZone: 'Asia/Ho_Chi_Minh' }),
                        Miss: item.Miss,
                    }
                )) : []
                setPositionData(data)
                setBotSelected("All")
                positionDataDefault.current = data
            }

            alert && dispatch(addMessageToast({
                status,
                message,
            }))

        }
        catch (err) {

            dispatch(addMessageToast({
                status: 500,
                message: "Refresh Position Error",
            }))
        }
        setLoadingRefresh(false)

    }
    useEffect(() => {

        userData.userName && handleGetAllBotByUserID()

    }, [userData.userName]);

    useEffect(() => {
        if (openAddLimit.dataChange || openAddMarket.dataChange) {
            handleRefreshData(undefined, false)
        }
    }, [openAddLimit, openAddMarket]);


    return (
        <div>
            <AddBreadcrumbs list={["PositionV1"]} />

            <div className={styles.position}>

                <div className={styles.positionHeader}>
                    {/* <FormControl className={styles.positionHeaderItem}>
                        <FormLabel className={styles.formLabel}>Bot Type</FormLabel>
                        <Select
                            value={botTypeSelected}
                            size="small"
                        >
                            {
                                botTypeList.map(item => (
                                    <MenuItem value={item.value} key={item.value}>{item.name}</MenuItem>
                                ))
                            }
                        </Select>
                    </FormControl> */}

                    <FormControl className={styles.positionHeaderItem}>
                        <FormLabel className={styles.formLabel}>Bot</FormLabel>
                        <Select
                            value={botSelected}
                            size="small"
                            onChange={e => {
                                const value = e.target.value;
                                setBotSelected(value);
                                handleFilterAll({
                                    name: "botID",
                                    value
                                })
                            }}
                        >
                            {
                                botList.map(item => (
                                    <MenuItem value={item.value} key={item.value}>{item.name}</MenuItem>
                                ))
                            }
                        </Select>
                    </FormControl>



                    <div className={styles.refreshBtn}>
                        {botList.length > 0 &&
                            <LoadingButton
                                variant="contained"
                                size="small"
                                loading={loadingRefresh}
                                color="info"
                                onClick={() => {
                                    handleRefreshData()
                                }}
                                sx={{
                                    ".MuiLoadingButton-label": {

                                        fontSize: "14px !important",
                                    }
                                }}

                            >
                                Refresh
                            </LoadingButton>
                        }

                    </div>
                </div>

                <div className={styles.positionTable}>

                    <DataGridCustom
                        setDataTableChange={setDataTableChange}
                        tableRows={positionData}
                        tableColumns={tableColumns}
                        checkboxSelection={false}
                        columnVisibilityModel={
                            {
                                "Price": false,
                                "Time": false,
                                "TimeUpdated": false,
                            }
                        }
                    />
                </div>
            </div>

            {/* {
                openAddLimit.isOpen && positionData.find(item => item.id == openAddLimit.data?.id) && (
                    <AddLimit
                        onClose={(data) => {
                            setOpenAddLimit({
                                ...openAddLimit,
                                ...data
                            })
                        }}
                        positionData={openAddLimit.data}
                    />
                )
            } */}

            {
                openAddMarket.isOpen && positionData.find(item => item.id == openAddMarket.data?.id) && (
                    <AddMarket
                        onClose={(data) => {
                            setOpenAddMarket({
                                ...openAddMarket,
                                ...data
                            })
                        }}
                        positionData={openAddMarket.data}
                    />
                )
            }


        </div >

    );
}

export default PositionV1;