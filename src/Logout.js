import { useState, useEffect } from 'react';
import axios from 'axios';
import jwt_decode from "jwt-decode"
import { useNavigate } from "react-router-dom";

const axiosJWT = axios.create();

function Logout({ setUser, accessToken, refreshToken, setAccessToken, setRefreshToken }) {
    const [loading, setLoading] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        setupAxiosInterceptor();
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    function setupAxiosInterceptor() {
        axiosJWT.interceptors.request.use(
            async (config) => {
                let currentDate = new Date();
                const decodedToken = jwt_decode(accessToken);
                if (decodedToken.exp * 1000 < currentDate.getTime()) {
                    const newAccessToken = await refreshAccessToken();
                    config.headers['Authorization'] = newAccessToken;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );
    }

    async function refreshAccessToken() {
        try {
            const res = await axios.post("https://whateverbackend.onrender.com/requestNewAccessToken", {}, {
                headers: {
                    'Authorization': `Bearer ${accessToken} Refresh ${refreshToken}`
                }
            });
            console.log("refresh token requested");
            const authHeader = res.headers["authorization"];
            setAccessToken(authHeader.split(" ")[1]);
            setRefreshToken(authHeader.split(" ")[3]);
            return authHeader;
        } catch (err) {
            console.log(err);
        }
    }

    async function handleLogout() {
        setLoading(true);
        try {
            const res = await axiosJWT.post('https://whateverbackend.onrender.com/logout', {}, {
                headers: {
                    'Authorization': `Bearer ${accessToken} Refresh ${refreshToken}`
                }
            })
            if (res.status === 200) {
                setLoading(false);
                setAccessToken(null);
                setRefreshToken(null);
                setUser(null);
                navigate("/");
            } else {
                throw new Error("Logout failed");
            }
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    }

    function isScrollAtBottom() {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollPosition = window.scrollY;

        return scrollPosition + windowHeight >= documentHeight;
    }

    function handleScroll() {
        if (window.scrollY === 0 || isScrollAtBottom()) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    }

    return (
        isVisible && (
            <button className="logout-button" onClick={handleLogout} disabled={loading}>
                {loading ? 'Log off' : 'LOGOUT'}
            </button>
        )
    );
}

export default Logout;
