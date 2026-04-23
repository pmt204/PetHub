import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const GOONG_AUTOCOMPLETE_KEY = ''; 

const GoongAutocomplete = ({ onPlaceSelect, placeholder = "Nhập địa chỉ..." }) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.trim().length < 3) {
                setSuggestions([]);
                setShowSuggestions(false);
                return;
            }

            try {
                const res = await axios.get(`https://rsapi.goong.io/Place/AutoComplete`, {
                    params: {
                        api_key: GOONG_AUTOCOMPLETE_KEY,
                        input: query,
                        location: '10.762622,106.660172', 
                        radius: 50000
                    }
                });
                setSuggestions(res.data.predictions || []);
                setShowSuggestions(true);
            } catch (err) {
                console.error('Lỗi gợi ý:', err);
                setSuggestions([]);
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [query]);

    const handleSelect = (place) => {
        setQuery(place.description);
        setShowSuggestions(false);
        onPlaceSelect(place.description);
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (inputRef.current && !inputRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="position-relative" ref={inputRef}>
            <input
                type="text"
                className="form-control form-control-lg"
                placeholder={placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => query.trim().length >= 3 && setShowSuggestions(true)}
            />
            {showSuggestions && suggestions.length > 0 && (
                <ul className="list-group position-absolute top-100 start-0 end-0 mt-1 shadow-lg" style={{ zIndex: 9999, maxHeight: '250px', overflowY: 'auto' }}>
                    {suggestions.map((place, i) => (
                        <li
                            key={i}
                            className="list-group-item list-group-item-action py-3"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleSelect(place)}
                        >
                            <strong>{place.structured_formatting?.main_text || place.description.split(',')[0]}</strong>
                            <br />
                            <small className="text-muted">{place.description}</small>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default GoongAutocomplete;