import { Button, FormControl, FormLabel, TextField } from "@mui/material";
import styles from "./AddBot.module.scss"
import { useForm } from "react-hook-form";
import { memo, useState } from "react";
import DialogCustom from "../../../../components/DialogCustom";
import { useDispatch } from "react-redux";
import { addMessageToast } from "../../../../store/slices/Toast";
import { updateGroup } from "../../../../services/groupService";
import { updateBotType } from "../../../../services/botTypeService";

function EditBotType({
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

        try {
            const res = await updateBotType({
                botTypeID: dataInput.botTypeID,
                data: {
                    ...formData,
                    name: formData.name.trim()
                }
            })

            const { message, status } = res.data

            dispatch(addMessageToast({
                status: status,
                message: message,
            }))
        }
        catch (err) {
            dispatch(addMessageToast({
                status: 500,
                message: "Update Group Error",
            }))
        }
        closeDialog()
    }

    const closeDialog = () => {
        onClose({
            isOpen: false,
            dataChange: true
        })
        reset()
    }

    return (
        <DialogCustom
            open={true}
            onClose={closeDialog}
            onSubmit={handleSubmit(handleSubmitEditGroup)}
            dialogTitle="Edit BotType"
        >

            <form className={styles.dialogForm}>

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


        </DialogCustom >
    );
}

export default memo(EditBotType)