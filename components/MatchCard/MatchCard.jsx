// 1. Import 'dynamic' from 'next/dynamic'
import dynamic from 'next/dynamic';
import { useState } from 'react';
import MatchCardPreview from './MatchCardPreview';
// import MatchDetailsDialog from './MatchDetailsDialog'; // 2. Remove the old import
import { useUserData } from "@/lib/hooks/useUserData";

// 3. Dynamically import your dialog component
const MatchDetailsDialog = dynamic(() => import('./MatchDetailsDialog'));

const MatchCard = ({ match }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { userData } = useUserData();

  const alreadyJoinedPlayer = userData && match.players && match.players.some(
    (p) =>
      (userData.id && p.userId === userData.id) ||
      (userData.username && p.username === userData.username) ||
      (userData.emailAddresses && p.email === userData.emailAddresses[0]?.emailAddress)
  );

  return (
    <>
      <MatchCardPreview
        match={match} onClick={() => setIsOpen(true)}
      />

      {/* This now automatically code-splits and lazy-loads the dialog */}
      {isOpen &&
        <MatchDetailsDialog
          match={match}
          onClose={() => setIsOpen(false)}
          alreadyJoinedPlayer={alreadyJoinedPlayer}
        />}
    </>
  );
};

export default MatchCard;