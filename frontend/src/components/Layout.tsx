import {Outlet} from "react-router";

function Layout() {
    return (
        <div className={'flex flex-col items-center justify-center min-h-svh bg-white'}>
            <Outlet></Outlet>
        </div>
    );
}

export default Layout;