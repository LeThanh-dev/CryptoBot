import { Button, CircularProgress, Dialog } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import styles from "./DialogCustom.module.scss"
import { memo } from "react";
import clsx from "clsx";
import { LoadingButton } from "@mui/lab";



function DialogCustom({
    open = false,
    onSubmit,
    onClose,
    reserveBtn = false,
    dialogTitle = "",
    submitBtnColor = "primary",
    submitBtnText = "Submit",
    hideCloseBtn = false,
    hideActionBtn = false,
    maxWidth = "xs",
    position = "top",
    backdrop = false,
    loading = false,
    addMore = false,
    addMoreFuntion,
    children
}, ref) {

    const mobileWidth = window.innerWidth <= 740
    return (
        <Dialog
            fullWidth
            maxWidth={maxWidth}
            open={open}
            onClose={(event, reason) => {
                if (reason !== 'backdropClick') {
                    onClose()
                }
                else {
                    backdrop && onClose()
                }
            }}
            sx={{
                ".MuiDialog-container": {
                    alignItems: position === "top" ? "flex-start" : "center"
                },
                ".MuiDialog-paper": {
                    maxWidth: mobileWidth ? "100%" : undefined,
                    maxHeight: mobileWidth ? "calc(100% - 24px)" : undefined,
                    width: mobileWidth ? "100%" : undefined,
                    margin: mobileWidth ? "12px" : undefined,
                }
            }}
            modal={false}
        >
            <div className={styles.dialog}>
                <div className={styles.dialogTitle}>
                    <p className={styles.title}>{dialogTitle}</p>
                    <CloseIcon
                        style={{ cursor: "pointer" }}
                        onClick={onClose}
                    />
                </div>
                <div className={styles.dialogContent}>
                    {children}

                </div>
                {!hideActionBtn && <div className={clsx(styles.btnActive, reserveBtn && styles.reserveBtn)}>
                    {!hideCloseBtn && <Button
                        variant="contained"
                        color="inherit"
                        style={{
                            margin: reserveBtn ? "0 0 0 12px" : "0 12px 0 0"
                        }}
                        onClick={onClose}
                    >Cancel</Button>}
                    {addMore && <Button
                        variant="contained"
                        color="info"
                        style={{
                            marginRight: "12px"
                        }}
                        onClick={addMoreFuntion}
                    >Add More</Button>}
                    {/* {
                        !loading ?
                            <Button variant="contained" color={submitBtnColor} onClick={() => {
                                onSubmit()
                                // onClose()
                            }}>{submitBtnText}</Button>
                            :
                            <CircularProgress style={{
                                width: "32px",
                                height: "32px",
                                color: "#2e75db",
                                marginRight:"12px"
                            }} color='inherit' />
                    } */}

                    <LoadingButton
                        variant="contained"
                        size="medium"
                        loading={loading}
                        color={submitBtnColor}
                        onClick={onSubmit}
                        sx={{
                            ".MuiLoadingButton-label": {

                                fontSize: "14px !important",
                            }
                        }}

                    >
                        {submitBtnText}
                    </LoadingButton>
                </div>}
            </div>
        </Dialog>
    );
}

export default memo(DialogCustom);