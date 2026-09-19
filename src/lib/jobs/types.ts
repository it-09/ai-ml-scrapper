export type SourceName =
  | "greenhouse"
  | "lever"
  | "remoteok"
  | "weworkremotely"
  | "yc"
  | "otta"
  | "ashby";

export interface RawJob {
  source: SourceName;
  externalId: string;
  company: string;
  companyWebsite?: string | null;
  title: string;
  department?: string | null;
  employmentType?: string | null;
  location?: string | null;
  remote?: boolean;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  equity?: string | null;
  description: string;
  applyUrl: string;
  postedDate: Date | null;
}

export interface ClassifiedJob extends RawJob {
  hash: string;
  companyIndustry: string | null;
  skills: string[];
  aiFrameworks: string[];
  llmTech: string[];
  vectorDbs: string[];
  agentTooling: string[];
  cloudProviders: string[];
  educationRequirement: string | null;
  visaSponsorship: boolean | null;
  experienceLevel: string | null;
  aiRelevanceScore: number;
  remoteScore: number;
  salaryScore: number;
  skillDensityScore: number;
  companyQualityScore: number;
}
