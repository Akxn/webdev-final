import React, { useEffect } from 'react'

function Pagination({ pageNumber, setPageNumber, count }) {
    const pageSize = 12;
    const pagesCount = Math.ceil(count / pageSize);

    return (
        <div className='pagination'>
            {
                pageNumber > 1
                &&
                <button onClick={() => setPageNumber(pageNumber - 1)}>Prev</button>
            }
            {
                Array.from({ length: pagesCount }, (_, index) => index + 1).map(
                    (page, index) => {
                        return (
                            index >= pageNumber - 3
                            &&
                            index <= pageNumber + 2
                            &&
                            <button key={page}
                                onClick={() => setPageNumber(index + 1)}
                                className={index + 1 === pageNumber ? "active" : ""}>
                                {index + 1}
                            </button>
                        )
                    })
            }
            {
                pageNumber < pagesCount
                &&
                <button onClick={() => setPageNumber(pageNumber + 1)}>Next</button>
            }
        </div>
    )
}

export default Pagination