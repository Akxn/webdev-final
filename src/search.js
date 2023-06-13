import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Search({
  setTypeSelectedArray,
  typeSelectedArray = [],
  setSearchQuery,
  searchQuery = '',
}) {
  const [types, setTypes] = useState([]);

  useEffect(() => {
    async function fetchTypes() {
      const response = await axios.get(
        'https://raw.githubusercontent.com/fanzeyi/pokemon.json/master/types.json',
      );
      setTypes(response.data.map((type) => type.english));
    }
    fetchTypes();
  }, []);

  const handleClick = (event) => {
    const { value, checked } = event.target;

    if (checked) {
      setTypeSelectedArray((typeSelectedArray) => [
        ...typeSelectedArray,
        value,
      ]);
    } else {
      setTypeSelectedArray((typeSelectedArray) =>
        typeSelectedArray.filter((type) => type !== value),
      );
    }
  };

  return (
    <div className="search-container">
      <input
        className="search-input"
        type="text"
        placeholder="Search Pokemon..."
        value={searchQuery}
        onChange={(event) =>
          setSearchQuery(event.target.value.trim().toLowerCase())
        }
      />
      <div className="search-checkbox">
        {types.map((type) => (
          <div key={type}>
            <input
              type="checkbox"
              value={type}
              id={type}
              onChange={handleClick}
            />
            <label className="checkbox-label" htmlFor={type}>
              {type}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Search;
