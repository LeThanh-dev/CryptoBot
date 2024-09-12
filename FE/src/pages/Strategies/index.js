import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import RestoreIcon from '@mui/icons-material/Restore';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import StarIcon from '@mui/icons-material/Star';
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { MenuItem, Select, TextField, Avatar, Checkbox, CircularProgress, FormLabel, FormControl, Tooltip, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import AddBreadcrumbs from '../../components/BreadcrumbsCutom';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useEffect, useMemo, useRef, useState } from 'react';
import styles from "./Strategies.module.scss"
import { getAllStrategies, getTotalFutureByBot, syncSymbol } from '../../services/dataCoinByBitService';
import { useDispatch, useSelector } from 'react-redux';
import { addMessageToast } from '../../store/slices/Toast';
import CreateStrategy from './components/CreateStrategy';
import EditMulTreeItem from './components/EditMulTreeItem';
import FilterDialog from './components/FilterDialog';
import TreeParent from './components/TreeView/TreeParent';
import { handleCheckAllCheckBox } from '../../functions';
import clsx from 'clsx';
import { getAllBotActiveByUserID } from '../../services/botService';
import { setTotalFuture } from '../../store/slices/TotalFuture';
import useDebounce from '../../hooks/useDebounce';
import { useNavigate } from 'react-router-dom';
import DialogCustom from '../../components/DialogCustom';

