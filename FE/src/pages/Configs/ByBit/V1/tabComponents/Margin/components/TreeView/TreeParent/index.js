import StarBorderIcon from '@mui/icons-material/StarBorder';
import StarIcon from '@mui/icons-material/Star';
import AddIcon from '@mui/icons-material/Add';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Checkbox, Table, TableHead, TableRow, TableCell, TableBody, Popover } from "@mui/material";
import clsx from "clsx";
import styles from "./TreeParent.module.scss"
import TreeChild from '../TreeChild';
import { memo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { handleCheckAllCheckBox } from '../../../../../../../../../functions';
import { addMessageToast } from '../../../../../../../../../store/slices/Toast';
import { updateStrategiesMultipleSpot, addToBookmarkSpot, removeToBookmarkSpot } from '../../../../../../../../../services/Configs/ByBIt/V1/marginService';

function TreeParent({
    treeData,
    dataCheckTreeSelectedRef,
    setOpenCreateStrategy,
    setDataCheckTree,
    dataCheckTreeDefaultRef
}) {

    const userData = useSelector(state => state.userDataSlice.userData)


    const dispatch = useDispatch()

    const [openSettingTreeNode, setOpenSettingTreeNode] = useState(false);
    const [openDeleteTreeSymbolGroup, setOpenDeleteTreeSymbolGroup] = useState(false);


    const closeDeleteDialog = () => {
        setOpenDeleteTreeSymbolGroup(false)

    }
    const handleUpdateDataAfterSuccess = (IsActive) => {
        handleCheckAllCheckBox(false)
        setDataCheckTree(dataCheckTree => dataCheckTree.map(data => {
            if (data._id === treeData._id) {
                return {
                    ...treeData,
                    children: treeData.children.map(treeItem => {
                        return {
                            ...treeItem,
                            IsActive
                        }
                    })
                }
            }
            return data
        }))
        dataCheckTreeDefaultRef.current = dataCheckTreeDefaultRef.current.map(data => {
            if (data._id === treeData._id) {
                return {
                    ...treeData,
                    children: treeData.children.map(treeItem => {
                        return {
                            ...treeItem,
                            IsActive
                        }
                    })
                }
            }
            return data
        })
        setOpenSettingTreeNode("")
    }

    const handleUnActiveAllTreeItem = async () => {
        handleCheckAllCheckBox(false)

        try {
            const newData = treeData.children.map((dataCheckTreeItem) => {
                const { parentID, ...oldData } = dataCheckTreeItem
                return (
                    {
                        id: dataCheckTreeItem._id,
                        parentID: treeData._id,
                        UpdatedFields: {
                            ...oldData,
                            IsActive: false
                        }

                    }
                )
            })

            const res = await updateStrategiesMultipleSpot(newData)

            const { status, message } = res.data

            dispatch(addMessageToast({
                status: status,
                message: message,
            }))
            if (status === 200) {
                handleUpdateDataAfterSuccess(false)
            }

        }
        catch (err) {
            dispatch(addMessageToast({
                status: 500,
                message: "Active All Error",
            }))
        }
    }
    const handleActiveAllTreeItem = async () => {

        try {
            const newData = treeData.children.map((dataCheckTreeItem) => {
                const { parentID, ...oldData } = dataCheckTreeItem
                return (
                    {
                        id: dataCheckTreeItem._id,
                        parentID: treeData._id,
                        UpdatedFields: {
                            ...oldData,
                            IsActive: true
                        }

                    }
                )
            })

            const res = await updateStrategiesMultipleSpot(newData)

            const { status, message } = res.data

            dispatch(addMessageToast({
                status: status,
                message: message,
            }))
            if (status === 200) {
                handleUpdateDataAfterSuccess(true)

            }

        }
        catch (err) {
            dispatch(addMessageToast({
                status: 500,
                message: "Active All Error",
            }))
        }
    }

    // const handleDeleteStrategies = async () => {
    //     try {
    //         const res = await deleteStrategiesSpot(treeData._id,)
    //         const { status, message } = res.data

    //         if (status === 200) {
    //             // handleUpdateDataAfterSuccess(newData)
    //             if (status === 200) {
    //                 setDataCheckTree(dataCheckTree => dataCheckTree.filter(data => data._id !== treeData._id))
    //                 dataCheckTreeDefaultRef.current = dataCheckTreeDefaultRef.current.filter(data => data._id !== treeData._id)
    //                 handleCheckAllCheckBox(false)
    //             }

    //         }

    //         dispatch(addMessageToast({
    //             status: status,
    //             message: message,
    //         }))
    //     }
    //     catch (err) {
    //         dispatch(addMessageToast({
    //             status: 500,
    //             message: "Delete Error",
    //         }))
    //     }
    //     closeDeleteDialog()
    // }
    const handleAddToBookmark = async () => {
        try {
            const res = await addToBookmarkSpot({ symbolID: treeData._id })
            const { status, message } = res.data

            dispatch(addMessageToast({
                status: status,
                message: message,
            }))

            if (status === 200) {

                dataCheckTreeDefaultRef.current = dataCheckTreeDefaultRef.current.map(data => {
                    if (data._id === treeData._id) {
                        return {
                            ...treeData,
                            bookmarkList: treeData.bookmarkList.concat(userData._id)
                        }
                    }
                    return data
                })
            }
        }
        catch (err) {
            dispatch(addMessageToast({
                status: 500,
                message: "Add Bookmark Error",
            }))
        }
        closeDeleteDialog()
    }
    const handleRemoveToBookmark = async () => {
        try {
            const res = await removeToBookmarkSpot({ symbolID: treeData._id })
            const { status, message } = res.data

            dispatch(addMessageToast({
                status: status,
                message: message,
            }))

            if (status === 200) {

                dataCheckTreeDefaultRef.current = dataCheckTreeDefaultRef.current.map(data => {
                    if (data._id === treeData._id) {
                        return {
                            ...treeData,
                            bookmarkList: treeData.bookmarkList.filter(item => item !== userData._id)
                        }
                    }
                    return data
                })
            }
        }
        catch (err) {
            dispatch(addMessageToast({
                status: 500,
                message: "Remove Bookmark Error",
            }))
        }
        closeDeleteDialog()
    }

    return (
        <div className={styles.treeParent}  >
            <div style={{
                display: "flex",
                alignItems: "center"
            }}
            >

                <input
                    className={clsx("nodeParentSelected", styles.checkboxStyle)}
                    type="checkbox"
                    onClick={e => {
                        const check = e.target.checked
                        e.currentTarget.parentElement.parentElement.querySelectorAll(`.nodeItemSelected-${treeData._id}`)?.forEach(item => {
                            item.checked = !check
                            item.click()
                        })
                    }}
                />
                <div
                    style={{
                        display: "contents"
                    }}
                    onClick={e => {
                        e.currentTarget.parentElement.parentElement.classList.toggle(styles.showNoteContent)
                    }}
                >
                    <KeyboardArrowDownIcon
                        className={clsx(styles.icon, styles.iconArrow, styles.iconArrowDown)}
                    />
                    <KeyboardArrowUpIcon
                        className={clsx(styles.icon, styles.iconArrow, styles.iconArrowUp)}
                    />
                </div>
                <MoreVertIcon
                    className={clsx(styles.icon)}
                    onClick={e => {
                        setOpenSettingTreeNode({
                            element: e.currentTarget,
                            symbolValueInput: {
                                name: treeData.label,
                                value: treeData.value,
                            }
                        })
                    }}
                />
                <Checkbox
                    defaultChecked={treeData.bookmarkList?.includes(userData._id)}
                    style={{
                        padding: " 0 3px",
                    }}
                    sx={{
                        color: "#b5b5b5",
                        '&.Mui-checked': {
                            color: "var(--yellowColor)",
                        },
                    }}
                    onClick={e => {
                        e.target.checked ? handleAddToBookmark() : handleRemoveToBookmark()
                    }}
                    icon={<StarBorderIcon />}
                    checkedIcon={<StarIcon />}
                />
                <p className={styles.label}>
                    {treeData.label.split("USDT")[0]}
                    <span style={{
                        fontWeight: "600",
                        marginLeft: "3px"
                    }}>( {treeData.children?.filter(item => item.IsActive).length} / {treeData.children.length} )</span>
                </p>
            </div>
            {
                treeData.children?.length > 0 && (
                    <div className={styles.tableDataContainer}>
                        <Table className={styles.tableData}>
                            <TableHead >
                                <TableRow>
                                    <TableCell className={styles.tableHeadCell} style={{
                                        minWidth: "fit-content"
                                    }}></TableCell>
                                    <TableCell className={styles.tableHeadCell} style={
                                        {
                                            padding: "3px 10px !important",
                                            textAlign: "left"
                                        }
                                    }>Action</TableCell>
                                    <TableCell className={styles.tableHeadCell}>Bot</TableCell>
                                    <TableCell className={styles.tableHeadCell}>Position</TableCell>
                                    <TableCell className={styles.tableHeadCell}>Amount ($)</TableCell>
                                    <TableCell className={styles.tableHeadCell}>OC (%)</TableCell>
                                    <TableCell className={styles.tableHeadCell}>Auto amount	(%)</TableCell>
                                    <TableCell className={styles.tableHeadCell}>Expire (min)</TableCell>
                                    <TableCell className={styles.tableHeadCell}>Limit ($)</TableCell>
                                    <TableCell className={styles.tableHeadCell}>Auto OC (%)</TableCell>
                                    <TableCell className={styles.tableHeadCell}>Amount exp (min)</TableCell>
                                    <TableCell className={styles.tableHeadCell}>Adaptive</TableCell>
                                    <TableCell className={styles.tableHeadCell}>Reverse</TableCell>
                                    <TableCell className={styles.tableHeadCell}>Volume24h</TableCell>
                                </TableRow>
                            </TableHead>
                            {
                                <TableBody>
                                    {
                                        treeData.children.map(treeNode => (
                                            <TreeChild
                                                treeData={treeData}
                                                treeNode={treeNode}
                                                dataCheckTreeSelectedRef={dataCheckTreeSelectedRef}
                                                setDataCheckTree={setDataCheckTree}
                                                dataCheckTreeDefaultRef={dataCheckTreeDefaultRef}
                                                key={treeNode.value}
                                            />
                                        ))
                                    }
                                </TableBody>
                            }
                        </Table>
                    </div>
                )
            }
            {/* {openDeleteTreeSymbolGroup &&

                <DialogCustom
                    dialogTitle='The action requires confirmation'
                    reserveBtn
                    open={openDeleteTreeSymbolGroup}
                    onClose={closeDeleteDialog}
                    submitBtnText='Confirm'
                    position='center'
                    submitBtnColor='error'
                    backdrop
                    onSubmit={handleDeleteStrategies}
                >
                    <p>Are you remove this symbol?</p>
                </DialogCustom>

            } */}
            <Popover
                open={openSettingTreeNode.element}
                anchorEl={openSettingTreeNode.element}
                onClose={() => {
                    setOpenSettingTreeNode("")
                }}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}

            >
                <div className={styles.settingNode}>
                    <div
                        className={styles.settingNodeItem}
                        onClick={() => {
                            setOpenCreateStrategy(openCreateStrategy => ({
                                ...openCreateStrategy,
                                isOpen: true,
                                symbolValueInput: openSettingTreeNode.symbolValueInput,
                            }))
                        }}
                    >
                        <AddIcon className={styles.settingNodeItemIcon} />
                        <span className={styles.settingNodeItemText}>Add</span>
                    </div>
                    {/* <div className={styles.settingNodeItem}
                        onClick={() => {
                            setOpenDeleteTreeSymbolGroup(true)
                        }}>
                        <DeleteOutlineIcon
                            className={styles.settingNodeItemIcon}
                        />
                        <span className={styles.settingNodeItemText}>Delete</span>
                    </div> */}
                    <div
                        className={styles.settingNodeItem}
                        onClick={handleUnActiveAllTreeItem}
                    >
                        <PowerSettingsNewIcon className={styles.settingNodeItemIcon} />
                        <span className={styles.settingNodeItemText}>Off</span>
                    </div>
                    <div
                        className={styles.settingNodeItem}
                        onClick={handleActiveAllTreeItem}
                    >
                        <PlayCircleOutlineIcon className={styles.settingNodeItemIcon} />
                        <span className={styles.settingNodeItemText}>On</span>
                    </div>
                </div>
            </Popover>
        </div>
    );
}

export default memo(TreeParent);