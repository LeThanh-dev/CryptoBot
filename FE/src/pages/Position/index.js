import { FormControl, FormLabel, Select, MenuItem, Button } from "@mui/material";
import AddBreadcrumbs from "../../components/BreadcrumbsCutom";
import styles from './Position.module.scss'
import { useEffect, useRef, useState } from "react";
import { getAllBotOnlyApiKeyByUserID } from "../../services/botService";
import DataGridCustom from "../../components/DataGridCustom";
import CheckIcon from '@mui/icons-material/Check';
import { updatePL } from "../../services/positionService";
import { addMessageToast } from "../../store/slices/Toast";
import { useDispatch } from "react-redux";
import AddLimit from "./components/AddLimit";
import AddMarket from "./components/AddMarket";

function Position() {
    const botTypeList = [
        {
            name: "All",
            value: "All"
        },
        {
            name: "BybitV3",
            value: "BybitV3"
        }
    ]

    const tableColumns = [
        {
            field: 'stt',
            headerName: '#',
            maxWidth: 50,
            type: "actions",
            renderCell: (params) => params.api.getAllRowIds().indexOf(params.id) + 1
        },
        {
            field: 'BotName',
            headerName: 'Bot',
            minWidth: 150,
            flex: window.innerWidth <= 740 ? undefined : 1,

        },
        {
            field: 'Symbol',
            headerName: 'Symbol',
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
                    color: params.value > 0 ? "green" : "red"
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
                    color: params.value > 0 ? "green" : "red"
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

    const dispatch = useDispatch()

    const handleGetAllBotByUserID = () => {
        const userData = JSON.parse(localStorage.getItem("user"))
        getAllBotOnlyApiKeyByUserID(userData._id)
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

    const handleRefreshData = async (botListInput = botList) => {
        try {
            const res = await updatePL(botListInput.slice(1))
            const { status, message, data: resData } = res.data
            if (status === 200) {
                const data = resData.length > 0 ? resData?.map(item => (
                    {
                        id: item._id,
                        BotName: item.botID.botName,
                        botID: item.botID._id,
                        botData: item.botID,
                        Symbol: item.Symbol,
                        Side: item.Side,
                        Price: item.Price,
                        Time: new Date(item.Time).toLocaleString(),
                        TimeUpdated: new Date(item.TimeUpdated).toLocaleString(),
                        Quantity: item.Quantity,
                        Pnl: (+item.Pnl).toFixed(4),
                        Miss: item.Miss,
                    }
                )).filter(item => (item.Pnl) != 0) : []
                setPositionData(data)
                positionDataDefault.current = data
            }

            dispatch(addMessageToast({
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
    }
    useEffect(() => {

        handleGetAllBotByUserID()

    }, []);

    useEffect(() => {
        if (openAddLimit.isOpen || openAddMarket.isOpen || openAddLimit.dataChange || openAddMarket.dataChange) {
            handleRefreshData()
        }
    }, [openAddLimit, openAddMarket]);

    return (
        <div>
            <AddBreadcrumbs list={["Position"]} />

            <div className={styles.position}>

                <div className={styles.positionHeader}>
                    <FormControl className={styles.positionHeaderItem}>
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
                    </FormControl>

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



                    {botList.length > 0 &&
                        <Button
                            variant="contained"
                            size="small"
                            color="info"
                            className={styles.refreshBtn}
                            onClick={() => {
                                handleRefreshData()
                            }}
                        >
                            Refresh
                        </Button>}
                </div>

                <div className={styles.positionTable}>

                    <DataGridCustom
                        setDataTableChange={setDataTableChange}
                        tableRows={positionData}
                        tableColumns={tableColumns}
                        checkboxSelection={false}
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
        </div >


    );
}

export default Position;