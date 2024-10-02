import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Table, TableHead, TableRow, TableCell, TableBody } from "@mui/material";
import clsx from "clsx";
import styles from "./TreeParent.module.scss"
import TreeChild from '../TreeChild';
import { memo, useState } from 'react';
import { addToBookmark, removeToBookmark, updateStrategiesMultiple } from '../../../../../../../services/dataCoinByBitService';
import { useDispatch, useSelector } from 'react-redux';
import { addMessageToast } from '../../../../../../../store/slices/Toast';
import { handleCheckAllCheckBox } from '../../../../../../../functions';
function TreeParent({
    treeData,
    dataCheckTreeSelectedSymbolRef,
    dataCheckTreeSelectedRef,
    setOpenCreateStrategy,
    setDataCheckTree,
    dataCheckTreeDefaultRef
}) {


    const userData = useSelector(state => state.userDataSlice.userData)


    const dispatch = useDispatch()

    const [openSettingTreeNode, setOpenSettingTreeNode] = useState(false);
    // const [openDeleteTreeSymbolGroup, setOpenDeleteTreeSymbolGroup] = useState(false);



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

            const res = await updateStrategiesMultiple(newData)

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

            const res = await updateStrategiesMultiple(newData)

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
    //         const treeDataID = treeData._id
    //         const strategiesListID = treeData.children.map(dataCheckTreeItem=>dataCheckTreeItem._id)
    //         const res = await deleteStrategies(treeDataID, strategiesListID)
    //         const { status, message } = res.data

    //         if (status === 200) {
    //             // handleUpdateDataAfterSuccess(newData)
    //             if (status === 200) {
    //                 dataCheckTreeDefaultRef.current = dataCheckTreeDefaultRef.current.map(data => {
    //                     if (data._id == treeDataID) {
    //                         return {
    //                             ...data,
    //                             children: data.children.filter(treeItem =>!strategiesListID.includes(treeItem._id) )
    //                         }
    //                     }
    //                     return data
    //                 })
    //                 setDataCheckTree(dataCheckTree =>  dataCheckTree.map(data => {
    //                     if (data._id == treeDataID) {
    //                         return {
    //                             ...treeData,
    //                             children: treeData.children.filter(treeItem =>!strategiesListID.includes(treeItem._id) )
    //                         }
    //                     }
    //                     return data
    //                 }))
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
    // }


    const handleAddToBookmark = async () => {
        try {
            const res = await addToBookmark({ symbolID: treeData._id })
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
    }
    const handleRemoveToBookmark = async () => {
        try {
            const res = await removeToBookmark({ symbolID: treeData._id })
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
                        if (check) {
                            dataCheckTreeSelectedSymbolRef.current[treeData.value] = {
                                name: treeData.value,
                                value: treeData.value
                            }
                        }
                        else {
                            delete dataCheckTreeSelectedSymbolRef.current[treeData.value]
                        }

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
                                    <TableCell className={styles.tableHeadCell}>Amount</TableCell>
                                    <TableCell className={styles.tableHeadCell}>OC</TableCell>
                                    <TableCell className={styles.tableHeadCell}>Candle</TableCell>
                                    <TableCell className={styles.tableHeadCell}>TP</TableCell>
                                    <TableCell className={styles.tableHeadCell}>Reduce</TableCell>
                                    <TableCell className={styles.tableHeadCell}>Extended</TableCell>
                                    <TableCell className={styles.tableHeadCell}>Ignore</TableCell>
                                    <TableCell className={styles.tableHeadCell}>EntryTrailing</TableCell>
                                    <TableCell className={styles.tableHeadCell}>StopLose</TableCell>
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
            {/* {
                openDeleteTreeSymbolGroup &&
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
          
        </div>
    );
}

export default memo(TreeParent);