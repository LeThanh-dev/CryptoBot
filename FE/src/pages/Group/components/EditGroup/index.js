import { Button, FormControl, FormLabel, TextField } from "@mui/material";
import styles from "./AddBot.module.scss"
import { useForm } from "react-hook-form";
import { memo, useState } from "react";
import DialogCustom from "../../../../components/DialogCustom";
import { useDispatch } from "react-redux";
import { addMessageToast } from "../../../../store/slices/Toast";
import AddMember from "../AddMember";
import { updateGroup } from "../../../../services/groupService";

function EditGroup({
    open,
    onClose,
    dataInput
}, ref) {


    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm();

    const dispatch = useDispatch();

    const [openAddMember, setOpenAddMember] = useState({
        isOpen: false,
        dataChange: dataInput.member
    });


    const handleSubmitEditGroup = async formData => {
        let dataChange = false

        try {
            const res = await updateGroup({
                groupID: dataInput.groupID,
                data: {
                    ...formData,
                    member: openAddMember.dataChange,
                    memberRemove: dataInput.member.filter(memberItem => !openAddMember.dataChange.find(item=>item.userID === memberItem.userID))
                }
            })

            const { message, status } = res.data

            dispatch(addMessageToast({
                status: status,
                message: message,
            }))
            status === 200 && (dataChange = true)
        }
        catch (err) {
            dispatch(addMessageToast({
                status: 500,
                message: "Update Group Error",
            }))
        }
        closeDialog(dataChange)
    }

    const closeDialog = (dataChange = false) => {
        onClose({
            isOpen: false,
            dataChange
        })
        reset()
    }
    return (
        <DialogCustom
            open={true}
            onClose={() => { closeDialog() }}
            onSubmit={handleSubmit(handleSubmitEditGroup)}
            dialogTitle="Edit Group"
        >

            <form className={styles.dialogForm}>
                <FormControl
                    className={styles.formControl}
                    onClick={() => {
                        setOpenAddMember({
                            ...openAddMember,
                            isOpen: true
                        })
                    }}
                >
                    <Button >Add Member</Button>

                </FormControl>
                {openAddMember.dataChange.length > 0 && <p className={styles.memberQuantity}>{openAddMember.dataChange.length} members selected</p>}

                <FormControl className={styles.formControl}>
                    <FormLabel className={styles.label}>Name</FormLabel>
                    <TextField
                        defaultValue={dataInput.name}
                        {...register("name", { required: true, pattern: /\S/ })}

                        size="small"
                    />
                    {errors.name && <p className="formControlErrorLabel">The Group Name Required.</p>}

                </FormControl>


                <FormControl className={styles.formControl}>
                </FormControl>
                <FormControl className={styles.formControl}>
                    <FormLabel className={styles.label}>Note</FormLabel>
                    <TextField
                        placeholder="Note"
                        multiline
                        defaultValue={dataInput.note}
                        rows={3}
                        {...register("note")}
                        size="small"
                    />
                </FormControl>

            </form>

            {
                openAddMember.isOpen && (
                    <AddMember
                        onClose={(data) => setOpenAddMember(data)}
                        userListSelected={openAddMember.dataChange}
                        editState
                    />
                )
            }
        </DialogCustom >
    );
}

export default memo(EditGroup)