import { FormControl, FormLabel, Select, MenuItem, Button } from "@mui/material";
import AddBreadcrumbs from "../../../../components/BreadcrumbsCutom";
import styles from './Position.module.scss'
import { useEffect, useRef, useState } from "react";
import { getAllBotOnlyApiKeyByUserID } from "../../../../services/botService";
import DataGridCustom from "../../../../components/DataGridCustom";
import CheckIcon from '@mui/icons-material/Check';
import { closeAllPosition, updatePL } from "../../../../services/Positions/ByBIt/V3/positionService";
import { addMessageToast } from "../../../../store/slices/Toast";
import { useDispatch, useSelector } from "react-redux";

import DialogCustom from "../../../../components/DialogCustom";
import AddLimit from "./components/AddLimit";
import AddMarket from "./components/AddMarket";
import { LoadingButton } from "@mui/lab";

function PositionV3() {

    const [loading, setLoading] = useState(false);
    const userData = useSelector(state => state.userDataSlice.userData)
    const [confirmCloseAllPosition, setConfirmCloseAllPosition] = useState({
        isOpen: false,
        dataChange: false,
    });
    const [loadingRefresh, setLoadingRefresh] = useState(true);


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
            flex: window.innerWidth <= 740 ? undefined : 1,
            type: "actions",
            renderCell: (params) => {
                return <p style={{
                    color: params.value === "Buy" ? "green" : "red"
                }}>{params.value}</p>
            }

        },

        {
            field: 'Price',
            headerName: 'Price',
            minWidth: 170,
            flex: window.innerWidth <= 740 ? undefined : 1,
        },
        {
            field: 'Quantity',
            headerName: 'Quantity',
            minWidth: 150,
            flex: window.innerWidth <= 740 ? undefined : 1,
            renderCell: (params) => {
                return <p style={{
                    color: params.value >= 0 ? "green" : "red"
                }}>{params.value}</p>
            }
        },
        {
            field: 'Pnl',
            headerName: 'Pnl',
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
            renderCell: (params) => (
                <>
                    {
                        params.value && (
                            <CheckIcon />
                        )
                    }
                </>
            )

        },
        {
            field: 'Actions',
            type: "actions",
            minWidth: 180,
            headerName: 'Active',
            renderCell: params => {
                const rowData = params.row; // Dữ liệu của hàng hiện tại
                return (
                    <div >
                        {
                            <Button
                                variant="contained"
                                size="small"
                                color="inherit"
                                style={{
                                    margin: "0 6px"
                                }}
                                onClick={() => {
                                    setOpenAddLimit({
                                        isOpen: true,
                                        dataChange: "",
                                        data: rowData
                                    })
                                }}
                            >
                                Limit
                            </Button>
                        }
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
                            Market
                        </Button>
                    </div>
                )

            },

        },

    ]

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
    const botListObject = useRef({})

    const dispatch = useDispatch()

    const handleGetAllBotByUserID = () => {

        getAllBotOnlyApiKeyByUserID(userData._id, "ByBitV3")
            .then(res => {
                const data = res.data.data;
                const newData = data?.map(item => {
                    const botID = item?._id
                    const newData = {
                        name: item?.botName,
                        value: botID,
                        ApiKey: item?.ApiKey,
                        SecretKey: item?.SecretKey,
                    }
                    botListObject.current[botID] = newData
                    return newData
                })
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
                        Side: item.Side,
                        Price: item.Price,
                        Time: new Date(item.Time).toLocaleString("vi-vn", { timeZone: 'Asia/Ho_Chi_Minh' }),
                        TimeUpdated: new Date(item.TimeUpdated).toLocaleString("vi-vn", { timeZone: 'Asia/Ho_Chi_Minh' }),
                        Quantity: item.Quantity,
                        Pnl: (+item.Pnl).toFixed(4),
                        Miss: item.Miss,
                    }
                )).filter(item => (item.Pnl) != 0) : []
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
        if (openAddLimit.dataChange || openAddMarket.dataChange || confirmCloseAllPosition.dataChange) {
            handleRefreshData(undefined, false)
        }
    }, [openAddLimit, openAddMarket, confirmCloseAllPosition]);

    return (
        <div>
            <AddBreadcrumbs list={["PositionV3"]} />

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
                        {positionData.length > 0 &&
                            <Button
                                variant="contained"
                                size="small"
                                color="error"
                                style={{ marginLeft: "12px" }}
                                onClick={() => {
                                    setConfirmCloseAllPosition({
                                        isOpen: true,
                                        dataChange: false
                                    })
                                }}
                            >
                                Close All
                            </Button>}
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
                                "Quantity": false,
                                "Time": false,
                                "TimeUpdated": false,
                            }
                        }
                    />
                </div>
            </div>

            {
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
            }

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

            {
                confirmCloseAllPosition.isOpen && (
                    <DialogCustom
                        loading={loading}
                        backdrop
                        open={true}
                        onClose={() => {
                            setConfirmCloseAllPosition({
                                dataChange: false,
                                isOpen: false
                            })
                        }}
                        onSubmit={async () => {
                            setLoading(true)
                            const botListID = botSelected == "All" ? botList.slice(1) : [botListObject.current[botSelected]]

                            const res = await closeAllPosition(botListID)
                            const { message } = res.data

                            dispatch(addMessageToast({
                                status: 200,
                                message,
                            }))
                            setConfirmCloseAllPosition({
                                dataChange: true,
                                isOpen: false
                            })
                            setLoading(false)
                        }}
                        dialogTitle="The action requires confirmation"
                        submitBtnColor="error"
                        submitBtnText="Close All"
                        reserveBtn
                        position="center"
                    >
                        <p style={{ textAlign: "center" }}>Do you want to close all position of bots?</p>
                    </DialogCustom >
                )
            }
        </div >


    );
}

export default PositionV3;