export const series = [
  {
    id: 'S01', title: 'Blade of Eternity', genre: 'Shōnen', publicationType: 'Weekly',
    mangakaId: 'U01', editorId: 'U06', status: 'Active', rankingScore: 78.5,
    synopsis: 'In a world where ancient swords hold the power of forgotten gods, a young blacksmith discovers his family\'s legacy is tied to the legendary Blade of Eternity. As dark forces seek to reclaim the blade, he must master its power while uncovering the truth about his lineage. The journey takes him across treacherous lands, forging alliances and facing betrayals.',
    assistantIds: ['U03', 'U04'], createdAt: '2025-04-01', activatedAt: '2025-04-20',
    totalChapters: 24, publishedChapters: 20,
  },
  {
    id: 'S02', title: 'Moonlit Academy', genre: 'Shōjo', publicationType: 'Monthly',
    mangakaId: 'U01', editorId: 'U07', status: 'Active', rankingScore: 65.2,
    synopsis: 'At Tsukimori Academy, an elite school hidden from the mortal world, students with supernatural abilities navigate the complexities of friendship, rivalry, and forbidden romance. When a mysterious transfer student arrives with no memory of her past, the delicate balance of the academy is threatened by secrets that could change everything.',
    assistantIds: ['U05'], createdAt: '2025-06-15', activatedAt: '2025-07-01',
    totalChapters: 8, publishedChapters: 6,
  },
  {
    id: 'S03', title: 'Steel Horizon', genre: 'Seinen', publicationType: 'Bi-Weekly',
    mangakaId: 'U02', editorId: 'U06', status: 'Active', rankingScore: 82.1,
    synopsis: 'In a post-apocalyptic Japan where megacorporations wage silent wars through mecha pilots, a retired soldier is dragged back into combat when his daughter is kidnapped. He must navigate corporate espionage, mech warfare, and political intrigue to save her, while confronting the ghosts of his past missions.',
    assistantIds: ['U03', 'U04', 'U05'], createdAt: '2025-02-10', activatedAt: '2025-03-01',
    totalChapters: 16, publishedChapters: 14,
  },
  {
    id: 'S04', title: 'Whispers of the Deep', genre: 'Horror', publicationType: 'Monthly',
    mangakaId: 'U02', editorId: null, status: 'Proposed', rankingScore: 0,
    synopsis: 'A marine biologist investigating disappearances in a remote fishing village discovers an ancient underwater civilization that should not exist. As the villagers reveal their true nature and the ocean begins to claim more victims, she realizes the depth of horrors lurking beneath the waves. An atmospheric horror manga exploring cosmic dread and isolation.',
    assistantIds: [], createdAt: '2026-05-01', activatedAt: null,
    totalChapters: 0, publishedChapters: 0,
  },
  {
    id: 'S05', title: 'Sakura Knights', genre: 'Fantasy', publicationType: 'Weekly',
    mangakaId: 'U01', editorId: null, status: 'Under Review', rankingScore: 0,
    synopsis: 'When cherry blossom petals become gateways to parallel worlds, a group of high school students is chosen as Sakura Knights — guardians who must protect the boundaries between realms. Each knight wields a unique petal power, but the cost of using it may be their memories. A vibrant fantasy adventure about friendship and sacrifice.',
    assistantIds: [], createdAt: '2026-04-20', activatedAt: null,
    totalChapters: 0, publishedChapters: 0,
  },
  {
    id: 'S06', title: 'Ramen Dynasty', genre: 'Slice of Life', publicationType: 'Monthly',
    mangakaId: 'U02', editorId: 'U06', status: 'On-Hold', rankingScore: 45.3,
    synopsis: 'Follow the heartwarming story of a third-generation ramen chef who inherits her grandmother\'s legendary shop in Tokyo. Between perfecting century-old recipes and modernizing the business, she discovers that the secret ingredient has always been the connections forged over steaming bowls of noodles.',
    assistantIds: ['U04'], createdAt: '2025-01-01', activatedAt: '2025-02-01',
    totalChapters: 12, publishedChapters: 10,
  },
  {
    id: 'S07', title: 'Crimson Protocol', genre: 'Action', publicationType: 'Weekly',
    mangakaId: 'U01', editorId: 'U06', status: 'Cancelled', rankingScore: 22.0,
    synopsis: 'In a dystopian city controlled by AI, a hacker collective known as Crimson Protocol fights to restore human autonomy. When their leader is captured, the remaining members must execute their most dangerous operation yet, risking everything to take down the system that watches everyone.',
    assistantIds: ['U03'], createdAt: '2024-10-01', activatedAt: '2024-11-01',
    totalChapters: 8, publishedChapters: 8,
  },
  {
    id: 'S08', title: 'Garden of Stars', genre: 'Romance', publicationType: 'Monthly',
    mangakaId: 'U02', editorId: 'U07', status: 'On-Hold', rankingScore: 55.8,
    synopsis: 'An astronomer who lost her sight in an accident finds solace in a mysterious botanical garden where the flowers bloom only at night. When she meets the enigmatic gardener who tends to them, she discovers that the flowers are grown from stardust and hold the power to heal. A beautiful romance about finding light in darkness.',
    assistantIds: ['U05'], createdAt: '2025-05-01', activatedAt: '2025-06-01',
    totalChapters: 5, publishedChapters: 4,
  },
];

// Proposals are derived from series in Proposed/Under Review status
export const proposals = [
  {
    id: 'PR01', seriesId: 'S04', mangakaId: 'U02', title: 'Whispers of the Deep',
    genre: 'Horror', publicationType: 'Monthly', status: 'Pending Review',
    synopsis: series[3].synopsis, samplePages: 8,
    createdAt: '2026-05-01', submittedAt: '2026-05-02',
  },
  {
    id: 'PR02', seriesId: 'S05', mangakaId: 'U01', title: 'Sakura Knights',
    genre: 'Fantasy', publicationType: 'Weekly', status: 'Under Review',
    synopsis: series[4].synopsis, samplePages: 12,
    createdAt: '2026-04-20', submittedAt: '2026-04-22',
  },
];
