import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { Button, MenuItem, Select, Switch } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import { Link } from 'react-router-dom';
import { useState, memo, useEffect, useRef } from "react";
import AddBreadcrumbs from "../../components/BreadcrumbsCutom";
import DataGridCustom from "../../components/DataGridCustom";
import AddBot from "./components/AddBot";
import { deleteBot, getAllBot, getAllBotBySameGroup, getAllBotByUserID, setMargin, updateBot } from "../../services/botService";
import styles from "./Bot.module.scss"
import { useDispatch, useSelector } from 'react-redux';
import { addMessageToast } from '../../store/slices/Toast';
import DialogCustom from '../../components/DialogCustom';
import { getTotalFutureSpot, getTotalFutureSpotByBot } from '../../services/dataCoinByBitService';
import { formatNumber } from '../../functions';
import { getAllBotType } from '../../services/botTypeService';
import { LoadingButton } from '@mui/lab';

function Bot() {

    const statusList = [
        {
            name: "All",
            value: "All"
        },
        {
            name: "Pending",
            value: "Pending"
        },
        {
            name: "PendingApproval",
            value: "PendingApproval"
        },
        {
            name: "Installing",
            value: "Installing"
        },
        {
            name: "Stopped",
            value: "Stopped"
        },
        {
            name: "Running",
            value: "Running"
        }
    ]

    const userData = useSelector(state => state.userDataSlice.userData)

    const roleName = userData?.roleName

    const tableColumns = [
        {
            field: 'stt',
            headerName: '#',
            maxWidth: 30,
            type: "actions",
            renderCell: (params) => params.api.getAllRowIds().indexOf(params.id) + 1
        },
        {
            field: 'activeBot',
            type: "actions",
            maxWidth: 120,
            headerName: 'Active',
            renderCell: params => {
                const rowData = params.row; // Dữ liệu của hàng hiện tại
                const botStatus = rowData['Status']
                const botApiKey = rowData['ApiKey']
                const botType = rowData['botType']
                return (
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        marginLeft: "-10px "
                    }}>
                        <Switch
                            size='small'
                            disabled={!(botStatus === "Running" || botStatus === "Stopped")}
                            checked={botStatus === "Running"}
                            onClick={(e) => {
                                const check = e.target.checked
                                if (check) {
                                    handleUpdateBot({
                                        botID: rowData.id,
                                        data: {
                                            Status: "Running",
                                            type: "Active",
                                            checkBot: botApiKey,
                                            botType
                                        }
                                    })
                                }
                                else {
                                    if (botApiKey) {
                                        e.preventDefault()
                                        setConfirmActiveBot({
                                            id: rowData.id,
                                            botType
                                        })
                                    }
                                    else {
                                        handleUpdateBot({
                                            botID: rowData.id,
                                            data: {
                                                Status: "Stopped",
                                                botType
                                            }
                                        })
                                    }
                                }
                            }}
                        />
                        <DeleteOutlineIcon
                            className={styles.icon}
                            style={{ marginLeft: "3px" }}
                            onClick={async () => {
                                setOpenDeleteBot(rowData)
                            }}
                        />
                    </div>
                )

            },

        },

        {
            field: 'botName',
            headerName: 'Name',
            minWidth: 150,
            flex: window.innerWidth <= 740 ? undefined : 1,
            renderCell: e => {
                return (
                    <Link to={`Detail/${e.id}`} style={{
                        color: "var(--blueLightColor)",
                        textDecoration: "none"
                    }
                    } > {e.value}
                    </Link >
                )

            },

        },
        // {
        //     field: 'Balance',
        //     headerName: 'Balance',
        //     minWidth: 150,
        //     flex: window.innerWidth <= 740 ? undefined : 1,

        // },
        {
            field: 'botType',
            headerName: 'Type',
            minWidth: 150,
            flex: window.innerWidth <= 740 ? undefined : 1,

        },
        {
            field: 'userName',
            headerName: 'User Created',
            minWidth: 250,
            flex: window.innerWidth <= 740 ? undefined : 1,
        },
        {
            field: 'Created',
            headerName: 'Created',
            minWidth: 150,
            flex: window.innerWidth <= 740 ? undefined : 1,
        },
        {
            field: 'Status',
            headerName: 'Status',
            minWidth: 150,
            flex: window.innerWidth <= 740 ? undefined : 1,

        },
        // {
        //     field: 'Server',
        //     headerName: 'Server IP',
        //     minWidth: 150,
        //     flex: window.innerWidth <= 740 ? undefined : 1,
        // },

    ]

    roleName !== "Trader" && tableColumns.push({
        field: 'Approval',
        headerName: 'Approval',
        type: "actions",
        minWidth: 150,
        flex: window.innerWidth <= 740 ? undefined : 1,
        renderCell: params => {
            const rowData = params.row;
            const botStatus = rowData['Status']
            const botType = rowData['botType']
            return (
                <Button
                    size='small'
                    color='warning'
                    variant='contained'
                    onClick={() => {
                        handleUpdateBot({
                            botID: rowData.id,
                            data: {
                                Status: "Stopped",
                                botType
                            }
                        })
                    }}
                    style={{
                        display: botStatus === "PendingApproval" ? "unset" : "none"
                    }}
                >
                    Approval
                </Button >
            )

        },
    });

    (roleName === "Admin" || roleName === "SuperAdmin") && tableColumns.push({
        field: 'Set Margin',
        headerName: 'Set Margin',
        type: "actions",
        minWidth: 150,
        flex: window.innerWidth <= 740 ? undefined : 1,
        renderCell: params => {
            const rowData = params.row;
            const botType = rowData['botType']

            return (
                <LoadingButton
                    variant="contained"
                    size="small"
                    loading={loadingSetMargin == rowData["_id"]}
                    sx={{
                        ".MuiLoadingButton-label": {

                            fontSize: "12px !important",
                        }
                    }}
                    onClick={() => {
                        handleSetMargin(rowData)
                    }}
                    style={{
                        display: botType === "ByBitV1" ? "block" : "none"
                    }}
                >
                    Set Margin
                </LoadingButton >
            )

        },
    });

    // const [statusChoose, setStatusChoose] = useState(statusList[0].value);
    const [botList, setBotList] = useState([]);
    const [botTypeList, setBotTypeList] = useState([]);
    const [openAddBot, setOpenAddBot] = useState({
        isOpen: false,
        dataChange: "",
    });
    const [openDeleteBot, setOpenDeleteBot] = useState("");
    const [loadingGetMoney, setLoadingGetMoney] = useState(false);
    const [confirmActiveBot, setConfirmActiveBot] = useState(false);
    const [loadingSetMargin, setLoadingSetMargin] = useState("");
    const [totalFutureSpot, setTotalFutureSpot] = useState(0);
    const totalFutureSpotOfMeDefault = useRef(0)

    const checkMyBotRef = useRef(true)
    const checkBotTypeRef = useRef("All")
    const checkBotStatusRef = useRef("All")
    const botListDefaultRef = useRef([])

    const dispatch = useDispatch()

    const handleFilterAll = () => {
        checkMyBotRef.current = false
        const newBotList = botListDefaultRef.current.filter(item => {
            const checkBotType = checkBotTypeRef.current !== "All" ? checkBotTypeRef.current === item.botType : true
            const checkBotStatus = checkBotStatusRef.current !== "All" ? checkBotStatusRef.current === item.Status : true
            return checkBotType && checkBotStatus
        })
        setBotList(newBotList)
    }

    const handleSetMargin = async (botData) => {
        setLoadingSetMargin(botData._id)
        try {
            const res = await setMargin(botData)
            const { status, message } = res.data

            dispatch(addMessageToast({
                status: status,
                message: message,
            }))

        }
        catch (err) {
            dispatch(addMessageToast({
                status: 500,
                message: "Set Margin Error",
            }))
        }
        setLoadingSetMargin("")
    }
    const handleUpdateBot = async ({ botID, data }) => {
        try {
            const res = await updateBot({
                id: botID,
                data
            })
            const { status, message } = res.data

            dispatch(addMessageToast({
                status: status,
                message: message,
            }))
            if (status === 200) {
                setBotList(botList.map(bot => {
                    if (botID === bot._id) {
                        return {
                            ...bot,
                            ...data,

                        }
                    }
                    return bot
                }))
                botListDefaultRef.current = botListDefaultRef.current.map(bot => {
                    if (botID === bot._id) {
                        return {
                            ...bot,
                            ...data,

                        }
                    }
                    return bot
                })

            }
        }
        catch (err) {
            dispatch(addMessageToast({
                status: 500,
                message: "Update Bot Error",
            }))
        }
    }

    const handleGetAllBot = async () => {
        try {
            let res
            if (roleName === "Admin" || roleName === "SuperAdmin") {
                res = await getAllBot()
            }
            else if (roleName === "ManagerTrader" && userData.groupID) {
                res = await getAllBotBySameGroup(userData.groupID)
            }
            else {
                res = await getAllBotByUserID(userData._id)
            }
            const { status, message, data: resData } = res.data
            if (status === 200) {
                const newData = resData?.map(item => (
                    {
                        ...item,
                        id: item?._id,
                        Created: item?.Created && new Date(item?.Created).toLocaleDateString(),
                        userName: `${item.userID?.userName} ( ${item.userID?.roleName} )`,
                        OwnBot: item.userID?._id === userData._id
                    }
                ))
                botListDefaultRef.current = newData
                setBotList(newData.filter(bot => bot.userID._id == userData._id))
            }
            else {
                dispatch(addMessageToast({
                    status: status,
                    message: message,
                }))
            }
        } catch (error) {
            dispatch(addMessageToast({
                status: 500,
                message: "Get All Bot Error",
            }))
        }
    }

    const handleDeleteBot = async () => {

        try {
            const botID = openDeleteBot._id
            const res = await deleteBot(botID, openDeleteBot.botType)
            const { status, message } = res.data

            dispatch(addMessageToast({
                status: status,
                message: message,
            }))
            if (status === 200) {
                setBotList(botList.filter(bot => botID !== bot._id))
                botListDefaultRef.current = botListDefaultRef.current.filter(bot => botID !== bot._id)
                setOpenDeleteBot("")
            }
        }
        catch (err) {
            dispatch(addMessageToast({
                status: 500,
                message: "Delete Bot Error",
            }))
        }
    }

    const handleGetTotalFutureSpot = async () => {

        setLoadingGetMoney(true)
        try {
            const res = await getTotalFutureSpot(userData._id)
            const { data: resData } = res.data

            setTotalFutureSpot(resData || 0)
            totalFutureSpotOfMeDefault.current = resData || 0


        }
        catch (err) {
            dispatch(addMessageToast({
                status: 500,
                message: "Get Total Future-Spot Error",
            }))
        }
        setLoadingGetMoney(false)
    }

    const handleGetTotalFutureSpotByBot = async (botListData) => {
        setLoadingGetMoney(true)

        if (botListData.length > 0) {

            try {
                const res = await getTotalFutureSpotByBot(botListData)
                const { data: resData } = res.data

                setTotalFutureSpot(resData || 0)
                totalFutureSpotOfMeDefault.current = resData || 0

            }
            catch (err) {
                dispatch(addMessageToast({
                    status: 500,
                    message: "Get Total Future-Spot Error",
                }))
            }
        }
        else {
            setTotalFutureSpot(totalFutureSpotOfMeDefault.current)
        }
        setLoadingGetMoney(false)
    }


    const handleGetAllBotType = async () => {
        try {
            const res = await getAllBotType()
            const { data } = res.data

            setBotTypeList(["All", ...data.map(item => item.name)])
        }
        catch (err) {
            dispatch(addMessageToast({
                status: 500,
                message: "Delete Bot Error",
            }))
        }
    }

    useEffect(() => {
        if (userData.userName) {

            handleGetAllBot()
            handleGetAllBotType()
            handleGetTotalFutureSpot()
        }
    }, [userData.userName]);

    useEffect(() => {
        const newData = openAddBot.dataChange
        if (newData) {
            handleGetAllBot()
            checkBotStatusRef.current = "All"
            checkBotTypeRef.current = "All"

            setOpenAddBot({
                dataChange: "",
                isOpen: false
            })
        }
    }, [openAddBot]);

    return (
        <div className={styles.bot}>
            <AddBreadcrumbs list={["Bots"]} />
            <div className={styles.botFilterList}>
                <div className={styles.botFilterListItem}>
                    <p className={styles.label}>BotType</p>
                    <Select
                        size="small"
                        className={styles.select}
                        value={checkBotTypeRef.current}
                        onChange={e => {
                            checkBotTypeRef.current = e.target.value
                            handleFilterAll()
                        }}
                    >
                        {
                            botTypeList.map(item => (
                                <MenuItem value={item} key={item}>{item}</MenuItem>
                            ))
                        }
                    </Select>
                </div>
                <div className={styles.botFilterListItem}>
                    <p className={styles.label}>Status</p>
                    <Select
                        size="small"
                        className={styles.select}
                        value={checkBotStatusRef.current}
                        onChange={e => {
                            checkBotStatusRef.current = e.target.value
                            handleFilterAll()
                        }}
                    >
                        {
                            statusList.map(item => (

                                <MenuItem value={item.value} key={item.value}>{item.name}</MenuItem>
                            ))
                        }
                    </Select>
                </div>
                <div className={styles.botFilterListItem}>

                    <p className={styles.label}>My Bot</p>
                    <Switch
                        checked={checkMyBotRef.current}
                        title="My Bot"
                        onChange={e => {
                            const check = e.target.checked
                            checkMyBotRef.current = check
                            checkBotStatusRef.current = "All"
                            checkBotTypeRef.current = "All"
                            if (check) {
                                setBotList(botListDefaultRef.current.filter(bot => bot.userID._id == userData._id))
                            }
                            else {
                                setBotList(botListDefaultRef.current)
                            }
                        }}
                    />
                </div>
            </div>
            <div className={styles.botTableContainer}>
                <div className={styles.botTableContainerTitle}>
                    <b style={{ fontWeight: "bold", fontSize: "1.2rem" }}>Total: {!loadingGetMoney ? `${formatNumber(totalFutureSpot)} $` : "..."} </b>
                    <div>
                        {/* {dataTableChange.length > 0 && (
                            <Button
                                size="small"
                                variant="contained"
                                color="error"
                                startIcon={<DeleteOutlineIcon />}
                                style={{ marginRight: "12px" }}
                                onClick={() => {
                                    setOpenEditMultiple(dataTableChange.length)
                                }}
                            >
                                Delete
                            </Button>
                        )} */}
                        <Button
                            size="small"
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => {
                                setOpenAddBot(openAddBot => ({ ...openAddBot, isOpen: true }))
                            }}
                        >
                            Bot
                        </Button>
                    </div>
                </div>
                <div className={styles.botTableContainerData}>
                    <DataGridCustom

                        setDataTableChange={handleGetTotalFutureSpotByBot}
                        tableRows={botList}
                        tableColumns={tableColumns}
                    // checkboxSelection={false}
                    />
                </div>
            </div>

            {openAddBot.isOpen && <AddBot
                open={true}
                onClose={(data) => {
                    setOpenAddBot(data)
                }}
                roleName={roleName}
                botTypeList={botTypeList.slice(1)}
            />}

            {
                openDeleteBot && (
                    <DialogCustom
                        backdrop
                        open={true}
                        onClose={() => {
                            setOpenDeleteBot("")
                        }}
                        onSubmit={handleDeleteBot}
                        dialogTitle="The action requires confirmation"
                        submitBtnColor="error"
                        submitBtnText="Delete"
                        reserveBtn
                        position="center"
                    >
                        <p style={{ textAlign: "center" }}>Do you want to delete this bot?</p>
                    </DialogCustom >
                )
            }

            {
                confirmActiveBot?.id && (
                    <DialogCustom
                        backdrop
                        open={true}
                        onClose={() => {
                            setConfirmActiveBot(false)
                        }}
                        onSubmit={() => {
                            handleUpdateBot({
                                botID: confirmActiveBot.id,
                                data: {
                                    botType: confirmActiveBot.botType,
                                    Status: "Stopped",
                                    type: "Active",
                                    checkBot: true
                                }
                            })
                            setConfirmActiveBot(false)
                        }}
                        dialogTitle="The action requires confirmation"
                        submitBtnColor="warning"
                        submitBtnText="DeActive"
                        reserveBtn
                        position="center"
                    >
                        <p style={{ textAlign: "center" }}>Bot have api - Do you want to deactive?</p>
                    </DialogCustom >
                )
            }
        </div >

    );
}

export default memo(Bot);