import { MatchResult, User, UserSkill } from '../types';
import { userService } from './userService';
import { skillService } from './skillService';

function normalizeSkillName(name: string): string {
  return name.toLowerCase().replace(/[^a-zA-Z0-9ก-๙]/g, '');
}

function areSkillsMatching(skillA: string, skillB: string): boolean {
  const normA = normalizeSkillName(skillA);
  const normB = normalizeSkillName(skillB);

  if (normA === normB) return true;
  if (normA.includes(normB) || normB.includes(normA)) return true;
  return false;
}

export const matchService = {
  async getMatchesForUser(currentUserId: string): Promise<MatchResult[]> {
    const [allUsers, allUserSkills] = await Promise.all([
      userService.getAllUsers(),
      skillService.getAllUserSkills(),
    ]);

    const mySkills = allUserSkills.filter((s) => s.userId === currentUserId);
    const myTeachSkills = mySkills.filter((s) => s.type === 'teach');
    const myLearnSkills = mySkills.filter((s) => s.type === 'learn');

    const otherUsers = allUsers.filter(
      (u) => u.id !== currentUserId && u.role !== 'admin' && u.status !== 'suspended'
    );

    const results: MatchResult[] = [];

    for (const partner of otherUsers) {
      const partnerSkills = allUserSkills.filter((s) => s.userId === partner.id);
      const partnerTeachSkills = partnerSkills.filter((s) => s.type === 'teach');
      const partnerLearnSkills = partnerSkills.filter((s) => s.type === 'learn');

      // 1. What they can teach us (skills we want to learn that they can teach)
      const theyCanTeachUs: string[] = [];
      for (const myLearn of myLearnSkills) {
        for (const pTeach of partnerTeachSkills) {
          if (areSkillsMatching(myLearn.skillName, pTeach.skillName)) {
            if (!theyCanTeachUs.includes(pTeach.skillName)) {
              theyCanTeachUs.push(pTeach.skillName);
            }
          }
        }
      }

      // 2. What we can teach them (skills they want to learn that we can teach)
      const weCanTeachThem: string[] = [];
      for (const pLearn of partnerLearnSkills) {
        for (const myTeach of myTeachSkills) {
          if (areSkillsMatching(pLearn.skillName, myTeach.skillName)) {
            if (!weCanTeachThem.includes(myTeach.skillName)) {
              weCanTeachThem.push(myTeach.skillName);
            }
          }
        }
      }

      const isMutualMatch = theyCanTeachUs.length > 0 && weCanTeachThem.length > 0;
      let matchScore = 0;
      let matchPercentage = 0;

      if (isMutualMatch) {
        // High compatibility: 85% - 98%
        const mutualBonus = (theyCanTeachUs.length + weCanTeachThem.length - 2) * 4;
        const ratingBonus = Math.round((partner.rating - 4.5) * 10);
        matchPercentage = Math.min(98, 88 + mutualBonus + Math.max(0, ratingBonus));
        matchScore = matchPercentage;
      } else if (theyCanTeachUs.length > 0 || weCanTeachThem.length > 0) {
        // One-way match: 60% - 75%
        const count = theyCanTeachUs.length + weCanTeachThem.length;
        matchPercentage = Math.min(78, 62 + count * 5);
        matchScore = matchPercentage;
      } else {
        // Category / common interest overlap
        const myCategories = new Set(mySkills.map((s) => s.categoryName));
        const partnerCategories = new Set(partnerSkills.map((s) => s.categoryName));
        let commonCategories = 0;
        myCategories.forEach((cat) => {
          if (cat && partnerCategories.has(cat)) commonCategories++;
        });

        if (commonCategories > 0) {
          matchPercentage = Math.min(48, 30 + commonCategories * 8);
          matchScore = matchPercentage;
        } else {
          matchPercentage = 25;
          matchScore = 25;
        }
      }

      results.push({
        partner,
        matchScore,
        matchPercentage,
        isMutualMatch,
        mutualSkills: {
          theyCanTeachUs,
          weCanTeachThem,
        },
        otherTeachSkills: partnerTeachSkills.map((s) => s.skillName),
        otherLearnSkills: partnerLearnSkills.map((s) => s.skillName),
      });
    }

    // Sort highest match first
    results.sort((a, b) => b.matchPercentage - a.matchPercentage);
    return results;
  },
};