function Strategies() {

    const userData = useSelector(state => state.userDataSlice.userData)

    const StrategiesHistoryData = useSelector(state => state.StrategiesHistorySlice.dataList)

    const SCROLL_INDEX = 5
    const SCROLL_INDEX_FIRST = window.innerHeight / 30

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

    const positionSideList = [
        {
            name: "All",
            value: "All",
        },
        {
            name: "Long",
            value: "Long",
        },
        {
            name: "Short",
            value: "Short",
        },
    ]

    const candlestickList = [
        {
            name: "All",
            value: "All",
        },
        {
            name: "1m",
            value: "1m",
        },
        {
            name: "3m",
            value: "3m",
        },
        {
            name: "5m",
            value: "5m",
        },
        {
            name: "15m",
            value: "15m",
        },

    ]

    const bookmarkListDefault = [
        {
            name: "All",
            value: "All",
        },
        {
            name: "Yes",
            value: "Yes",
        },
        {
            name: "No",
            value: "No",
        },
    ]

    const navigate = useNavigate()

    const [openFilterDialog, setOpenFilterDialog] = useState(false);
    const [openEditTreeItemMultipleDialog, setOpenEditTreeItemMultipleDialog] = useState({
        isOpen: false,
        dataChange: false,
    });
    const [openCreateStrategy, setOpenCreateStrategy] = useState({
        isOpen: false,
        dataChange: false,
        symbolValueInput: ""
    });

    const [botList, setBotList] = useState([{
        name: "All",
        value: "All"
    },]);
    const [loadingDataCheckTree, setLoadingDataCheckTree] = useState(false);
    const [openListStrategiesHistory, setOpenListStrategiesHistory] = useState(false);

    const dataCheckTreeSelectedRef = useRef([])
    const dataCheckTreeSelectedSymbolRef = useRef({})
    const dataCheckTreeDefaultRef = useRef([])
    const [dataCheckTree, setDataCheckTree] = useState([]);
    const [loadingUploadSymbol, setLoadingUploadSymbol] = useState(false);
    const [dataTreeViewIndex, setDataTreeViewIndex] = useState(SCROLL_INDEX_FIRST);

    const [searchKey, setSearchKey] = useState("");
    // Filter

    const filterQuantityRef = useRef([])
    const botTypeSelectedRef = useRef("All")
    const botSelectedRef = useRef("All")
    const positionSideSelectedRef = useRef("All")
    const candlestickSelectedRef = useRef("All")
    const bookmarkSelectedRef = useRef("All")
    const selectAllRef = useRef(false)
    const bookmarkCheckRef = useRef({
        checked: false,
        indeterminate: false
    })

    const dispatch = useDispatch()


    const countTotalActive = useMemo(() => {
        let countActive = 0
        let totalItem = 0

        dataCheckTree.forEach(item => {
            countActive += item?.children?.filter(itemChild => itemChild.IsActive).length || 0
            totalItem += item?.children.length || 0
        })
        return {
            countActive,
            totalItem
        }
    }, [dataCheckTree])

    const handleGetAllBotByUserID = () => {

        getAllBotActiveByUserID(userData._id, "ByBitV3")
            .then(res => {
                const data = res.data.data;
                const newData = data?.map(item => (
                    {
                        name: item?.botName,
                        value: item?._id,
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
                handleGetAllStrategies(newData)

            })
            .catch(error => {
            }
            )
    }
    const handleGetTotalFutureByBot = async () => {

        try {
            const res = await getTotalFutureByBot(userData._id)
            const { status, message, data: resData } = res.data

            dispatch(setTotalFuture({
                total: resData || 0
            }))

            // if (status !== 200) {
            //     dispatch(addMessageToast({
            //         status,
            //         message
            //     }))
            // }

        }
        catch (err) {
            dispatch(addMessageToast({
                status: 500,
                message: "Get Total Future Error",
            }))
        }
    }

    const handleDataTree = (data) => {
        const newDataCheckTree = data.map(item => (
            {
                ...item,
                bookmarkList: item?.bookmarkList || [],
                children: item?.children.length > 0 ? item?.children.map(itemChild => (
                    {
                        ...itemChild,
                        value: `${item._id}-${itemChild._id}`,
                        volume24h: item?.volume24h,

                    }
                )) : item?.children
            }
        ))
        return newDataCheckTree
    }

    const handleGetAllStrategies = async (botListInput = botList.slice(1), filterStatus = false) => {

        setLoadingDataCheckTree(true)
        filterQuantityRef.current = []
        !filterStatus && resetAfterSuccess()

        dataCheckTreeSelectedRef.current = []
        openCreateStrategy.dataChange = false
        openEditTreeItemMultipleDialog.dataChange = false
        setDataTreeViewIndex(SCROLL_INDEX_FIRST)
        handleCheckAllCheckBox(false)

        try {
            window.scrollTo(0, 0)

            const res = await getAllStrategies(botListInput?.map(item => item?.value))
            const { status, message, data: resData } = res.data

            const newDataCheckTree = handleDataTree(resData)

            dataCheckTreeDefaultRef.current = newDataCheckTree

            !filterStatus ? setDataCheckTree(newDataCheckTree) : handleFilterAll()
        }
        catch (err) {
            dispatch(addMessageToast({
                status: 500,
                message: "Get All Strategies Error",
            }))
        }
        setLoadingDataCheckTree(false)
    }


    const handleSyncSymbol = async () => {
        if (!loadingUploadSymbol) {
            try {
                setLoadingUploadSymbol(true)
                const res = await syncSymbol()
                const { status, message, data: resData } = res.data

                dispatch(addMessageToast({
                    status: status,
                    message: message,
                }))

                handleGetAllStrategies()
                setLoadingUploadSymbol(false)
            }
            catch (err) {
                setLoadingUploadSymbol(false)
                dispatch(addMessageToast({
                    status: 500,
                    message: "Sync Error",
                }))
            }
        }
    }

    const handleFilterAll = () => {
        filterQuantityRef.current = []
        const listData = dataCheckTreeDefaultRef.current.reduce((acc, data) => {

            const filteredChildren = data?.children?.filter(item => {
                const checkBotType = botTypeSelectedRef.current === "All" || botTypeSelectedRef.current === item.botID.botType;
                const checkBot = botSelectedRef.current === "All" || botSelectedRef.current === item.botID._id;
                const checkPosition = positionSideSelectedRef.current === "All" || positionSideSelectedRef.current === item.PositionSide;
                const checkCandle = candlestickSelectedRef.current === "All" || candlestickSelectedRef.current === item.Candlestick;
                const checkSearch = searchDebounce === "" || data.label.toUpperCase().includes(searchDebounce.toUpperCase().trim());
                let checkBookmark = true
                if (bookmarkSelectedRef.current === "Yes") {
                    checkBookmark = data.bookmarkList?.includes(userData._id)
                }
                else if (bookmarkSelectedRef.current === "No") {
                    checkBookmark = !data.bookmarkList?.includes(userData._id)
                }

                return checkBotType && checkBot && checkPosition && checkCandle && checkSearch && checkBookmark;
            });

            if (filteredChildren.length > 0) {
                acc.push({ ...data, children: filteredChildren });
            }

            return acc;
        }, []);


        setDataCheckTree(listData)
        handleCheckAllCheckBox(false)

    }


    const handleScrollData = () => {
        const dataTreeViewIndexTemp = dataTreeViewIndex + SCROLL_INDEX

        const scrollY = window.scrollY;
        const scrollHeight = document.documentElement.scrollHeight;
        const windowHeight = window.innerHeight;
        const scrollPercentage = (scrollY / (scrollHeight - windowHeight)) * 100;

        if (dataTreeViewIndexTemp <= dataCheckTree.length) {
            const newIndex = dataTreeViewIndex + SCROLL_INDEX
            if (scrollPercentage >= 70) {
                setDataTreeViewIndex(newIndex)
            }

        }
        else {
            window.removeEventListener('scroll', handleScrollData)
            setDataTreeViewIndex(dataTreeViewIndex + SCROLL_INDEX)
        }

    }

    const resetAfterSuccess = () => {
        dataCheckTreeSelectedRef.current = []
        openCreateStrategy.dataChange = false
        openEditTreeItemMultipleDialog.dataChange = false
        setDataTreeViewIndex(SCROLL_INDEX_FIRST)
        handleCheckAllCheckBox(false)
        botTypeSelectedRef.current = "All"
        botSelectedRef.current = "All"
        positionSideSelectedRef.current = "All"
        candlestickSelectedRef.current = "All"
        bookmarkCheckRef.current = {
            checked: false,
            indeterminate: false
        }
        setSearchKey("")
    }


    const searchDebounce = useDebounce(searchKey)

    useEffect(() => {
        handleFilterAll()
    }, [searchDebounce]);

    useEffect(() => {
        if (userData.userName) {
            handleGetAllBotByUserID()
            handleGetTotalFutureByBot()
        }

    }, [userData.userName]);

    useEffect(() => {
        if (dataCheckTree.length > 0) {


            if (selectAllRef.current) {
                document.querySelectorAll(".nodeParentSelected")?.forEach((item, index) => {
                    if (dataTreeViewIndex - SCROLL_INDEX - 1 <= index && index < dataTreeViewIndex) {
                        item.checked = false
                        item.click()
                    }
                })
                // document.querySelectorAll(".nodeItemSelected")?.forEach((item, index) => {
                //     if (dataTreeViewIndex - SCROLL_INDEX <= index && index < dataTreeViewIndex) {
                //         // console.log('gasn child');
                //         item.checked = true
                //     }
                // })
            }
            if (dataTreeViewIndex < dataCheckTree.length) {

                document.addEventListener('scroll', handleScrollData);
            }
            return () => document.removeEventListener('scroll', handleScrollData);

        }
    }, [dataCheckTree, dataTreeViewIndex]);

    useEffect(() => {
        if (openCreateStrategy.dataChange || openEditTreeItemMultipleDialog.dataChange) {
            handleGetAllStrategies(undefined, true)
        }
    }, [openCreateStrategy.dataChange, openEditTreeItemMultipleDialog.dataChange]);


    return (
        <div className={styles.strategies}>
            <AddBreadcrumbs list={["Strategies"]} />

            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap-reverse",
                    alignItems: "flex-start",
                    borderBottom: "1px solid var(--borderColor)",
                    paddingBottom: "24px",
                }}>

                <div className={styles.strategiesFilter}>
                    <TextField
                        value={searchKey}
                        size="small"
                        placeholder="Search"
                        onChange={(e) => {
                            setSearchKey(e.target.value)
                        }}
                        className={styles.strategiesFilterInput}
                    />
                    <FilterListIcon
                        style={{
                            fontSize: "2rem",
                            margin: "0 12px",
                            cursor: "pointer"
                        }}
                        onClick={() => {
                            setOpenFilterDialog(true)
                        }}
                    />
                    {filterQuantityRef.current.length ? <p>{filterQuantityRef.current.length} filters</p> : ""}
                </div>

                <div className={styles.strategiesHeader}>
                    {/* <FormControl className={styles.strategiesHeaderItem}>
                        <FormLabel className={styles.formLabel}>Bot Type</FormLabel>
                        <Select
                            value={botTypeSelectedRef.current}
                            size="small"
                            onChange={e => {
                                const value = e.target.value;
                                botTypeSelectedRef.current = value
                                handleFilterAll()
                            }}
                        >
                            {
                                botTypeList.map(item => (
                                    <MenuItem value={item.value} key={item.value}>{item.name}</MenuItem>
                                ))
                            }
                        </Select>
                    </FormControl> */}

                    <FormControl className={styles.strategiesHeaderItem}>
                        <FormLabel className={styles.formLabel}>Bot</FormLabel>
                        <Select
                            value={botSelectedRef.current}
                            size="small"
                            onChange={e => {
                                const value = e.target.value;
                                botSelectedRef.current = value
                                handleFilterAll()
                            }}
                        >
                            {
                                botList.map(item => (
                                    <MenuItem value={item.value} key={item.value}>{item.name}</MenuItem>
                                ))
                            }
                        </Select>
                    </FormControl>

                    <FormControl className={styles.strategiesHeaderItem}>
                        <FormLabel className={styles.formLabel}>Position</FormLabel>
                        <Select
                            value={positionSideSelectedRef.current}
                            size="small"
                            onChange={e => {
                                const value = e.target.value;
                                positionSideSelectedRef.current = value
                                handleFilterAll()
                            }}
                        >
                            {
                                positionSideList.map(item => (
                                    <MenuItem value={item.value} key={item.value}>{item.name}</MenuItem>
                                ))
                            }
                        </Select>
                    </FormControl>

                    <FormControl className={styles.strategiesHeaderItem}>
                        <FormLabel className={styles.formLabel}>Candle</FormLabel>
                        <Select
                            value={candlestickSelectedRef.current}
                            size="small"
                            onChange={e => {
                                const value = e.target.value;
                                candlestickSelectedRef.current = value
                                handleFilterAll()
                            }}
                        >
                            {
                                candlestickList.map(item => (
                                    <MenuItem value={item.value} key={item.value}>{item.name}</MenuItem>
                                ))
                            }
                        </Select>
                    </FormControl>

                    <FormControl className={styles.strategiesHeaderItem}>
                        <FormLabel className={styles.formLabel}>Bookmark</FormLabel>
                        <Select
                            value={bookmarkSelectedRef.current}
                            size="small"
                            onChange={e => {
                                const value = e.target.value;
                                bookmarkSelectedRef.current = value
                                handleFilterAll()
                            }}
                        >
                            {
                                bookmarkListDefault.map(item => (
                                    <MenuItem value={item.value} key={item.value}>{item.name}</MenuItem>
                                ))
                            }
                        </Select>
                    </FormControl>

                </div>


            </div>
            <div className={styles.strategiesData}>

                {!loadingDataCheckTree && <p
                    style={{
                        display: "flex",
                        alignItems: "center",
                        lineHeight: "100%"
                    }}
                >
                    <input
                        className={clsx(styles.checkboxStyle, "treeNodeCheckAll")}
                        type="checkbox"
                        onClick={e => {
                            const check = e.target.checked

                            e.currentTarget.parentElement.parentElement.querySelectorAll(".nodeParentSelected")?.forEach(item => {
                                item.checked = check
                            })
                            e.currentTarget.parentElement.parentElement.querySelectorAll(".nodeItemSelected")?.forEach(child => {
                                child.checked = check
                            })

                            selectAllRef.current = check
                            if (check) {
                                dataCheckTree.forEach(data => {
                                    data.children?.forEach(child => {
                                        dataCheckTreeSelectedRef.current.push(JSON.stringify({
                                            ...child,
                                            parentID: data._id
                                        }))
                                    })
                                    dataCheckTreeSelectedSymbolRef.current[data.value] = {
                                        name: data.value,
                                        value: data.value
                                    }

                                })
                            }
                            else {
                                dataCheckTreeSelectedRef.current = []
                                dataCheckTreeSelectedSymbolRef.current = []
                            }
                        }}
                    />
                    <span style={{
                        fontWeight: "bold",
                        color: "black",
                        fontSize: "1.1rem"
                    }}>All</span> <span style={{
                        fontWeight: "600",
                        marginLeft: "6px"
                    }}>( {countTotalActive.countActive} / {countTotalActive.totalItem} )</span>

                    {/* <span style={{ margin: "0px 2px 3px 12px", opacity: ".6", fontSize: ".9rem" }}>|</span> */}
                    {/* <div className={styles.bookmarkAll}   >
                        <Checkbox
                            checked={bookmarkCheckRef.current.checked}
                            indeterminate={bookmarkCheckRef.current.indeterminate}
                            style={{
                                padding: " 0 6px",
                            }}
                            sx={{
                                color: "#b5b5b5",
                                '&.MuiCheckbox-indeterminate': {
                                    color: "var(--yellowColor)" ,
                                },
                                '&.Mui-checked': {
                                    color: "var(--yellowColor)",
                                },
                            }}
                            onClick={e => {
                                const value = e.target.checked;
                                const state = bookmarkCheckRef.current
                                if (state.indeterminate) {
                                    bookmarkCheckRef.current = { checked: true, indeterminate: false }
                                } else if (state.checked) {
                                    bookmarkCheckRef.current = { checked: false, indeterminate: false }
                                } else {
                                    bookmarkCheckRef.current = { checked: false, indeterminate: true }
                                }
                                handleFilterAll()
                            }}
                            icon={<StarBorderIcon />}
                            indeterminateIcon={<StarBorderIcon />}
                            checkedIcon={<StarIcon />}
                        />
                        <span>Bookmark</span>
                    </div> */}
                </p>}
                {
                    (dataCheckTree.length > 0 && !loadingDataCheckTree)
                        ?

                        dataCheckTree.slice(0, dataTreeViewIndex).map((treeData) => {
                            return (
                                <TreeParent
                                    dataCheckTreeSelectedSymbolRef={dataCheckTreeSelectedSymbolRef}
                                    dataCheckTreeSelectedRef={dataCheckTreeSelectedRef}
                                    treeData={treeData}
                                    setOpenCreateStrategy={setOpenCreateStrategy}
                                    setDataCheckTree={setDataCheckTree}
                                    dataCheckTreeDefaultRef={dataCheckTreeDefaultRef}
                                    key={treeData._id}
                                />
                            )
                        })

                        :
                        <p style={{
                            textAlign: "center",
                            margin: "16px 0 6px",
                            fontWeight: 500,
                            opacity: ".6"
                        }}>{loadingDataCheckTree ? "Loading..." : "No data"}</p>
                }
            </div>

            <div className={styles.strategiesBtnAction}>
                {StrategiesHistoryData?.length > 0 && <Tooltip title="Restore Config" placement="left">
                    <div className={styles.strategiesBtnActionItem}
                        onClick={() => {
                            setOpenListStrategiesHistory(true)
                        }}
                    >

                        <Avatar variant='circular' sx={{ bgcolor: "#0a58ca" }} >
                            <RestoreIcon />
                        </Avatar>
                    </div>
                </Tooltip>}
                <Tooltip title="Sync Symbol" placement="left">
                    <div className={styles.strategiesBtnActionItem}
                        onClick={handleSyncSymbol}
                    >

                        <Avatar variant='circular' sx={{ bgcolor: "#0a58ca" }} >

                            {
                                !loadingUploadSymbol ? <CloudSyncIcon /> : <CircularProgress style={{ width: "50%", height: "50%" }} color='inherit' />
                            }

                        </Avatar>
                    </div>
                </Tooltip>
                <Tooltip title="Edit" placement="left">

                    <div className={styles.strategiesBtnActionItem}
                        onClick={() => {
                            dataCheckTreeSelectedRef.current.length > 0 && setOpenEditTreeItemMultipleDialog({
                                dataChange: false,
                                isOpen: true
                            })
                        }}
                    >
                        <Avatar variant='circular' sx={{ bgcolor: "#0a58ca" }}>
                            <EditIcon />
                        </Avatar>
                    </div>
                </Tooltip>
                <Tooltip title="Add" placement="left">

                    <div
                        className={styles.strategiesBtnActionItem}
                        onClick={() => {
                            setOpenCreateStrategy(openCreateStrategy => ({
                                ...openCreateStrategy,
                                isOpen: true,
                                symbolValueInput: Object.values(dataCheckTreeSelectedSymbolRef.current)
                            }))
                        }}
                    >
                        <Avatar variant='circular' sx={{ bgcolor: "#0a58ca" }}>
                            <AddIcon
                            />
                        </Avatar>
                    </div>
                </Tooltip>

                {dataTreeViewIndex <= dataCheckTree.length && <KeyboardDoubleArrowDownIcon className={styles.scrollDownIcon} />}
            </div>


            {openFilterDialog &&

                <FilterDialog
                    filterQuantityRef={filterQuantityRef}
                    dataCheckTreeDefaultRef={dataCheckTreeDefaultRef}
                    setDataCheckTree={setDataCheckTree}
                    resetAfterSuccess={resetAfterSuccess}
                    onClose={() => {
                        setOpenFilterDialog(false)
                    }}
                    userID={userData._id}
                    botListInput={botList.slice(1)}
                />

            }

            {openCreateStrategy.isOpen &&

                <CreateStrategy
                    botListInput={botList.slice(1)}
                    onClose={(data) => {
                        setOpenCreateStrategy(data)
                    }}
                    symbolValueInput={openCreateStrategy.symbolValueInput}
                    dataCheckTreeDefaultRef={dataCheckTreeDefaultRef}
                />

            }


            {openEditTreeItemMultipleDialog.isOpen &&

                <EditMulTreeItem
                    // setDataCheckTree={setDataCheckTreeWithAll}
                    dataCheckTreeSelected={[...new Set(dataCheckTreeSelectedRef.current)]}
                    botListInput={botList.slice(1)}
                    onClose={(data) => {
                        setOpenEditTreeItemMultipleDialog(data)
                    }}
                    dataCheckTreeDefaultRef={dataCheckTreeDefaultRef}
                />

            }

            {openListStrategiesHistory && (
                <DialogCustom
                    open={true}
                    onClose={() => {
                        setOpenListStrategiesHistory(false)
                    }}
                    dialogTitle='History'
                    hideActionBtn
                    backdrop
                >

                    <Table className={styles.addMember}>
                        <TableHead>
                            <TableRow>
                                <TableCell style={{ fontWeight: "bold" }}>STT </TableCell>
                                <TableCell style={{ fontWeight: "bold" }}>Time Created </TableCell>
                                <TableCell style={{ fontWeight: "bold" }}>Preview </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {
                                StrategiesHistoryData.map((data, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            {index + 1}
                                        </TableCell>
                                        <TableCell>
                                            {data.timeCreated}
                                        </TableCell>
                                        <TableCell>
                                            <RemoveRedEyeIcon
                                                className={styles.icon}
                                                onClick={() => {
                                                    navigate("/StrategiesHistory", {
                                                        state: {
                                                            data: data.data,
                                                            timeCreated: data.timeCreated
                                                        }
                                                    })
                                                }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))
                            }
                        </TableBody>
                    </Table>

                </DialogCustom>
            )}

        </div >
    );
}

export default Strategies;