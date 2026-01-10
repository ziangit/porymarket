import React, { useState, useEffect } from "react";
import axios from "axios";
import "./SimulationDashboard.css";

const API_URL = "http://localhost:3001/api";

function SimulationDashboard() {
  const [simulations, setSimulations] = useState([]);

  useEffect(() => {
    fetchSimulations();
  }, []);

  const fetchSimulations = async () => {
    try {
      const response = await axios.get(`${API_URL}/simulation/open`);
      setSimulations(response.data.data || []);
    } catch (error) {
      console.error("Error fetching simulations:", error);
    }
  };

  return (
    <div className="simulation-container">
      <h2>💰 Active Simulations</h2>
      <div className="simulations-list">
        {simulations.length === 0 ? (
          <p className="no-simulations">No active simulations</p>
        ) : (
          simulations.map((sim) => (
            <div key={sim.id} className="simulation-card">
              <h3>{sim.market_question}</h3>
              <div className="sim-details">
                <div>Entry: ${sim.entry_price.toFixed(4)}</div>
                <div>Amount: ${sim.entry_amount.toFixed(2)}</div>
                <div>Outcome: {sim.outcome}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default SimulationDashboard;
