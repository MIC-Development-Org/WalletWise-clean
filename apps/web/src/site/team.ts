/** Team G, Undercut Engineers. Emails are deliberately not listed. */
export interface Member {
  name: string;
  role: string;
  batch: string;
  photo?: string;
  github?: string;
  linkedin?: string;
  website?: string;
}

export const LEAD: Member = {
  name: 'Prodhosh VS',
  role: 'Team leader',
  batch: 'Senior, 2025 batch',
  photo: '/team/prodhosh.jpg',
  github: 'https://github.com/prodhosh',
  linkedin: 'https://linkedin.com/in/prodhoshvs',
  website: 'https://prodhosh.me',
};

export const MEMBERS: Member[] = [
  LEAD,
  { name: 'Ashvin K S', role: 'Senior member', batch: '2024 batch' },
  { name: 'Harsh Sharma', role: 'Senior member', batch: '2024 batch' },
  { name: 'Souptik Dam', role: 'Senior member', batch: '2025 batch' },
  { name: 'Yashwant Gokul P', role: 'Junior member', batch: '2025 batch' },
  { name: 'Yojit Arora', role: 'Junior member', batch: 'Junior' },
];
