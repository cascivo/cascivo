import type { ComponentType } from 'react'
import type { BlockCategory, BlockMeta } from '@cascivo/components/blocks/types'

export type { BlockCategory, BlockMeta }

export type BlockEntry = {
  meta: BlockMeta
  load: () => Promise<{ default: ComponentType }>
}

import { meta as appShellMeta } from '@cascivo/blocks/app-shell'
import { meta as authLoginMeta } from '@cascivo/blocks/auth-login'
import { meta as authSignupMeta } from '@cascivo/blocks/auth-signup'
import { meta as dashboardOverviewMeta } from '@cascivo/blocks/dashboard-overview'
import { meta as dashboardTableMeta } from '@cascivo/blocks/dashboard-table'
import { meta as marketingFeaturesMeta } from '@cascivo/blocks/marketing-features'
import { meta as marketingHeroMeta } from '@cascivo/blocks/marketing-hero'
import { meta as settingsProfileMeta } from '@cascivo/blocks/settings-profile'

export const BLOCKS: BlockEntry[] = [
  {
    meta: appShellMeta,
    load: () =>
      import('@cascivo/blocks/app-shell/component').then((m) => ({ default: m.AppShell })),
  },
  {
    meta: authLoginMeta,
    load: () =>
      import('@cascivo/blocks/auth-login/component').then((m) => ({ default: m.AuthLogin })),
  },
  {
    meta: authSignupMeta,
    load: () =>
      import('@cascivo/blocks/auth-signup/component').then((m) => ({ default: m.AuthSignup })),
  },
  {
    meta: dashboardOverviewMeta,
    load: () =>
      import('@cascivo/blocks/dashboard-overview/component').then((m) => ({
        default: m.DashboardOverview,
      })),
  },
  {
    meta: dashboardTableMeta,
    load: () =>
      import('@cascivo/blocks/dashboard-table/component').then((m) => ({
        default: m.DashboardTable,
      })),
  },
  {
    meta: marketingFeaturesMeta,
    load: () =>
      import('@cascivo/blocks/marketing-features/component').then((m) => ({
        default: m.MarketingFeatures,
      })),
  },
  {
    meta: marketingHeroMeta,
    load: () =>
      import('@cascivo/blocks/marketing-hero/component').then((m) => ({
        default: m.MarketingHero,
      })),
  },
  {
    meta: settingsProfileMeta,
    load: () =>
      import('@cascivo/blocks/settings-profile/component').then((m) => ({
        default: m.SettingsProfile,
      })),
  },
]

export const findBlock = (name: string): BlockEntry | undefined =>
  BLOCKS.find((b) => b.meta.name === name)

export const blocksByCategory = (cat: BlockCategory | 'all'): BlockEntry[] =>
  cat === 'all' ? BLOCKS : BLOCKS.filter((b) => b.meta.category === cat)
