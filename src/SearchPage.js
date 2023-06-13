import { useState, useCallback } from 'react';
import Search from './search';
import Pagination from './Pagination';
import FilteredPokemons from './FilteredPokemon';
import Logout from './Logout';

function useSearchPage(props) {
    const { user, accessToken, refreshToken, setAccessToken, setRefreshToken } = props;

    const [typeSelectedArray, setTypeSelectedArray] = useState([]);
    const [searchQuery, setSearchQuery] = useState([]);
    const [pokemons, setPokemons] = useState([]);
    const [filteredPokemons, setFilteredPokemons] = useState([]);
    const [pageNumber, setPageNumber] = useState(1);
    const [count, setCount] = useState(0);

    const handleTypeSelectedArray = useCallback((array) => {
        setTypeSelectedArray(array);
    }, []);

    const handleSearchQuery = useCallback((query) => {
        setSearchQuery(query);
    }, []);

    const handlePageNumber = useCallback((number) => {
        setPageNumber(number);
    }, []);

    return {
        user,
        accessToken,
        refreshToken,
        setAccessToken,
        setRefreshToken,
        typeSelectedArray,
        searchQuery,
        pokemons,
        filteredPokemons,
        pageNumber,
        count,
        handleTypeSelectedArray,
        handleSearchQuery,
        handlePageNumber,
        setPokemons,
        setFilteredPokemons,
        setCount
    };
}

function SearchPage(props) {
    const {
        user,
        accessToken,
        refreshToken,
        setAccessToken,
        setRefreshToken,
        typeSelectedArray,
        searchQuery,
        pokemons,
        filteredPokemons,
        pageNumber,
        count,
        handleTypeSelectedArray,
        handleSearchQuery,
        handlePageNumber,
        setPokemons,
        setFilteredPokemons,
        setCount
    } = useSearchPage(props);

    return (
        <div>
            <h3 className='title-h3'>Welcome, {user.username}</h3>
            <Search
                setTypeSelectedArray={handleTypeSelectedArray}
                typeSelectedArray={typeSelectedArray}
                setSearchQuery={handleSearchQuery}
                searchQuery={searchQuery}
            />
            <Pagination
                pageNumber={pageNumber}
                setPageNumber={handlePageNumber}
                count={count}
            />
            <FilteredPokemons
                accessToken={accessToken}
                refreshToken={refreshToken}
                setAccessToken={setAccessToken}
                setRefreshToken={setRefreshToken}
                searchQuery={searchQuery}
                typeSelectedArray={typeSelectedArray}
                pokemons={pokemons}
                setPokemons={setPokemons}
                filteredPokemons={filteredPokemons}
                setFilteredPokemons={setFilteredPokemons}
                setCount={setCount}
                pageNumber={pageNumber}
            />
            <Logout {...props} />
        </div>
    );
}

export default SearchPage;
