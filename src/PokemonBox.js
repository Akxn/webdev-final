import React from 'react';

function PokemonBox({ showModal, setShowModal, pokemon }) {
    if (!showModal) {
        return null;
    }

    return (
        <>
            <div className="modal-overlay">
                <div className="modal-content">
                    <button className="close-modal" onClick={() => setShowModal(false)}>
                        Close
                    </button>
                    <h2>#{pokemon.id} {pokemon.name.english}</h2>
                    <img
                        className="pokemon-image"
                        src={`https://raw.githubusercontent.com/fanzeyi/pokemon.json/master/images/${('00' + pokemon.id).slice(-3)}.png`}
                        alt={pokemon.name.english}
                    />
                    <div className="pokemon-type">
                        {pokemon.type.map((type, index) => (
                            <span key={index} className={type}>
                                {type}
                                {index < pokemon.type.length - 1 ? ' ' : ''}
                            </span>
                        ))}
                    </div>
                    <table>
                        <tbody>
                            {Object.entries(pokemon.base).map(([stat, value]) => (
                                <tr key={stat}>
                                    <td className="stat">{stat}</td>
                                    <td>{value}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                </div>
            </div>
        </>

    );
}

export default PokemonBox;