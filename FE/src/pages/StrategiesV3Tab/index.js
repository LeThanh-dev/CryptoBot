import { Tabs, Tab } from "@mui/material";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";


function StrategiesV3Tab() {

    const location = useLocation()

    const navigate = useNavigate()

    const handleChangeTab = (e, newValue) => {
        navigate(`/${newValue}`)
    }
    const userData = useSelector(state => state.userDataSlice.userData)

    const tabList = [
        {
            label: "Config",
            value: "StrategiesV3",
        },
        {
            label: "Scanner",
            value: "ScannerV3",
        }
    ]
    return (
        <div>

            <Tabs value={location.pathname.split("/")[1]} onChange={handleChangeTab}>
                {
                    tabList.map(item => {
                        const value = item.value
                        return (
                            userData.roleList.includes(value) && <Tab label={item.label} value={value}></Tab>
                        )
                    })
                }
            </Tabs>
        </div>
    );
}

export default StrategiesV3Tab;