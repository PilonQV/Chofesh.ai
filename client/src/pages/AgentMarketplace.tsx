/**
 * Agent Marketplace Page
 * 
 * Discover and install pre-built agents and workflows.
 */

import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';

const AgentMarketplacePage: React.FC = () => {
  const [category, setCategory] = useState<string | undefined>();
  const { data: items, isLoading } = trpc.marketplace.listItems.useQuery({ category });

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Agent Marketplace</h1>

      {isLoading && <p>Loading items...</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items?.map(item => (
          <div key={item.id} className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">{item.name}</h2>
              <p>{item.shortDescription}</p>
              <div className="card-actions justify-end">
                <button className="btn btn-primary">Install</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentMarketplacePage;
