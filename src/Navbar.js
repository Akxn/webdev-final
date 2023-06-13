import { Link, Routes, Route } from "react-router-dom";
import { Suspense, useMemo } from "react";
import SearchPage from './SearchPage';
import Dashboard from './Dashboard';
import Logout from './Logout';

function Navbar(props) {
    const { user, setUser, accessToken, refreshToken, setAccessToken, setRefreshToken } = props;

    const routeProps = useMemo(() => {
        return {
            user,
            setUser,
            accessToken,
            refreshToken,
            setAccessToken,
            setRefreshToken
        }
    }, [user, setUser, accessToken, refreshToken, setAccessToken, setRefreshToken]);

    return (
        <>
            <nav>
                <h3>test ttest POKEDEX</h3>
                <ul>
                    <li>
                        <Link to="/search">SEARCH</Link>
                    </li>
                    {user?.role === 'admin' && (
                        <li>
                            <Link to="/dashboard">DASHBOARD</Link>
                        </li>
                    )}
                </ul>
                <Logout {...props} />
            </nav>

            <Suspense fallback={<div>Loading...</div>}>
                <Routes>
                    <Route path="/" element={<SearchPage {...routeProps} />} />
                    <Route path="/search" element={<SearchPage {...routeProps} />} />
                    <Route path="/dashboard" element={<Dashboard {...routeProps} />} />
                    <Route path="/logout" element={<Logout {...routeProps} />} />
                </Routes>
            </Suspense>
        </>
    );
}
export default Navbar;
