import { useState } from "react";

export default function RuleBuilder() {
  const [conditions, setConditions] = useState([
    { field: "Torque", operator: ">", value: "" }
  ]);

  const addCondition = () =>
    setConditions([...conditions, { field: "", operator: ">", value: "" }]);

  const updateCondition = (i, key, val) => {
    const updated = [...conditions];
    updated[i][key] = val;
    setConditions(updated);
  };

  const submitRule = () => {
    const payload = {
      ruleName: "HighTorqueRule",
      subsystem: "Rotating",
      conditions,
      outcome: "PipeSnapRisk",
    };
    console.log("Rule Payload:", payload);
  };

  return (
    <div className="bg-gray-900 p-6 rounded-lg text-white">
      <h2 className="text-xl font-semibold mb-4">Add Safety Rule</h2>

      {conditions.map((c, i) => (
        <div key={i} className="grid grid-cols-4 gap-2 mb-2">
          <select
            className="bg-gray-800 p-2 rounded"
            value={c.field}
            onChange={(e) => updateCondition(i, "field", e.target.value)}
          >
            <option>Torque</option>
            <option>Temperature</option>
            <option>Pressure</option>
            <option>Formation</option>
          </select>

          <select
            className="bg-gray-800 p-2 rounded"
            value={c.operator}
            onChange={(e) => updateCondition(i, "operator", e.target.value)}
          >
            <option>{">"}</option>
            <option>{"<"}</option>
            <option>{"="}</option>
          </select>

          <input
            className="bg-gray-800 p-2 rounded"
            placeholder="Value"
            value={c.value}
            onChange={(e) => updateCondition(i, "value", e.target.value)}
          />

          <button
            className="bg-red-600 rounded px-2"
            onClick={() =>
              setConditions(conditions.filter((_, idx) => idx !== i))
            }
          >
            ✕
          </button>
        </div>
      ))}

      <button
        onClick={addCondition}
        className="mt-3 bg-blue-600 px-4 py-2 rounded"
      >
        + Add Condition
      </button>

      <button
        onClick={submitRule}
        className="mt-4 ml-3 bg-green-600 px-4 py-2 rounded"
      >
        Save Rule
      </button>
    </div>
  );
}
