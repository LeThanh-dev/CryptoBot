import { Route, Routes } from 'react-router-dom';
import routeList from './router';
import './App.css';
import ToastCustom from './components/ToastCustom';

function App() {

  const handleRouteChild = (routeChildren) => {
    return routeChildren.map(item => (
      <Route path={item.path} element={item.element} key={item.path}>
        {
          item.children && handleRouteChild(item.children)
        }
      </Route>
    ))
  }


  return (
    <>
      <ToastCustom />
      <Routes>
        {
          routeList.map(item => (
            <Route path={item.path} element={item.element} key={item.path}>
              {
                item.children && handleRouteChild(item.children)
              }
            </Route>
          ))
        }
      </Routes>
    </>
  );
}

export default App;
