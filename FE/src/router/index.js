import Bot from "../pages/Bot"
import Strategies from "../pages/Strategies"
import Coin from "../pages/Coin"
import Order from "../pages/Order"
import MainLayout from "../layout/Mainlayout"
import NotFound from "../pages/NotFound"
import BotDetail from "../pages/Bot/components/BotDetail"
import MyProfile from "../pages/MyProfile"
import LoginPage from "../pages/LoginPage"
import Group from "../pages/Group"
import BotType from "../pages/BotType"
import User from "../pages/User"
import Dashboard from "../pages/Dashboard"
import StrategiesMargin from "../pages/StrategiesMargin"
import Spot from "../pages/StrategiesMargin/tabComponents/Spot"
import Margin from "../pages/StrategiesMargin/tabComponents/Margin"
import Scanner from "../pages/StrategiesMargin/tabComponents/Scanner"
import PositionAll from "../pages/Position"
import PositionV3 from "../pages/Position/Position-V3"
import PositionV1 from "../pages/Position/Position-V1"
import StrategiesHistory from "../pages/StrategiesHistory"


const routeList = [
    {
        path: "/",
        element: <MainLayout />,
        children: [
            {
                path: "",
                element: <Dashboard />,
            },
            {
                path: "Users",
                element: <User />,
            },
            {
                path: "Groups",
                element: <Group />,
            },
            {
                path: "Bots",
                element: <Bot />,
            },
            {
                path: "BotTypes",
                element: <BotType />,
            },
            {
                path: "Bots/Detail/:botID",
                element: <BotDetail />,
            },
            {
                path: "Strategies",
                element: <Strategies />,
            },
            {
                path: "StrategiesHistory",
                element: <StrategiesHistory />,
            },

            {
                path: "Spot",
                element:
                    <>
                        <StrategiesMargin />
                        <Spot />
                    </>
            },
            {
                path: "Margin",
                element:
                    <>
                        <StrategiesMargin />
                        <Margin />
                    </>
            },
            {
                path: "Scanner",
                element:
                    <>
                        <StrategiesMargin />
                        <Scanner />
                    </>
            },
            {
                path: "Coin",
                element: <Coin />,
            },
            {
                path: "PositionV3",
                element: <>
                    <PositionAll />
                    <PositionV3 />
                </>,
            },
            {
                path: "PositionV1",
                element: <>
                    <PositionAll />
                    <PositionV1 />
                </>,
            },
            {
                path: "Order",
                element: <Order />,
            },
            {
                path: "MyProfile",
                element: <MyProfile />,
            },

        ]
    },
    {
        path: "login",
        element: <LoginPage />,
    },
    {
        path: "*",
        element: <NotFound />,
    },

]

export default routeList