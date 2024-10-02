import { Tabs, Tab } from "@mui/material";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";


function ConfigV3Tab() {

    const location = useLocation()

    const navigate = useNavigate()

    const handleChangeTab = (e, newValue) => {
        navigate(`/${newValue}`)
    }
    const userData = useSelector(state => state.userDataSlice.userData)

    const tabList = [
        {
            label: "Config",
            value: "Configs/ByBit/V3/Config",
        },
        {
            label: "Scanner",
            value: "Configs/ByBit/V3/Scanner",
        }
    ]

    
    return (
            <Tabs value={location.pathname?.replace("/","")} onChange={handleChangeTab}>
                {
                    tabList.map(item => {
                        const value = item.value
                        return (
                            userData.roleList.includes(value) && <Tab label={item.label} value={value}></Tab>
                        )
                    })
                }
            </Tabs>
    );
}

export default ConfigV3Tab;