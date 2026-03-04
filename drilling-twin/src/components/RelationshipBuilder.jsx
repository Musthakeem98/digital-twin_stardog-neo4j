import { useState } from "react";

export default function RelationshipBuilder() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [relation, setRelation] = useState("DEPENDS_ON");

  const submitRelation = () => {
    const payload = { from, relation, to };
    console.log("Relationship Payload:", payload);
  };

  return (
    <div className="bg-gray-900 p-6 rounded-lg text-white">
      <h2 className="text-xl font-semibold mb-4">Add Asset Relationship</h2>

      <div className="grid grid-cols-3 gap-3">
        <input
          className="bg-gray-800 p-2 rounded"
          placeholder="From Asset"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />

        <select
          className="bg-gray-800 p-2 rounded"
          value={relation}
          onChange={(e) => setRelation(e.target.value)}
        >
          <option>DEPENDS_ON</option>
          <option>FEEDS</option>
          <option>PART_OF</option>
          <option>MONITORED_BY</option>
        </select>

        <input
          className="bg-gray-800 p-2 rounded"
          placeholder="To Asset"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
      </div>

      <button
        onClick={submitRelation}
        className="mt-4 bg-green-600 px-4 py-2 rounded"
      >
        Save Relationship
      </button>
    </div>
  );
}
