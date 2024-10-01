import { Tabs, Tab } from "@mui/material";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";


function StrategiesMargin() {

    const userData = useSelector(state => state.userDataSlice.userData)
    const location = useLocation()

    const navigate = useNavigate()

    const handleChangeTab = (e, newValue) => {
        navigate(`/${newValue}`)
    }


    const tabList = [
        {
            label: "Spot",
            value: "Configs/ByBit/V1/Spot",
        },
        {
            label: "Margin",
            value: "Configs/ByBit/V1/Margin",
        },
        {
            label: "Scanner",
            value: "Configs/ByBit/V1/Scanner",
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

export default StrategiesMargin;