'use client'
import { useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import {
  Breadcrumb,
  Button,
  Select,
  Card,
  CardHeader,
  CardContent,
  Badge,
  Search,
  OverflowMenu,
} from '@cascivo/react'
import type { CatalogAsset, ProjectDetail as ProjectDetailData } from '../../data/catalog'
import { msg } from '../../i18n'
import styles from './ProjectDetail.module.css'

const VERSION_OPTIONS = [
  { value: 'v2.1.0', label: 'v2.1.0' },
  { value: 'v2.0.0', label: 'v2.0.0' },
  { value: 'v1.5.0', label: 'v1.5.0' },
]

interface Props {
  asset: CatalogAsset
  detail: ProjectDetailData
  onBack: () => void
}

export function ProjectDetail({ asset, detail, onBack }: Props) {
  useSignals()

  return (
    <div className={styles['layout']}>
      <div className={styles['main']}>
        <div
          onClick={(e) => {
            const a = (e.target as HTMLElement).closest('a')
            if (a?.getAttribute('href') === '#back') {
              e.preventDefault()
              onBack()
            }
          }}
        >
          <Breadcrumb
            items={[
              { label: t(msg.detailBreadcrumbProjects), href: '#back' },
              { label: asset.name },
            ]}
          />
        </div>

        <div className={styles['header']}>
          <h1 className={styles['title']}>{asset.name}</h1>
          <div className={styles['actions']}>
            <Select
              options={VERSION_OPTIONS}
              value={VERSION_OPTIONS[0]!.value}
              onChange={() => {}}
              aria-label={t(msg.detailVersionLabel)}
            />
            <Button variant="primary">{t(msg.detailDeployBtn)}</Button>
          </div>
        </div>

        <div className={styles['toolbar']}>
          <Search placeholder={t(msg.detailSearchFiles)} onChange={() => {}} />
          <Button variant="secondary" size="sm">
            {t(msg.detailCreateBtn)}
          </Button>
        </div>

        <div className={styles['fileList']}>
          <div className={styles['fileHeader']}>
            <span className={styles['fileHeaderName']}>{t(msg.fileColName)}</span>
            <span className={styles['fileHeaderMeta']}>{t(msg.fileColLastModified)}</span>
            <span className={styles['fileHeaderMeta']}>{t(msg.fileColModifiedBy)}</span>
            <span className={styles['fileHeaderMeta']}>{t(msg.fileColCreatedBy)}</span>
          </div>
          {detail.files.map((file) => (
            <div key={file.id} className={styles['fileRow']}>
              <span className={styles['fileIcon']}>📄</span>
              <span className={styles['fileName']}>{file.name}</span>
              {file.outdated && (
                <Badge variant="warning" size="sm">
                  {t(msg.detailOutdatedBadge)}
                </Badge>
              )}
              <span className={styles['fileMeta']}>{file.lastModified}</span>
              <span className={styles['fileMeta']}>{file.modifiedBy}</span>
              <span className={styles['fileMeta']}>{file.createdBy}</span>
              <OverflowMenu
                ariaLabel={t(msg.detailFileMenu)}
                items={[
                  { label: t(msg.detailFileOpen), value: 'open' },
                  { label: t(msg.detailFileDelete), value: 'delete', destructive: true },
                ]}
                onSelect={() => {}}
              />
            </div>
          ))}
        </div>

        <div className={styles['readme']}>
          <h2 className={styles['readmeTitle']}>📖 {t(msg.detailReadme)}</h2>
          <div className={styles['readmeBody']}>
            {detail.readme.split('\n').map((line, i) => (
              <p key={i} className={styles['readmeLine']}>
                {line}
              </p>
            ))}
          </div>
        </div>
      </div>

      <aside className={styles['sidebar']}>
        <Card>
          <CardHeader>{t(msg.sidebarLatestDeployment)}</CardHeader>
          <CardContent>
            <p className={styles['sidebarRepo']}>{detail.gitRepo}</p>
            <div className={styles['sidebarMeta']}>
              <Badge variant="success" size="sm">
                {detail.deployEnv}
              </Badge>
              <span className={styles['sidebarTime']}>{detail.deployTime}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>{t(msg.sidebarGitRepo)}</CardHeader>
          <CardContent>
            <p className={styles['sidebarRepo']}>{detail.gitRepo}</p>
            <p className={styles['sidebarBranch']}>{detail.gitBranch}</p>
            <div className={styles['sidebarButtons']}>
              <Button variant="secondary" size="sm">
                {t(msg.sidebarSync)}
              </Button>
              <Button variant="secondary" size="sm">
                {t(msg.sidebarConfigure)}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>{t(msg.sidebarAssets)}</CardHeader>
          <CardContent>
            <div className={styles['sidebarAssets']}>
              <span className={styles['assetChip']}>
                {asset.icon} {asset.name}
                <Badge variant={asset.status === 'up-to-date' ? 'success' : 'warning'} size="sm">
                  {asset.status === 'up-to-date'
                    ? t(msg.assetStatusUpToDate)
                    : t(msg.assetStatusOutdated)}
                </Badge>
              </span>
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  )
}
