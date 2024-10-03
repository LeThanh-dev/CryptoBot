import { Tab , Tabs} from "@mui/material";
import  { useState } from "react";
import AddBreadcrumbs from "../../../components/BreadcrumbsCutom";
import CoinContent from "./CoinContent";


function CoinOKX() {

    const [tabNumber, setTabNumber] = useState("Coin");

    const handleChangeTab = (e, newValue) => {
        setTabNumber(newValue)
    }

    const handleTabContent = () => {
        switch (tabNumber) {
            case "Coin":
                return <CoinContent />
          
        }
    }

    return (
        <div>
            <AddBreadcrumbs list={["Coin"]} />
            <Tabs value={tabNumber} onChange={handleChangeTab}>
                <Tab label="Coin" value="Coin" ></Tab>
            </Tabs>
            <div style={{
                marginTop: "24px"
            }}>
                {handleTabContent()}
            </div>
        </div>
    );
}

export default CoinOKX;