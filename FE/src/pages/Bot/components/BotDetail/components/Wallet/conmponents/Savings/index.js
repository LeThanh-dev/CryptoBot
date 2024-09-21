import { FormControl, FormLabel, MenuItem, Select, TextField } from "@mui/material";
import styles from "./Transfer.module.scss"
import { useForm } from "react-hook-form";
import { memo } from "react";
import DialogCustom from "../../../../../../../../components/DialogCustom";

const botTypeList = [
    {
        name: "Forbid",
        value: "Forbid"
    },
    {
        name: "Frozen",
        value: "Frozen"
    }
]

function Savings({
    open,
    onClose
}, ref) {

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm();

    const handleSubmitSavings = data => {
    }

    const closeDialog = ()=>{
        onClose()
        reset()
    }

    return (
        <DialogCustom
            open={open}
            onClose={closeDialog}
            onSubmit={handleSubmit(handleSubmitSavings)}
            dialogTitle="Savings"
        >

            <form className={styles.dialogForm}>
                
                <FormControl className={styles.formControl}>
                    <FormLabel className={styles.label}>Amount</FormLabel>
                    <TextField
                        {...register("Amount", { required: true })}
                         
                        size="small"
                    />
                    {errors.Amount?.type === 'required' && <p className="formControlErrorLabel">The Amount Required.</p>}

                </FormControl>


            </form>
        </DialogCustom >
    );
}

export default memo(Savings);