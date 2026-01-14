/**
 * Skills Registry Page
 * 
 * Browse and discover reusable agent skills.
 */

import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';

const SkillsRegistryPage: React.FC = () => {
  const [category, setCategory] = useState<string | undefined>();
  const { data: skills, isLoading } = trpc.skills.listPublicSkills.useQuery({ category });

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Skills Registry</h1>
      
      {/* Category filter buttons */}
      <div className="flex space-x-2 mb-4">
        <button onClick={() => setCategory(undefined)} className="btn">All</button>
        <button onClick={() => setCategory("coding")} className="btn">Coding</button>
        <button onClick={() => setCategory("writing")} className="btn">Writing</button>
        <button onClick={() => setCategory("analysis")} className="btn">Analysis</button>
      </div>

      {isLoading && <p>Loading skills...</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {skills?.map(skill => (
          <div key={skill.id} className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">{skill.name}</h2>
              <p>{skill.description}</p>
              <div className="card-actions justify-end">
                <div className="badge badge-outline">{skill.category}</div>
                <div className="badge badge-outline">{skill.rating / 100} ★</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkillsRegistryPage;
