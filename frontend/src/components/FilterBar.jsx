import React from "react";
import "./FilterBar.css";

function FilterBar({ filters, setFilters }) {
  return (
    <div className="filter-bar">
      <div className="filter-left">
        <button className="filter-btn">⚡ Show Quick Filters</button>
        <button className="filter-btn">🎛️ All Filters</button>
      </div>

      <div className="filter-center">
        <span className="filter-label">Min Size</span>
        {[0, 100, 500, 1000, 5000, 10000].map((size) => (
          <button
            key={size}
            className={`size-btn ${filters.minSize === size ? "active" : ""}`}
            onClick={() => setFilters({ ...filters, minSize: size })}
          >
            {size === 0 ? "All" : `$${size >= 1000 ? `${size / 1000}K` : size}`}
          </button>
        ))}
      </div>

      <div className="filter-right">
        <div className="filter-toggle">
          <span className="filter-badge">New</span>
          <label className="toggle-label">
            <span>Hide Closed Markets</span>
            <input
              type="checkbox"
              checked={filters.hideClosedMarkets}
              onChange={(e) =>
                setFilters({ ...filters, hideClosedMarkets: e.target.checked })
              }
            />
            <span className="toggle-switch"></span>
          </label>
        </div>

        <div className="filter-toggle">
          <label className="toggle-label">
            <span>Hide Sold Positions</span>
            <input
              type="checkbox"
              checked={filters.hideSoldPositions}
              onChange={(e) =>
                setFilters({ ...filters, hideSoldPositions: e.target.checked })
              }
            />
            <span className="toggle-switch"></span>
          </label>
        </div>
      </div>
    </div>
  );
}

export default FilterBar;
