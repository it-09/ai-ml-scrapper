import type { Fetcher } from "../../fetcher.js";
import type { RawJob, SourceName } from "../types.js";
import { fetchGreenhouseJobs, GREENHOUSE_BOARD_TOKENS } from "./greenhouse.js";
import { fetchLeverJobs, LEVER_COMPANY_SLUGS } from "./lever.js";
import { fetchRemoteOkJobs } from "./remoteok.js";
import { fetchWeWorkRemotelyJobs } from "./weworkremotely.js";
import { fetchYCJobs } from "./yc.js";
import { fetchAshbyJobs, ASHBY_BOARD_SLUGS } from "./ashby.js";
import { fetchOttaJobs, OTTA_COMPANY_SLUGS } from "./otta.js";

export interface AdapterContext {
  fetcher: Fetcher;
  customGreenhouseTokens?: string[];
  customLeverSlugs?: string[];
  customAshbySlugs?: string[];
  customOttaSlugs?: string[];
}

export type AdapterFn = (ctx: AdapterContext) => Promise<RawJob[]>;

export interface AdapterConfig {
  name: SourceName;
  fetch: AdapterFn;
}

export const adapterRegistry: Record<SourceName, AdapterConfig> = {
  greenhouse: {
    name: "greenhouse",
    fetch: (ctx) =>
      fetchGreenhouseJobs(
        ctx.customGreenhouseTokens?.length
          ? ctx.customGreenhouseTokens
          : GREENHOUSE_BOARD_TOKENS,
        ctx.fetcher,
      ),
  },
  lever: {
    name: "lever",
    fetch: (ctx) =>
      fetchLeverJobs(
        ctx.customLeverSlugs?.length
          ? ctx.customLeverSlugs
          : LEVER_COMPANY_SLUGS,
        ctx.fetcher,
      ),
  },
  remoteok: { name: "remoteok", fetch: (ctx) => fetchRemoteOkJobs(ctx.fetcher) },
  weworkremotely: { name: "weworkremotely", fetch: (ctx) => fetchWeWorkRemotelyJobs(ctx.fetcher) },
  yc: { name: "yc", fetch: (ctx) => fetchYCJobs(ctx.fetcher) },
  ashby: {
    name: "ashby",
    fetch: (ctx) =>
      fetchAshbyJobs(
        ctx.customAshbySlugs?.length
          ? ctx.customAshbySlugs
          : ASHBY_BOARD_SLUGS,
        ctx.fetcher,
      ),
  },
  otta: {
    name: "otta",
    fetch: (ctx) =>
      fetchOttaJobs(
        ctx.customOttaSlugs?.length
          ? ctx.customOttaSlugs
          : OTTA_COMPANY_SLUGS,
        ctx.fetcher,
      ),
  },
};
