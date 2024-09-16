import PaymentsIcon from '@mui/icons-material/Payments';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PersonIcon from '@mui/icons-material/Person';
import GridViewIcon from '@mui/icons-material/GridView';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import LocalMallIcon from '@mui/icons-material/LocalMall';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import GroupsIcon from '@mui/icons-material/Groups';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import { NavLink } from "react-router-dom"
import clsx from "clsx";
import styles from "./SideBar.module.scss"


function SideBar({
    openSidebar,
    roleList
}, ref) {


    const linkList = [

        {
            linK: "/Users",
            name: "Users",
            icon: <PersonIcon className={styles.icon} />
        },
        {
            linK: "/Groups",
            name: "Groups",
            icon: <GroupsIcon className={styles.icon} />
        },
        {
            linK: "/Bots",
            name: "Bots",
            icon: <SmartToyIcon className={styles.icon} />
        },
        {
            linK: "/BotTypes",
            name: "BotTypes",
            icon: <PrecisionManufacturingIcon className={styles.icon} />
        },
        {
            linK: "/Spot",
            name: "Strategies V1",
            icon: <ShoppingCartIcon className={styles.icon} />
        },
        {
            linK: "/Strategies",
            name: "Strategies V3",
            icon: <LocalMallIcon className={styles.icon} />
        },
        {
            linK: "/Coin",
            name: "Coin",
            icon: <CurrencyExchangeIcon className={styles.icon} />
        },
        {
            linK: "/PositionV3",
            name: "Positions",
            icon: <ViewInArIcon className={styles.icon} />
        },
        {
            linK: "/InstrumentsInfo",
            name: "InstrumentsInfo",
            icon: <PaymentsIcon className={styles.icon} />
        },
        {
            linK: "/Order",
            name: "Order",
            icon: <CreditCardIcon className={styles.icon} />
        },
    ]
    
    return (
        <div
            className={styles.sidebar}
            style={{
                transform: openSidebar ? undefined : "translateX(-100%)"
            }}
            onClick={e => {
                e.preventDefault();
                e.stopPropagation()
            }}
        >

            <NavLink
                className={({ isActive }) => clsx(styles.sidebarItem, isActive ? styles.active : undefined)}
                to={"/"}
                key={"/"}
            >
                <GridViewIcon className={styles.icon} />
                <p className={styles.sidebarItemName}>Dashboard</p>
            </NavLink>
            {
                linkList.map(item => (

                    <div key={item.linK}>

                        {
                            roleList.includes(item.linK.replace("/","")) && <NavLink
                                className={({ isActive }) => clsx(styles.sidebarItem, isActive ? styles.active : undefined)}
                                to={item.linK}
                            >
                                {item.icon}
                                <p className={styles.sidebarItemName}>{item.name}</p>
                            </NavLink>
                        }
                    </div>
                ))
            }

        </div >
    );
}

export default SideBar;